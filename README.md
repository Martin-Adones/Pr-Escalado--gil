# Pr-Escalado-Agil

Sistema de suscripciones y contratos basado en microservicios Node.js (Fastify) + PostgreSQL + React (Vite).

## Arquitectura

```
Pr-Escalado-Agil/
├── backend/
│   ├── shared/                  # Código compartido (pg-client, BaseRepository, validación, swagger)
│   ├── PDAE-API-GATEWAY/        # API Gateway (puerto 3001)
│   ├── PDAE-MS-CONTRATOS/       # Microservicio Contratos (3002)
│   ├── PDAE-MS-USUARIOS/        # Microservicio Usuarios (3003)
│   ├── PDAE-MS-PLANES/          # Microservicio Planes (3004)
│   ├── PDAE-MS-PRODUCTOS/       # Microservicio Productos (3005)
│   ├── PDAE-MS-SOPORTE/         # Microservicio Soporte (3006)
│   ├── PDAE-MS-AUDITORIA/       # Microservicio Auditoría (3007)
│   └── database/                # Scripts SQL (init.sql + funciones por MS)
├── frontend/                    # React + Vite + TypeScript (puerto 5173)
└── docker-compose.yml           # Orquestación completa
```

## Requisitos

- Node.js >= 18.18
- Docker + Docker Compose (opcional)
- PostgreSQL 15 (o usar el contenedor de Docker)

## Inicio rápido (local)

```bash
# 1. Clonar y entrar
cd Pr-Escalado-Agil

# 2. Configurar variables de entorno
cp env.example .env

# 3. Instalar dependencias (workspace npm)
cd backend && npm install

# 4. Compilar shared
cd shared && npm run build && cd ..

# 5. Base de datos
#   - Opción A) Docker: docker compose up -d db
#   - Opción B) Local: crear DB 'microservicio_db' y ejecutar database/init.sql

# 6. Iniciar un MS (ej. contratos)
cd PDAE-MS-CONTRATOS && npm run dev
```

## Inicio rápido (Docker)

```bash
docker compose up --watch
```

Esto levanta: PostgreSQL, los 6 MS, API Gateway y el Frontend con hot-reload.

## Comandos útiles

```bash
# Tests (todos los MS)
cd backend && npm run test --workspaces --if-present

# Tests (MS específico)
cd backend/PDAE-MS-CONTRATOS && npm test

# Compilar shared
cd backend/shared && npm run build

# Logs de un servicio
docker compose logs -f ms-contratos

# Documentación Swagger
# http://localhost:3001/api-doc
```

## Variables de entorno principales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_HOST` | Host PostgreSQL | localhost |
| `DB_PORT` | Puerto PostgreSQL | 5432 |
| `DB_USER` | Usuario BD | postgres |
| `DB_PASSWORD` | Contraseña BD | postgres |
| `DB_NAME` | Nombre BD | microservicio_db |
| `GATEWAY_PORT` | Puerto API Gateway | 3001 |
| `FRONTEND_PORT` | Puerto Frontend | 5173 |
| `CORS_ORIGIN` | Origen permitido CORS | http://localhost:5173 |

## Estructura de una petición

1. **Frontend** → `/api/*` → **API Gateway** (proxy por prefijo de ruta)
2. **API Gateway** → enruta al MS correspondiente según `MS_RUTAS_URL`
3. **MS** → valida DTO → servicio → repositorio → `SELECT * FROM sp_*`
4. **Respuesta** → JSON `{ success, data }` o `{ success: false, message }`
