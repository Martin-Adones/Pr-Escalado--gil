/**
 * Fragmentos de JSON Schema reutilizables para OpenAPI y validacion en Fastify.
 * Nota: no usar la keyword `example` aqui; AJV en modo estricto de Fastify la rechaza.
 */

export const respuestaErrorValidacion = {
  description: 'Cuerpo enviado invalido o reglas de class-validator',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
} as const;

export const respuestaErrorServidor = {
  description: 'Error no controlado o fallo al ejecutar el procedimiento en base de datos',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
} as const;
