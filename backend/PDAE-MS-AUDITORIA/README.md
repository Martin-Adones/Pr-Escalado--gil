# PDAE · Microservicio Auditoría

API REST (Fastify) que expone logs de auditoría del sistema: listar con filtros y paginación. La lógica principal vive en PostgreSQL (`database/auditoria/auditoria_funciones.sql`).

---

## Rutas HTTP

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/auditoria/listar` | GET | Listado paginado y filtrado de logs (acción, fechas, usuario asignado). |
| `/api/health` | GET | Health check del servicio. |

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con recarga (`ts-node-dev`). |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm start` | Ejecuta `node dist/server.js`. |
| `npm run mock` | Servidor con `NODE_ENV=mock`. |
| `npm test` | Jest. |

---

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión PostgreSQL. |
| `PORT` | Puerto HTTP (por defecto **3007**). |
| `NODE_ENV` | `test` desactiva logger y métricas; `mock` activa datos simulados. |

Antes de levantar, ejecuta `database/init.sql` y luego `database/auditoria/auditoria_funciones.sql`.
