# PDAE · Microservicio Usuarios

API REST (Fastify) sobre la tabla **`Users`** (`id_users`, `type`, `isActive`). La lógica está en PostgreSQL: `database/usuarios/usuarios_funciones.sql` (en el repo padre). Puerto por defecto **3003** (el de contratos suele ser 3002).

## Rutas (`/api`)

| Método | Ruta | Procedimiento SQL |
|--------|------|-------------------|
| POST | `/usuarios/crear` | `sp_crear_usuario` |
| GET | `/usuarios/listar` | `sp_listar_usuarios` |
| POST | `/usuarios/actualizar` | `sp_actualizar_usuario` |

## Capas (nombres en español)

- **`rutasUsuarios`** — `src/routes/usuarios.routes.ts`
- **`UsuariosController`** — `manejarCrearUsuario`, `manejarListarUsuarios`, `manejarActualizarUsuario`
- **`UsuariosService`** — `crearUsuario`, `listarUsuarios`, `actualizarUsuario`
- **`UsuariosRepository`** — `ejecutarCrearUsuario`, `ejecutarListarUsuarios`, `ejecutarActualizarUsuario`

DTOs en `src/models/usuarios.dtos.ts`. OpenAPI en `src/utils/api-doc/`. Documentación interactiva: **`/api-doc`**.

## Base de datos

1. Ejecutar `database/init.sql` (crea `Users`).
2. Ejecutar `database/usuarios/usuarios_funciones.sql`.

Variables de conexión: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (ver `src/database/pg-client.ts`).

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm test`
