/**
 * Fragmentos JSON Schema reutilizables para OpenAPI y validación Fastify.
 * IDs numéricos como string (BIGSERIAL; `pg` suele devolver string).
 */

const idBigint = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'Identificador numérico (BIGSERIAL). En JSON como cadena, ej. "1".',
};

export const usuarioFilaProperties = {
  id_users: { ...idBigint, description: 'Identificador del usuario.' },
  type: {
    type: 'string',
    description: 'Rol o categoría (VARCHAR 255 en base de datos).',
  },
  isActive: {
    type: 'boolean',
    description: 'Indica si el usuario esta activo.',
  },
} as const;

export const usuarioFilaListadoProperties = {
  ...usuarioFilaProperties,
  total_count: {
    type: 'integer',
    description: 'Total de filas que cumplen el filtro (repetido en cada fila de la página).',
  },
} as const;

export const respuestaExitoListaUsuarios = {
  description: 'Lista paginada de usuarios',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: usuarioFilaListadoProperties,
      },
    },
  },
} as const;

export const respuestaExitoUsuario = {
  description: 'Una fila por llamada al procedimiento',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: usuarioFilaProperties,
      },
    },
  },
} as const;

export { respuestaErrorValidacion, respuestaErrorServidor } from 'shared';
