export {
  respuestaErrorValidacion,
  respuestaErrorServidor,
} from 'shared';

const idBigint = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'Identificador numérico (BIGINT / BIGSERIAL en PostgreSQL). En JSON va como cadena, ej. "1".',
};

export const pagoFilaProperties = {
  id_payments: { ...idBigint, description: 'Identificador único del pago.' },
  id_users: { type: 'string' as const, format: 'uuid', description: 'Identificador del usuario (UUID).' },
  id_billing_cycles: {
    type: ['string', 'null'] as any,
    pattern: '^[0-9]+$',
    description: 'ID del ciclo de cobro de contratos asociado (opcional).',
  },
  amount: { type: 'string' as const, description: 'Monto cobrado en formato string decimal.' },
  concept: { type: 'string' as const, description: 'Concepto o descripción del cobro.' },
  status: { type: 'string' as const, description: 'Estado del pago: PENDIENTE, APROBADO, RECHAZADO.' },
  external_tx_id: { type: ['string', 'null'] as any, description: 'ID de transacción externa en la pasarela UCNPAY.' },
  created_at: { type: 'string' as const, format: 'date-time', description: 'Fecha de creación.' },
  updated_at: { type: 'string' as const, format: 'date-time', description: 'Fecha de última actualización.' },
} as const;

export const tarjetaFilaProperties = {
  id_user_cards: { ...idBigint, description: 'Identificador del registro de tarjeta.' },
  id_users: { type: 'string' as const, format: 'uuid', description: 'Identificador del usuario (UUID).' },
  payment_method_token: { type: 'string' as const, description: 'Token único asignado por la pasarela de pagos.' },
  card_brand: { type: 'string' as const, description: 'Marca de la tarjeta (VISA, MasterCard, etc.).' },
  card_last4: { type: 'string' as const, description: 'Últimos 4 dígitos de la tarjeta.' },
  holder_name: { type: 'string' as const, description: 'Nombre del titular de la tarjeta.' },
  created_at: { type: 'string' as const, format: 'date-time', description: 'Fecha de registro.' },
} as const;

export const respuestaExitoPago = {
  description: 'Respuesta exitosa al crear o consultar un pago.',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        pago: {
          type: 'object',
          properties: pagoFilaProperties,
        },
        redirectUrl: {
          type: 'string',
          description: 'URL de redirección al checkout manual (opcional, en desuso para cobros automáticos).',
        },
      },
    },
  },
} as const;

export const respuestaExitoPagoIndividual = {
  description: 'Respuesta exitosa de consulta de pago.',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: pagoFilaProperties,
    },
  },
} as const;

export const respuestaExitoListaPagos = {
  description: 'Respuesta con listado de pagos del usuario.',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: pagoFilaProperties,
      },
    },
  },
} as const;

export const respuestaExitoTarjeta = {
  description: 'Respuesta exitosa al registrar tarjeta.',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: tarjetaFilaProperties,
    },
  },
} as const;

export const respuestaExitoListaTarjetas = {
  description: 'Lista de tarjetas del usuario.',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: tarjetaFilaProperties,
      },
    },
  },
} as const;
