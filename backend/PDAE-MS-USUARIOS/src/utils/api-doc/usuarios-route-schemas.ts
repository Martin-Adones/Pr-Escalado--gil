/**
 * Esquemas OpenAPI por ruta de usuarios (validación + documentación).
 */
import {
  respuestaErrorServidor,
  respuestaErrorValidacion,
  respuestaExitoListaUsuarios,
  respuestaExitoUsuario,
} from './openapi-schemas';

export const esquemaPostCrearUsuario = {
  operationId: 'crearUsuario',
  summary: 'Crear usuario',
  description: 'Inserta un registro en la tabla Users con type e isActive (opcional).',
  tags: ['Usuarios'],
  body: {
    type: 'object',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Rol o categoría del usuario',
      },
      isActive: {
        type: 'boolean',
        description: 'Indica si el usuario inicia activo (por defecto true)',
      },
    },
  },
  response: {
    200: respuestaExitoUsuario,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaGetListarUsuarios = {
  operationId: 'listarUsuarios',
  summary: 'Listar usuarios',
  description:
    'Filtros opcionales: id_users exacto, type como subcadena (ILIKE), isActive. Paginacion: page_size, page_number.',
  tags: ['Usuarios'],
  querystring: {
    type: 'object',
    properties: {
      id_users: {
        type: 'string',
        format: 'uuid',
        description: 'Filtrar por id de usuario',
      },
      type: {
        type: 'string',
        maxLength: 255,
        description: 'Texto contenido en type (búsqueda parcial)',
      },
      isActive: {
        type: 'boolean',
        description: 'Filtrar por usuarios activos/inactivos',
      },
      page_size: {
        type: 'integer',
        minimum: 1,
        default: 10,
        description: 'Tamaño de página',
      },
      page_number: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Número de página (base 1)',
      },
    },
  },
  response: {
    200: respuestaExitoListaUsuarios,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostActualizarUsuario = {
  operationId: 'actualizarUsuario',
  summary: 'Actualizar usuario',
  description: 'Cambia el type del usuario indicado por id_users. isActive es opcional.',
  tags: ['Usuarios'],
  body: {
    type: 'object',
    required: ['id_users', 'type'],
    properties: {
      id_users: {
        type: 'string',
        format: 'uuid',
        description: 'Usuario a modificar',
      },
      type: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nuevo valor de type',
      },
      isActive: {
        type: 'boolean',
        description: 'Nuevo estado activo/inactivo (opcional)',
      },
    },
  },
  response: {
    200: respuestaExitoUsuario,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostSincronizarUsuario = {
  operationId: 'sincronizarUsuario',
  summary: 'Sincronizar usuario post-login (upsert)',
  description:
    'Extrae el sub (UUID) del JWT Bearer de Keycloak y hace un UPSERT en la tabla Users. ' +
    'Si el UUID ya existe lo retorna sin modificarlo. Si es nuevo lo crea con type=cliente. ' +
    'Llamar justo después del login para garantizar que el usuario existe en nuestra BD.',
  tags: ['Usuarios'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        maxLength: 255,
        description: 'Tipo de usuario (por defecto "cliente")',
      },
      isActive: {
        type: 'boolean',
        description: 'Estado inicial del usuario (por defecto true)',
      },
    },
  },
  response: {
    200: respuestaExitoUsuario,
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: respuestaErrorServidor,
  },
} as const;

