import { v4 as uuidv4 } from 'uuid';
import { defaultSqliteClient, SqliteClient } from '../database/sqlite/client';
import { logger } from '../utils/logger';
import { InvoiceFileStore, defaultInvoiceFileStore } from './invoice-file.store';
import { InvoiceIngestionService, defaultInvoiceIngestionService } from './invoice-ingestion.service';

export const ESTADO_PENDIENTE = 'PENDIENTE_OCR';
export const ESTADO_FALLIDA = 'FALLIDA_OCR';

export interface FacturaEnCola {
  id: string;
  tenant_id: string;
  numero_factura: string;
  estado: string;
  archivo_nombre: string | null;
  archivo_mime: string | null;
  sync_attempts: number;
  ultimo_error: string | null;
  created_at: string;
}

export interface ResultadoCola {
  procesadas: number;
  fallidas: number;
  pendientes: number;
  detalle: Array<{ id: string; estado: string; folio?: string; error?: string }>;
}

/**
 * Cola de facturas que no se pudieron digitalizar en el momento (RF-43).
 *
 * El documento se guarda en disco y la factura queda registrada en estado PENDIENTE_OCR
 * para reintentarla al recuperar la conexión. Tras agotar los intentos pasa a FALLIDA_OCR
 * y deja de reintentarse: una foto ilegible no mejora por insistir, y lo que corresponde es
 * que el usuario la ingrese a mano.
 *
 * La cola vive en el nodo local (SQLite), que es donde importa la ausencia de red.
 */
export class InvoiceQueueService {
  private readonly sqlite: SqliteClient;
  private readonly store: InvoiceFileStore;
  private readonly ingestion: InvoiceIngestionService;
  private readonly maxIntentos: number;

  constructor(sqlite?: SqliteClient, store?: InvoiceFileStore, ingestion?: InvoiceIngestionService, maxIntentos?: number) {
    this.sqlite = sqlite || defaultSqliteClient;
    this.store = store || defaultInvoiceFileStore;
    this.ingestion = ingestion || defaultInvoiceIngestionService;
    const n = Number(maxIntentos ?? process.env.INVOICE_MAX_OCR_ATTEMPTS ?? 3);
    this.maxIntentos = Number.isFinite(n) && n > 0 ? n : 3;
  }

  public get intentosMaximos(): number {
    return this.maxIntentos;
  }

  /**
   * Guarda el documento y lo registra como pendiente. El folio real se desconoce hasta
   * digitalizarlo, así que se usa un identificador provisional visible para el usuario.
   */
  public encolar(
    tenantId: string,
    contenido: string | Buffer,
    fileName?: string,
    mimeType?: string,
    motivo?: string
  ): { id: string; archivo_nombre: string; numero_factura: string } {
    const archivo = this.store.guardar(tenantId, contenido, fileName, mimeType);
    const id = uuidv4();
    const numeroProvisional = `PENDIENTE-${id.slice(0, 8).toUpperCase()}`;

    this.sqlite.execute(
      `INSERT INTO factura_ingresos
         (id, tenant_id, numero_factura, fecha_ingreso, estado, cantidad, metodo_ingreso, total,
          archivo_ruta, archivo_nombre, archivo_mime, ultimo_error, is_dirty, sync_attempts, sync_status)
       VALUES (?, ?, ?, date('now'), ?, 0, 'COLA_OFFLINE', 0, ?, ?, ?, ?, 1, 0, ?)`,
      [id, tenantId, numeroProvisional, ESTADO_PENDIENTE, archivo.ruta, archivo.nombre, archivo.mime,
       motivo || null, ESTADO_PENDIENTE]
    );

    logger.info('InvoiceQueueService', `Factura encolada para reintento posterior: ${numeroProvisional}`, {
      tenantId,
      archivo: archivo.nombre,
      bytes: archivo.bytes
    });

    return { id, archivo_nombre: archivo.nombre, numero_factura: numeroProvisional };
  }

  public listar(tenantId: string, incluirFallidas = true): FacturaEnCola[] {
    const estados = incluirFallidas ? [ESTADO_PENDIENTE, ESTADO_FALLIDA] : [ESTADO_PENDIENTE];
    const marcadores = estados.map(() => '?').join(', ');
    return this.sqlite.query<FacturaEnCola>(
      `SELECT id, tenant_id, numero_factura, estado, archivo_nombre, archivo_mime,
              sync_attempts, ultimo_error, created_at
         FROM factura_ingresos
        WHERE tenant_id = ? AND estado IN (${marcadores})
        ORDER BY created_at ASC`,
      [tenantId, ...estados]
    );
  }

  public contarPendientes(tenantId: string): number {
    const fila = this.sqlite.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM factura_ingresos WHERE tenant_id = ? AND estado = ?`,
      [tenantId, ESTADO_PENDIENTE]
    );
    return Number(fila?.total ?? 0);
  }

  /**
   * Reintenta la digitalización de las facturas pendientes. Cada éxito deriva en una ingesta
   * normal y el ticket de cola se retira; cada fallo incrementa el contador de intentos.
   */
  public async procesarPendientes(tenantId: string): Promise<ResultadoCola> {
    const pendientes = this.sqlite.query<FacturaEnCola & { archivo_ruta: string | null }>(
      `SELECT id, numero_factura, archivo_ruta, archivo_nombre, archivo_mime, sync_attempts
         FROM factura_ingresos
        WHERE tenant_id = ? AND estado = ? AND sync_attempts < ?
        ORDER BY created_at ASC`,
      [tenantId, ESTADO_PENDIENTE, this.maxIntentos]
    );

    const resultado: ResultadoCola = { procesadas: 0, fallidas: 0, pendientes: 0, detalle: [] };

    for (const factura of pendientes) {
      if (!factura.archivo_ruta || !this.store.existe(factura.archivo_ruta)) {
        this.marcarFallida(factura.id, 'El documento almacenado no está disponible en disco');
        resultado.fallidas += 1;
        resultado.detalle.push({ id: factura.id, estado: ESTADO_FALLIDA, error: 'documento no disponible' });
        continue;
      }

      const intentos = Number(factura.sync_attempts ?? 0) + 1;

      try {
        const base64 = this.store.leerBase64(factura.archivo_ruta);
        const ingresada = await this.ingestion.ingestInvoice(tenantId, {
          invoiceData: base64,
          fileName: factura.archivo_nombre || undefined,
          mimeType: factura.archivo_mime || undefined
        });

        // El ticket de cola cumplió su función: la factura real ya quedó registrada
        this.sqlite.execute('DELETE FROM factura_ingresos WHERE id = ?', [factura.id]);
        resultado.procesadas += 1;
        resultado.detalle.push({
          id: factura.id,
          estado: 'PROCESADA',
          folio: ingresada.folio_factura
        });
        logger.info('InvoiceQueueService', `Factura de la cola digitalizada en el intento ${intentos}`, { id: factura.id });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        if (intentos >= this.maxIntentos) {
          this.marcarFallida(factura.id, mensaje, intentos);
          resultado.fallidas += 1;
          resultado.detalle.push({ id: factura.id, estado: ESTADO_FALLIDA, error: mensaje });
        } else {
          this.sqlite.execute(
            'UPDATE factura_ingresos SET sync_attempts = ?, ultimo_error = ? WHERE id = ?',
            [intentos, mensaje, factura.id]
          );
          resultado.pendientes += 1;
          resultado.detalle.push({ id: factura.id, estado: ESTADO_PENDIENTE, error: mensaje });
        }
        logger.warn('InvoiceQueueService', `Reintento ${intentos} de ${this.maxIntentos} sin exito`, {
          id: factura.id,
          error: mensaje
        });
      }
    }

    resultado.pendientes = this.contarPendientes(tenantId);
    return resultado;
  }

  private marcarFallida(id: string, motivo: string, intentos?: number): void {
    this.sqlite.execute(
      `UPDATE factura_ingresos
          SET estado = ?, sync_status = ?, is_dirty = 0, ultimo_error = ?, sync_attempts = ?, procesado_at = datetime('now')
        WHERE id = ?`,
      [ESTADO_FALLIDA, ESTADO_FALLIDA, motivo, intentos ?? this.maxIntentos, id]
    );
  }
}

export const defaultInvoiceQueue = new InvoiceQueueService();
