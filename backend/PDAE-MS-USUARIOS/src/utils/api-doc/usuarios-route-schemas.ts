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
  description: 'Inserta un registro en la tabla Users con el campo type (texto 1–255 caracteres).',
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
    'Filtros opcionales: id_users exacto, type como subcadena (ILIKE). Paginación: page_size, page_number.',
  tags: ['Usuarios'],
  querystring: {
    type: 'object',
    properties: {
      id_users: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Filtrar por id de usuario',
      },
      type: {
        type: 'string',
        maxLength: 255,
        description: 'Texto contenido en type (búsqueda parcial)',
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
  description: 'Cambia el type del usuario indicado por id_users.',
  tags: ['Usuarios'],
  body: {
    type: 'object',
    required: ['id_users', 'type'],
    properties: {
      id_users: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Usuario a modificar',
      },
      type: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nuevo valor de type',
      },
    },
  },
  response: {
    200: respuestaExitoUsuario,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;
