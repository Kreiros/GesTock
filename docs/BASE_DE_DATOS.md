# 🗄️ GesTock — Modelo de Base de Datos y Persistencia

#database #postgresql #sqlite #erd #mer #gestock

---

## 1. Arquitectura de Datos Dual
GesTock mantiene dos esquemas alineados:
1. **PostgreSQL (Nube Central):** Soporte multi-tenant con esquemas de particionado por \`tenant_id\`, tipos extendidos (UUID, JSONB, Timestamps con zona horaria).
2. **SQLite (POS Edge):** Esquema embebido local optimizado para lecturas instantáneas de catálogo y registros secuenciales de ventas offline.

---

## 2. Diagrama Entidad-Relación (MER)

\`\`\`mermaid
erDiagram
    TENANTS ||--o{ USUARIOS : "agrupa"
    TENANTS ||--o{ PRODUCTOS : "posee_catalogo"
    TENANTS ||--o{ PROVEEDORES : "gestiona"
    PROVEEDORES ||--o{ FACTURA_INGRESOS : "emite_a"
    FACTURA_INGRESOS ||--|{ DETALLE_FACTURA_INGRESOS : "desglosa_en"
    PRODUCTOS ||--o{ DETALLE_FACTURA_INGRESOS : "comprado_en"
    PRODUCTOS ||--o{ LOTES : "controla_vencimiento"
    PRODUCTOS ||--o{ MOVIMIENTOS_INVENTARIO : "audita_stock"
    USUARIOS ||--o{ SESIONES_CAJA : "opera_caja"
    SESIONES_CAJA ||--o{ TRANSACCIONES_VENTA : "contiene_ventas"
    TRANSACCIONES_VENTA ||--|{ DETALLE_VENTA : "desglosa_en"
    PRODUCTOS ||--o{ DETALLE_VENTA : "se_vende_en"
    METODOS_PAGO ||--o{ TRANSACCIONES_VENTA : "paga_con"
    TRANSACCIONES_VENTA ||--o| DOCUMENTOS_TRIBUTARIOS : "genera_dte"
\`\`\`

---

## 3. Módulos y Tablas Principales
* **Núcleo SaaS:** \`TENANTS\`, \`USUARIOS\`, \`PLANES_FACTURACION\`, \`CONFIGURACION_SISTEMA\`.
* **Inventario & Kardex:** \`PRODUCTOS\`, \`LOTES\`, \`MOVIMIENTOS_INVENTARIO\`, \`MOVIMIENTOS_INVENTARIO_TIPOS\`.
* **Proveedores & Compras:** \`PROVEEDORES\`, \`FACTURA_INGRESOS\`, \`DETALLE_FACTURA_INGRESOS\`, \`CATALOGO_BORRADORES\`.
* **Punto de Venta & Fiscal:** \`SESIONES_CAJA\`, \`TRANSACCIONES_VENTA\`, \`DETALLE_VENTA\`, \`METODOS_PAGO\`, \`DOCUMENTOS_TRIBUTARIOS\`.

---

## 4. Conceptos y Enlaces Relacionados
* [[01 - PROYECTOS/GesTock/INDEX|GesTock Hub Principal]]
* [[PostgreSQL Transaccional vs SQLite Edge]]
* [[Motor de Inventario y Stock]]
* [[Modelado Relacional y Foreign Keys]]
* [[Migraciones y Esquemas SQL]]
