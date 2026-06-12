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
