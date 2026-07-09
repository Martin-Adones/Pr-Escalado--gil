import { createServer } from '../src/app';
import { AuditoriaService } from '../src/services/auditoria.service';

describe('Auditoria API Endpoints', () => {
  let app: any;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/auditoria/listar - debe retornar 200 y la lista de logs', async () => {
    const mockLogs = [
      {
        id_audit_logs: '1',
        id_contracts: '42',
        action: 'crear_contrato',
        assigned_to: 'admin',
        created_at: '2026-07-08T00:00:00.000Z',
        total_count: '1',
      },
    ];

    jest.spyOn(AuditoriaService.prototype, 'listarLogsAuditoria').mockResolvedValueOnce(mockLogs);

    const response = await app.inject({
      method: 'GET',
      url: '/api/auditoria/listar',
      query: {
        page_size: '10',
        page_number: '1',
        action: 'crear_contrato',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockLogs);
  });

  it('GET /api/auditoria/listar - debe retornar 400 si la validación falla (ej: page_size inválido)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auditoria/listar',
      query: {
        page_size: 'no-es-un-numero',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Error de Validación');
  });

  it('GET /api/auditoria/listar - debe retornar 500 si el servicio arroja un error inesperado', async () => {
    jest.spyOn(AuditoriaService.prototype, 'listarLogsAuditoria').mockRejectedValueOnce(new Error('Fallo de conexión a la BD'));

    const response = await app.inject({
      method: 'GET',
      url: '/api/auditoria/listar',
      query: {
        page_size: '10',
        page_number: '1',
      },
    });

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Error interno del servidor');
  });
});
