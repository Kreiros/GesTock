# Reglas y Memoria Persistente de Ingeniería (Antigravity / AI Agent)

## 1. Inspección Previa Obligatoria de Memoria Local (Ahorro de Tokens)
Antes de buscar soluciones en la web (`search_web`), indagar a ciegas o inferir arquitecturas desde cero para problemas de:
* **Lighthouse & Accesibilidad (WCAG):** Contraste de color, pesos de auditorías, `label-content-name-mismatch`.
* **Rendimiento & Core Web Vitals:** Variaciones de Speed Index, LCP, TBT, TTFB, caché en `localStorage`.
* **Backend Edge & Cloudflare:** Workers, Hono, V8 Isolates, Cloudflare D1 (SQLite Serverless), variables de entorno.
* **Autenticación & Seguridad:** Google OAuth 2.0 PKCE, Web Crypto API, cookies de sesión `HttpOnly`, sincronización de popups.
* **Email & Notificaciones:** Resend API, manejo de subdominios (`mail.hublab.tech`), política de cola de alta demanda.
* **AEO & GEO:** Optimización para motores de respuesta de IA (Gemini, Perplexity, ChatGPT, Claude) y Schema JSON-LD.

**EL AGENTE DEBE CONSULTAR PRIMERO LA BÓVEDA CENTRAL DE CONOCIMIENTO:**
📂 **Ruta:** `F:\Obsidian\Memoria\Nexo de Datos`
* ⚡ **Índice Rápido:** [`F:\Obsidian\Memoria\Nexo de Datos\05 - MEMORIA & APRENDIZAJES IA\⚡ INDICE_SOLUCIONES_RAPIDAS.md`](file:///F:/Obsidian/Memoria/Nexo%20de%20Datos/05%20-%20MEMORIA%20&%20APRENDIZAJES%20IA/⚡%20INDICE_SOLUCIONES_RAPIDAS.md)
* 🛠️ **Solucionario:** [`F:\Obsidian\Memoria\Nexo de Datos\03 - SOLUCIONARIO & TROUBLESHOOTING\`](file:///F:/Obsidian/Memoria/Nexo%20de%20Datos/03%20-%20SOLUCIONARIO%20&%20TROUBLESHOOTING)
* ☁️ **Patrones de Arquitectura:** [`F:\Obsidian\Memoria\Nexo de Datos\02 - PATRONES DE ARQUITECTURA\`](file:///F:/Obsidian/Memoria/Nexo%20de%20Datos/02%20-%20PATRONES%20DE%20ARQUITECTURA)

---

## 2. Actualización Obligatoria de Documentación ante Toda Petición Resuelta
**REGLA CRÍTICA:** Cada vez que el agente resuelva una petición del usuario, implemente una mejora o solucione una incidencia técnica, **DEBE actualizar inmediatamente la documentación correspondiente en el lugar exacto donde pertenezca:**

1. **Documentación del Proyecto en Curso:**
   * Actualizar los archivos técnicos en la carpeta `docs/` del proyecto (por ejemplo `docs/ESTADO_ACTUAL_PROYECTO.md`, `docs/MANUAL_FUNCIONALIDADES.md` o `docs/ARQUITECTURA_SISTEMA.md`).
2. **Soluciones Reutilizables y Post-Mortems:**
   * Si la incidencia resuelta involucra errores de APIs, configuraciones de infraestructura, bugs de renderizado o cuotas de terceros: documentar la causa raíz y la solución en `F:\Obsidian\Memoria\Nexo de Datos\03 - SOLUCIONARIO & TROUBLESHOOTING\`.
   * Registrar inmediatamente la entrada en la matriz de `F:\Obsidian\Memoria\Nexo de Datos\05 - MEMORIA & APRENDIZAJES IA\⚡ INDICE_SOLUCIONES_RAPIDAS.md`.
3. **Nuevos Patrones de Arquitectura:**
   * Si se diseña o implementa una arquitectura nueva reutilizable para otros proyectos (ej. nuevos endpoints Hono, tablas D1, webhooks, colas): redactar o actualizar la nota en `F:\Obsidian\Memoria\Nexo de Datos\02 - PATRONES DE ARQUITECTURA\`.
4. **Cero Deuda de Documentación:** Ningún cambio funcional o corrección debe considerarse terminado hasta que su documentación viva esté reflejada tanto en el repositorio Git como en la bóveda de Obsidian.
