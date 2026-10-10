import { GeminiOcrProvider, defaultGeminiOcrProvider } from './gemini-ocr.provider';
import { MockOcrProvider, defaultMockOcrProvider } from './mock-ocr.provider';
import { defaultPdfInvoiceExtractor } from './pdf-invoice.extractor';
import { IOcrProvider } from './ocr-provider.interface';
import { ExtractedInvoiceData, InvoiceInput } from './types';
import { logger } from '../utils/logger';

export class OcrDispatcherService {
  private primaryProvider: IOcrProvider;
  private fallbackProvider: IOcrProvider;

  constructor(primary?: IOcrProvider, fallback?: IOcrProvider) {
    this.primaryProvider = primary || defaultGeminiOcrProvider;
    this.fallbackProvider = fallback || defaultMockOcrProvider;
  }

  public async processInvoice(input: InvoiceInput): Promise<{
    data: ExtractedInvoiceData;
    usedFallback: boolean;
    providerName: string;
  }> {
    // 1. Intentar proveedor primario (Google Gemini AI) si está configurado
    try {
      logger.info('OcrDispatcher', `Attempting OCR extraction with primary provider: ${this.primaryProvider.name}`);
      const data = await this.primaryProvider.extractInvoiceData(input);
      return {
        data,
        usedFallback: false,
        providerName: this.primaryProvider.name
      };
    } catch (primaryError) {
      logger.warn('OcrDispatcher', `Primary provider ${this.primaryProvider.name} unavailable or failed: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}`);

      // 2. Intentar extractor nativo de PDF (Digital Chilean DTE) si es un PDF o contiene texto DTE
      try {
        const pdfData = await defaultPdfInvoiceExtractor.extractFromPdf(input);
        if (pdfData && (pdfData.items.length > 0 || pdfData.total > 0 || Boolean(pdfData.folio_factura))) {
          logger.info('OcrDispatcher', `Successfully extracted invoice metadata using native Chilean PDF DTE Extractor`);
          return {
            data: pdfData,
            usedFallback: true,
            providerName: 'ChileanPdfDteExtractor'
          };
        }
      } catch (pdfErr) {
        logger.debug('OcrDispatcher', 'PDF native extraction attempt failed or not applicable', { error: String(pdfErr) });
      }

      // 3. Fallback controlado
      // El simulador solo participa si se habilita por configuración (ENABLE_MOCK_OCR=true) o si
      // una prueba fuerza el fallo fuera de producción. simulateFailure llega desde el cuerpo de la
      // petición, así que en producción no puede engancharlo un cliente: inventaría datos fiscales
      // y proveedores inexistentes y la pantalla los mostraría como reales.
      const isProduction = process.env.NODE_ENV === 'production';
      const mockEnabled = process.env.ENABLE_MOCK_OCR === 'true';
      const simulacionDePrueba = input.simulateFailure === true && !isProduction;

      if (!mockEnabled && !simulacionDePrueba) {
        throw new Error(
          'No fue posible digitalizar el documento mediante IA ni extracción nativa de PDF. ' +
          'Verifique la legibilidad de la imagen o ingrese la factura manualmente.'
        );
      }

      logger.warn('OcrDispatcher', `Engaging fallback mock provider: ${this.fallbackProvider.name}`);
      const fallbackData = await this.fallbackProvider.extractInvoiceData(input);
      return {
        data: fallbackData,
        usedFallback: true,
        providerName: this.fallbackProvider.name
      };
    }
  }
}

export const defaultOcrDispatcher = new OcrDispatcherService();

