export {
  respuestaErrorValidacion,
  respuestaErrorServidor,
} from 'shared';

export const filaLogAuditoriaProperties = {
  id_audit_logs: { type: 'string', description: 'Identificador del log de auditoría.' },
  id_contracts: { type: 'string', description: 'Identificador del contrato asociado.' },
  action: { type: 'string', description: 'Acción realizada.' },
  assignet_to: { type: 'string', description: 'Usuario o entidad responsable.' },
  created_at: { type: 'string', format: 'date-time', description: 'Momento en que se registró el log.' },
} as const;

export const filaLogAuditoriaListadoProperties = {
  ...filaLogAuditoriaProperties,
  total_count: {
    type: 'integer',
    description: 'Total de filas que cumplen el filtro.',
  },
} as const;

export const respuestaExitoListaLogsAuditoria = {
  description: 'Lista paginada de logs de auditoría',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: filaLogAuditoriaListadoProperties,
      },
    },
  },
} as const;
