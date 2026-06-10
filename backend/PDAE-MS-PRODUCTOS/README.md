# PDAE · Microservicio Productos

API REST (Fastify) que expone el ciclo de vida de **productos**: crear, listar, actualizar y desactivar. La regla de negocio principal vive en **PostgreSQL** (`database/productos/productos_funciones.sql` en el repo padre); este servicio valida entradas, llama a los procedimientos y devuelve JSON.

---

## Como se organiza una peticion

1. **Ruta** (`src/routes/`) — registra URL, metodo y esquema OpenAPI/validacion.
2. **Controlador** (`src/controllers/`) — lee cuerpo o query, valida con DTOs y responde HTTP (200 / 400 / 500).
3. **Servicio** (`src/services/`) — orquesta el caso de uso sin conocer HTTP.
4. **Repositorio** (`src/repositories/`) — arma parametros y ejecuta `SELECT * FROM sp_…($1,…)` via `BaseRepository`.
5. **Base de datos** — funciones PL/pgSQL (`sp_crear_producto`, etc.).

---

## Punto de entrada y aplicacion

| Archivo / simbolo | Que hace |
|-------------------|----------|
| **`src/server.ts`** | Carga `dotenv`, crea el servidor con `createServer()`, comprueba conexion a la BD (`SELECT NOW()`), escucha en `PORT` (por defecto **3005**) e imprime la URL de documentacion. |
| **`src/app.ts` → `createServer`** | Construye la instancia Fastify: CORS, rate limit, Helmet, metricas en `/monitor` (excepto en tests), Swagger, rutas `/api/health` y `/api/productos/…`. |

---

## Rutas HTTP

| Archivo | Funcion / export | Uso |
|---------|------------------|-----|
| **`src/routes/productos.routes.ts`** | `rutasProductos` (default) | Registra `POST /productos/crear`, `GET /productos/listar`, `POST /productos/actualizar`, `POST /productos/desactivar` (con prefijo `/api` en `app.ts`). Los esquemas JSON estan en `src/utils/api-doc/productos-route-schemas.ts`. |
| **`src/routes/health-routes.ts`** | `rutasSalud` (default) | `GET /api/health` — comprobacion de que el proceso responde (balanceadores, Kubernetes, etc.). |

---

## Controlador de productos

**Clase:** `ProductosController` en `src/controllers/productos.controller.ts`.

| Metodo | Rol |
|--------|-----|
| **`manejarCrearProducto`** | Valida `CrearProductoEntradaDto`, llama `servicio.crearProducto`, responde `{ success, data }` o error de validacion / 500. |
| **`manejarListarProductos`** | Lee **query** (GET), valida `ListarProductosConsultaDto` → `listarProductos`. |
| **`manejarActualizarProducto`** | Valida `ActualizarProductoEntradaDto` → `actualizarProducto`. |
| **`manejarDesactivarProducto`** | Valida `DesactivarProductoEntradaDto` → `desactivarProducto`. |

Errores cuyo mensaje empieza por `Error de Validacion:` → respuesta **400**; el resto de excepciones → **500**.

---

## Servicio de productos

**Clase:** `ProductosService` en `src/services/productos.service.ts`. Solo delega en el repositorio (util para tests y para no mezclar HTTP con datos).

| Metodo | Uso |
|--------|-----|
| **`crearProducto`** | Pasa el DTO a `ejecutarCrearProducto`. |
| **`listarProductos`** | → `ejecutarListarProductos`. |
| **`actualizarProducto`** | → `ejecutarActualizarProducto`. |
| **`desactivarProducto`** | → `ejecutarDesactivarProducto`. |

---

## Repositorio y acceso a datos

### `ProductosRepository` (`src/repositories/productos.repository.ts`)

Extiende `BaseRepository`. Cada metodo traduce el DTO al **orden de argumentos** que espera la funcion en PostgreSQL.

| Metodo | Procedimiento SQL | Uso |
|--------|-------------------|-----|
| **`ejecutarCrearProducto`** | `sp_crear_producto` | Alta de producto (nombre, tipo, precio, cantidad, isActive opcional). |
| **`ejecutarListarProductos`** | `sp_listar_productos` | Listado filtrado y paginado; incluye `total_count` por fila. |
| **`ejecutarActualizarProducto`** | `sp_actualizar_producto` | Actualizacion parcial (solo campos enviados). |
| **`ejecutarDesactivarProducto`** | `sp_desactivar_producto` | Marca el producto como inactivo sin borrar la fila. |

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
| **`src/models/productos.dtos.ts`** | Clases **DTO** con `class-validator`: `CrearProductoEntradaDto`, `ListarProductosConsultaDto`, `ActualizarProductoEntradaDto`, `DesactivarProductoEntradaDto`; tipos de fila `FilaProducto`, `FilaProductoListado`. Definen que puede entrar y salir tipado. |
| **`src/utils/validator.ts` → `transformAndValidate`** | Convierte JSON plano a instancia del DTO (`class-transformer`) y valida (`class-validator`); si falla, lanza error con prefijo `Error de Validacion:`. |

---

## Documentacion OpenAPI (Swagger)

| Archivo / simbolo | Uso |
|-------------------|-----|
| **`src/utils/api-doc/swagger.ts` → `registerSwagger`** | Registra `@fastify/swagger` y `@fastify/swagger-ui` en **`/api-doc`**. Servidores: `PUBLIC_URL` si existe; si no, `http://<host>:<PORT>` y opcion relativa `/`. |
| **`src/utils/api-doc/openapi-schemas.ts`** | Fragmentos reutilizables: respuestas 200/400/500, propiedades de fila de producto. |
| **`src/utils/api-doc/productos-route-schemas.ts`** | Esquemas completos por ruta (body/query/response) para no inflar `productos.routes.ts`. |

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
| `PORT` | Puerto HTTP (por defecto **3005**). |
| `NODE_ENV` | `test` desactiva logger y metricas en app; `mock` activa datos simulados en repositorio. |
| `PUBLIC_URL` | Base URL en el desplegable de Swagger (sin barra final). |
| `SWAGGER_HOST` | Host mostrado en servidores locales (se fuerza `localhost` si viene `127.0.0.1`). |
| `REQUEST_LOG`, `LOG_LEVEL`, `LOG_DB` | Control fino de logs HTTP y de tiempo de cada llamada a procedimiento. |

Antes de levantar el servicio, aplica en la base el script **`../database/init.sql`** y luego **`../database/productos/productos_funciones.sql`** (desde la raiz del repositorio padre).
