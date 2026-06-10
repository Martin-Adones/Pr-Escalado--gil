# PDAE · Microservicio Contratos

API REST (Fastify) que expone el ciclo de vida de **contratos**: crear, listar, actualizar y finalizar. La regla de negocio principal vive en **PostgreSQL** (`database/contratos/contratos_funciones.sql` en el repo padre); este servicio valida entradas, llama a los procedimientos y devuelve JSON.

---

## Cómo se organiza una petición

1. **Ruta** (`src/routes/`) — registra URL, método y esquema OpenAPI/validación.
2. **Controlador** (`src/controllers/`) — lee cuerpo o query, valida con DTOs y responde HTTP (200 / 400 / 500).
3. **Servicio** (`src/services/`) — orquesta el caso de uso sin conocer HTTP.
4. **Repositorio** (`src/repositories/`) — arma parámetros y ejecuta `SELECT * FROM sp_…($1,…)` vía `BaseRepository`.
5. **Base de datos** — funciones PL/pgSQL (`sp_crear_contrato`, etc.).

---

## Punto de entrada y aplicación

| Archivo / símbolo | Qué hace |
|-------------------|----------|
| **`src/server.ts`** | Carga `dotenv`, crea el servidor con `createServer()`, comprueba conexión a la BD (`SELECT NOW()`), escucha en `PORT` (por defecto **3002**) e imprime la URL de documentación. |
| **`src/app.ts` → `createServer`** | Construye la instancia Fastify: CORS, rate limit, Helmet, métricas en `/monitor` (excepto en tests), Swagger, rutas `/api/health` y `/api/contratos/…`. |

---

## Rutas HTTP

| Archivo | Función / export | Uso |
|---------|------------------|-----|
| **`src/routes/contratos.routes.ts`** | `rutasContratos` (default) | Registra `POST /contratos/crear`, `POST /contratos/finalizar`, `GET /contratos/listar`, `POST /contratos/actualizar` (con prefijo `/api` en `app.ts`). Los esquemas JSON están en `src/utils/api-doc/contratos-route-schemas.ts`. |
| **`src/routes/health-routes.ts`** | `rutasSalud` (default) | `GET /api/health` — comprobación de que el proceso responde (balanceadores, Kubernetes, etc.). |

---

## Controlador de contratos

**Clase:** `ContratosController` en `src/controllers/contratos.controller.ts`.

| Método | Rol |
|--------|-----|
| **`manejarCrearContrato`** | Valida `CrearContratoEntradaDto`, llama `servicio.crearContrato`, responde `{ success, data }` o error de validación / 500. |
| **`manejarFinalizarContrato`** | Igual patrón con `FinalizarContratoEntradaDto` → `finalizarContrato`. |
| **`manejarListarContratos`** | Lee **query** (GET), valida `ListarContratosConsultaDto` → `listarContratos`. |
| **`manejarActualizarContrato`** | Valida `ActualizarContratoEntradaDto` → `actualizarContrato`. |

Errores cuyo mensaje empieza por `Error de Validación:` → respuesta **400**; el resto de excepciones → **500**.

---

## Servicio de contratos

**Clase:** `ContratosService` en `src/services/contratos.service.ts`. Solo delega en el repositorio (útil para tests y para no mezclar HTTP con datos).

| Método | Uso |
|--------|-----|
| **`crearContrato`** | Pasa el DTO a `ejecutarCrearContrato`. |
| **`finalizarContrato`** | → `ejecutarFinalizarContrato`. |
| **`listarContratos`** | → `ejecutarListarContratos`. |
| **`actualizarContrato`** | → `ejecutarActualizarContrato`. |

---

## Repositorio y acceso a datos

### `ContratosRepository` (`src/repositories/contratos.repository.ts`)

Extiende `BaseRepository`. Cada método traduce el DTO al **orden de argumentos** que espera la función en PostgreSQL.

| Método | Procedimiento SQL | Uso |
|--------|-------------------|-----|
| **`ejecutarCrearContrato`** | `sp_crear_contrato` | Alta de contrato (usuario, plan, estado, fechas opcionales). |
| **`ejecutarFinalizarContrato`** | `sp_finalizar_contrato` | Marca el contrato como `TERMINATED` sin borrar la fila. |
| **`ejecutarListarContratos`** | `sp_listar_contratos` | Listado filtrado y paginado; incluye `total_count` por fila. |
| **`ejecutarActualizarContrato`** | `sp_actualizar_contrato` | Actualización parcial (solo campos enviados). |

### `BaseRepository` (`src/repositories/base-repository.ts`)

| Miembro | Uso |
|---------|-----|
| **`callProcedure`** | Abre cliente del pool, `BEGIN`, ejecuta `SELECT * FROM nombre_función($1,…)`, detecta si la primera columna es un **cursor** de PostgreSQL y en ese caso hace `FETCH ALL`, `COMMIT` o `ROLLBACK` si falla, libera el cliente. Con `NODE_ENV=mock` no toca la BD y devuelve datos simulados. |
| **`mapResponse` (privado)** | Quita prefijos tipo `p_` / `pi_` en nombres de columnas del resultado. |
| **`getMockData` (privado)** | Respuesta mínima para modo mock. |

### `pg-client` (`src/database/pg-client.ts`)

Exporta **`db`**: `query` y `getClient` sobre un **Pool** de `pg`, usando `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

## Modelos y validación

| Archivo / símbolo | Uso |
|-------------------|-----|
| **`src/models/contratos.dtos.ts`** | Clases **DTO** con `class-validator`: `CrearContratoEntradaDto`, `FinalizarContratoEntradaDto`, `ListarContratosConsultaDto`, `ActualizarContratoEntradaDto`; tipos de fila `FilaContrato`, `FilaContratoListado`. Definen qué puede entrar y salir tipado. |
| **`src/utils/validator.ts` → `transformAndValidate`** | Convierte JSON plano a instancia del DTO (`class-transformer`) y valida (`class-validator`); si falla, lanza error con prefijo `Error de Validación:`. |
| **`src/domain/estados-contrato.ts`** | Constantes `CONTRATO_ESTADOS`, `CONTRATO_ESTADOS_INICIAL` y tipo `EstadoContrato`, alineados con los estados que valida PostgreSQL. |

---

## Documentación OpenAPI (Swagger)

| Archivo / símbolo | Uso |
|-------------------|-----|
| **`src/utils/api-doc/swagger.ts` → `registerSwagger`** | Registra `@fastify/swagger` y `@fastify/swagger-ui` en **`/api-doc`**. Servidores: `PUBLIC_URL` si existe; si no, `http://<host>:<PORT>` y opción relativa `/`. |
| **`src/utils/api-doc/openapi-schemas.ts`** | Fragmentos reutilizables: respuestas 200/400/500, propiedades de fila de contrato, texto corto de estados para descripciones de operación. |
| **`src/utils/api-doc/contratos-route-schemas.ts`** | Esquemas completos por ruta (body/query/response) para no inflar `contratos.routes.ts`. |

---

## Scripts npm

| Comando | Descripción |
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
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión PostgreSQL. |
| `PORT` | Puerto HTTP (por defecto **3002**). |
| `NODE_ENV` | `test` desactiva logger y métricas en app; `mock` activa datos simulados en repositorio. |
| `PUBLIC_URL` | Base URL en el desplegable de Swagger (sin barra final). |
| `SWAGGER_HOST` | Host mostrado en servidores locales (se fuerza `localhost` si viene `127.0.0.1`). |
| `REQUEST_LOG`, `LOG_LEVEL`, `LOG_DB` | Control fino de logs HTTP y de tiempo de cada llamada a procedimiento. |

Antes de levantar el servicio, aplica en la base el script **`../database/init.sql`** y luego **`../database/contratos/contratos_funciones.sql`** (desde la raíz del repositorio padre `Subscripciones-y-Contratos-ms`).
