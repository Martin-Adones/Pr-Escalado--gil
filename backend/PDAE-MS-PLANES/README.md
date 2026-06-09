# PDAE · Microservicio Planes

API REST (Fastify) que expone el ciclo de vida de **planes** y permite registrar productos asociados. La regla de negocio principal vive en **PostgreSQL** (`database/planes/planes_funciones.sql` en el repo padre); este servicio valida entradas, llama a los procedimientos y devuelve JSON.

---

## Como se organiza una peticion

1. **Ruta** (`src/routes/`) — registra URL, metodo y esquema OpenAPI/validacion.
2. **Controlador** (`src/controllers/`) — lee cuerpo o query, valida con DTOs y responde HTTP (200 / 400 / 500).
3. **Servicio** (`src/services/`) — orquesta el caso de uso sin conocer HTTP.
4. **Repositorio** (`src/repositories/`) — arma parametros y ejecuta `SELECT * FROM sp_…($1,…)` via `BaseRepository`.
5. **Base de datos** — funciones PL/pgSQL (`sp_crear_plan`, etc.).

---

## Punto de entrada y aplicacion

| Archivo / simbolo | Que hace |
|-------------------|----------|
| **`src/server.ts`** | Carga `dotenv`, crea el servidor con `createServer()`, comprueba conexion a la BD (`SELECT NOW()`), escucha en `PORT` (por defecto **3004**) e imprime la URL de documentacion. |
| **`src/app.ts` → `createServer`** | Construye la instancia Fastify: CORS, rate limit, Helmet, metricas en `/monitor` (excepto en tests), Swagger, rutas `/api/health` y `/api/planes/…`. |

---

## Rutas HTTP

| Archivo | Funcion / export | Uso |
|---------|------------------|-----|
| **`src/routes/planes.routes.ts`** | `rutasPlanes` (default) | Registra `POST /planes/crear`, `GET /planes/listar`, `POST /planes/actualizar`, `POST /planes/desactivar`, `POST /planes/registrar-productos` (con prefijo `/api` en `app.ts`). Los esquemas JSON estan en `src/utils/api-doc/planes-route-schemas.ts`. |
| **`src/routes/health-routes.ts`** | `rutasSalud` (default) | `GET /api/health` — comprobacion de que el proceso responde (balanceadores, Kubernetes, etc.). |

---

## Controlador de planes

**Clase:** `PlanesController` en `src/controllers/planes.controller.ts`.

| Metodo | Rol |
|--------|-----|
| **`manejarCrearPlan`** | Valida `CrearPlanEntradaDto`, llama `servicio.crearPlan`, responde `{ success, data }` o error de validacion / 500. |
| **`manejarListarPlanes`** | Lee **query** (GET), valida `ListarPlanesConsultaDto` → `listarPlanes`. |
| **`manejarActualizarPlan`** | Valida `ActualizarPlanEntradaDto` → `actualizarPlan`. |
| **`manejarDesactivarPlan`** | Valida `DesactivarPlanEntradaDto` → `desactivarPlan`. |
| **`manejarRegistrarProductosPlan`** | Valida `RegistrarProductosPlanEntradaDto` → `registrarProductosPlan`. |

Errores cuyo mensaje empieza por `Error de Validacion:` → respuesta **400**; el resto de excepciones → **500**.

---

## Servicio de planes

**Clase:** `PlanesService` en `src/services/planes.service.ts`. Solo delega en el repositorio (util para tests y para no mezclar HTTP con datos).

| Metodo | Uso |
|--------|-----|
| **`crearPlan`** | Pasa el DTO a `ejecutarCrearPlan`. |
| **`listarPlanes`** | → `ejecutarListarPlanes`. |
| **`actualizarPlan`** | → `ejecutarActualizarPlan`. |
| **`desactivarPlan`** | → `ejecutarDesactivarPlan`. |
| **`registrarProductosPlan`** | → `ejecutarRegistrarProductosPlan`. |

---

## Repositorio y acceso a datos

### `PlanesRepository` (`src/repositories/planes.repository.ts`)

Extiende `BaseRepository`. Cada metodo traduce el DTO al **orden de argumentos** que espera la funcion en PostgreSQL.

| Metodo | Procedimiento SQL | Uso |
|--------|-------------------|-----|
| **`ejecutarCrearPlan`** | `sp_crear_plan` | Alta de plan (nombre, ciclo, monto, isActive opcional). |
| **`ejecutarListarPlanes`** | `sp_listar_planes` | Listado filtrado y paginado; incluye `total_count` por fila. |
| **`ejecutarActualizarPlan`** | `sp_actualizar_plan` | Actualizacion parcial (solo campos enviados). |
| **`ejecutarDesactivarPlan`** | `sp_desactivar_plan` | Marca el plan como inactivo sin borrar la fila. |
| **`ejecutarRegistrarProductosPlan`** | `sp_registrar_productos_plan` | Registra productos en un plan (tabla Plans_Products). |

### `BaseRepository` (`src/repositories/base-repository.ts`)

| Miembro | Uso |
|---------|-----|
| **`callProcedure`** | Abre cliente del pool, `BEGIN`, ejecuta `SELECT * FROM nombre_funcion($1,…)`, detecta si la primera columna es un **cursor** de PostgreSQL y en ese caso hace `FETCH ALL`, `COMMIT` o `ROLLBACK` si falla, libera el cliente. Con `NODE_ENV=mock` no toca la BD y devuelve datos simulados. |
| **`mapResponse` (privado)** | Quita prefijos tipo `p_` / `pi_` en nombres de columnas del resultado. |
| **`getMockData` (privado)** | Respuesta minima para modo mock. |

### `pg-client` (`src/database/pg-client.ts`)

Exporta **`db`**: `query` y `getClient` sobre un **Pool** de `pg`, usando `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

## Modelos y validacion

| Archivo / simbolo | Uso |
|-------------------|-----|
| **`src/models/planes.dtos.ts`** | Clases **DTO** con `class-validator`: `CrearPlanEntradaDto`, `ListarPlanesConsultaDto`, `ActualizarPlanEntradaDto`, `DesactivarPlanEntradaDto`, `RegistrarProductosPlanEntradaDto`; tipos de fila `FilaPlan`, `FilaPlanListado`, `FilaPlanProducto`. Definen que puede entrar y salir tipado. |
| **`src/utils/validator.ts` → `transformAndValidate`** | Convierte JSON plano a instancia del DTO (`class-transformer`) y valida (`class-validator`); si falla, lanza error con prefijo `Error de Validacion:`. |

---

## Documentacion OpenAPI (Swagger)

| Archivo / simbolo | Uso |
|-------------------|-----|
| **`src/utils/api-doc/swagger.ts` → `registerSwagger`** | Registra `@fastify/swagger` y `@fastify/swagger-ui` en **`/api-doc`**. Servidores: `PUBLIC_URL` si existe; si no, `http://<host>:<PORT>` y opcion relativa `/`. |
| **`src/utils/api-doc/openapi-schemas.ts`** | Fragmentos reutilizables: respuestas 200/400/500, propiedades de fila de plan. |
| **`src/utils/api-doc/planes-route-schemas.ts`** | Esquemas completos por ruta (body/query/response) para no inflar `planes.routes.ts`. |

---

## Scripts npm

| Comando | Descripcion |
|---------|-------------|
| **`npm run dev`** | Desarrollo con recarga (`ts-node-dev`). |
| **`npm run build`** | Compila TypeScript a `dist/`. |
| **`npm start`** | Ejecuta `node dist/server.js`. |
| **`npm run mock`** | Servidor con `NODE_ENV=mock` (repositorio no ejecuta SQL real). |
| **`npm test`** | Jest. |

---

## Variables de entorno relevantes

| Variable | Uso |
|----------|-----|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexion PostgreSQL. |
| `PORT` | Puerto HTTP (por defecto **3004**). |
| `NODE_ENV` | `test` desactiva logger y metricas en app; `mock` activa datos simulados en repositorio. |
| `PUBLIC_URL` | Base URL en el desplegable de Swagger (sin barra final). |
| `SWAGGER_HOST` | Host mostrado en servidores locales (se fuerza `localhost` si viene `127.0.0.1`). |
| `REQUEST_LOG`, `LOG_LEVEL`, `LOG_DB` | Control fino de logs HTTP y de tiempo de cada llamada a procedimiento. |

Antes de levantar el servicio, aplica en la base el script **`../database/init.sql`** y luego **`../database/planes/planes_funciones.sql`** (desde la raiz del repositorio padre `Subscripciones-y-Contratos-ms`).
