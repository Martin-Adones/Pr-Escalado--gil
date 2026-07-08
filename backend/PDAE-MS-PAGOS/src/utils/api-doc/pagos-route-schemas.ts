import {
  respuestaErrorValidacion,
  respuestaErrorServidor,
  respuestaExitoPago,
  respuestaExitoPagoIndividual,
  respuestaExitoListaPagos,
  respuestaExitoTarjeta,
  respuestaExitoListaTarjetas,
} from './openapi-schemas';

const idPayment = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID de Pago',
};

const idUser = {
  type: 'string' as const,
  format: 'uuid',
  description: 'ID de Usuario (UUID v4)',
};

const idBillingCycle = {
  type: 'string' as const,
  pattern: '^[0-9]+$',
  description: 'ID del Ciclo de Cobro',
};

export const esquemaPostCrearPago = {
  operationId: 'crearPago',
  summary: 'Registrar y procesar un pago',
  description: 'Crea un registro de pago y realiza el cobro automático con la tarjeta guardada si existe.',
  tags: ['Pagos'],
  body: {
    type: 'object',
    required: ['id_users', 'amount', 'concept'],
    properties: {
      id_users: idUser,
      amount: { type: 'number', minimum: 1, description: 'Monto a pagar' },
      concept: { type: 'string', minLength: 1, description: 'Concepto del pago' },
      id_billing_cycles: idBillingCycle,
    },
  },
  response: {
    200: respuestaExitoPago,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaGetObtenerPagoPorId = {
  operationId: 'obtenerPagoPorId',
  summary: 'Obtener detalles de un pago',
  description: 'Devuelve los detalles de un pago específico a partir de su ID.',
  tags: ['Pagos'],
  params: {
    type: 'object',
    required: ['id_payments'],
    properties: {
      id_payments: idPayment,
    },
  },
  response: {
    200: respuestaExitoPagoIndividual,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaGetObtenerPagosPorUsuario = {
  operationId: 'obtenerPagosPorUsuario',
  summary: 'Obtener pagos de un usuario',
  description: 'Devuelve el historial completo de pagos de un usuario específico.',
  tags: ['Pagos'],
  params: {
    type: 'object',
    required: ['id_users'],
    properties: {
      id_users: idUser,
    },
  },
  response: {
    200: respuestaExitoListaPagos,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostRegistrarTarjeta = {
  operationId: 'registrarTarjeta',
  summary: 'Registrar una nueva tarjeta',
  description: 'Inicia el registro de tarjeta y mandato para cobros recurrentes automáticos en UCNPAY.',
  tags: ['Pagos'],
  body: {
    type: 'object',
    required: ['id_users', 'titular', 'tarjeta'],
    properties: {
      id_users: idUser,
      titular: { type: 'string', minLength: 1, description: 'Nombre del titular de la tarjeta' },
      tarjeta: {
        type: 'object',
        required: ['numero', 'exp_mes', 'exp_ano', 'cvc'],
        properties: {
          numero: { type: 'string', minLength: 13, maxLength: 19, description: 'Número de tarjeta sin espacios' },
          exp_mes: { type: 'string', pattern: '^(0[1-9]|1[0-2])$', description: 'Mes de expiración (MM)' },
          exp_ano: { type: 'string', pattern: '^20[0-9]{2}$', description: 'Año de expiración (AAAA)' },
          cvc: { type: 'string', minLength: 3, maxLength: 4, description: 'Código CVC/CVV' },
        },
      },
    },
  },
  response: {
    200: respuestaExitoTarjeta,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaGetObtenerTarjetasUsuario = {
  operationId: 'obtenerTarjetasUsuario',
  summary: 'Listar tarjetas guardadas del usuario',
  description: 'Obtiene las tarjetas de crédito asociadas y activas del usuario.',
  tags: ['Pagos'],
  params: {
    type: 'object',
    required: ['id_users'],
    properties: {
      id_users: idUser,
    },
  },
  response: {
    200: respuestaExitoListaTarjetas,
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaDeleteEliminarTarjeta = {
  operationId: 'eliminarTarjeta',
  summary: 'Eliminar tarjeta guardada',
  description: 'Desvincula una tarjeta guardada tanto localmente como en la pasarela externa UCNPAY.',
  tags: ['Pagos'],
  params: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', description: 'Token de pago de la tarjeta a eliminar' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;

export const esquemaPostWebhookPagos = {
  operationId: 'webhookPagos',
  summary: 'Webhook para notificaciones de UCNPAY',
  description: 'Recibe respuestas asíncronas de cobros aprobados o rechazados de la pasarela.',
  tags: ['Pagos'],
  body: {
    type: 'object',
    required: ['event', 'transactionId', 'idOrden', 'status', 'monto'],
    properties: {
      event: { type: 'string', enum: ['transaction.approved', 'transaction.rejected'] },
      transactionId: { type: 'string' },
      idOrden: { type: 'string' },
      status: { type: 'string', enum: ['APROBADO', 'RECHAZADO'] },
      monto: { type: 'number' },
      reason: { type: 'string' },
      paymentMethodToken: { type: 'string' },
      mandateId: { type: 'string' },
      card: {
        type: 'object',
        properties: {
          brand: { type: 'string' },
          last4: { type: 'string' },
          expMonth: { type: 'integer' },
          expYear: { type: 'integer' },
        },
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    400: respuestaErrorValidacion,
    500: respuestaErrorServidor,
  },
} as const;
