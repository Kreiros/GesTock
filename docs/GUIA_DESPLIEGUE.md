# 🚀 GesTock — Guía de Despliegue y Operaciones

#despliegue #docker #devops #gestock

---

## 1. Requisitos Previos
* Node.js >= 20.x
* PostgreSQL >= 15.x
* Certificado Digital X.509 (.pfx / .p12) registrado ante el SII

---

## 2. Variables de Entorno (\`.env\`)
\`\`\`env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/gestock_db
SQLITE_DB_PATH=./data/pos_local.sqlite
JWT_SECRET=super_secret_jwt_key
GEMINI_API_KEY=AIzaSy...
SII_ENVIRONMENT=certification # o production
\`\`\`

---

## 3. Comandos de Ejecución y Migración
\`\`\`bash
# Instalar dependencias
npm install

# Ejecutar migraciones en PostgreSQL y SQLite
npm run migrate:pg
npm run migrate:sqlite

# Ejecutar suite de pruebas unitarias
npm run test:unit

# Compilar TypeScript e iniciar en producción
npm run build
npm start
\`\`\`

---

## 4. Enlaces Relacionados
* [[01 - PROYECTOS/GesTock/INDEX|GesTock Hub Principal]]
* [[PostgreSQL Transaccional vs SQLite Edge]]
* [[Docker & Dockerfile en Node]]
