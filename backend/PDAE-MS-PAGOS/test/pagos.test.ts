import { createServer } from '../src/app';
import { db } from '../src/database/pg-client';

describe('Endpoints de Pagos', () => {
  let app: any;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/pagos/crear', () => {
    it('debe validar la entrada y responder 400 ante campos faltantes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pagos/crear',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('debe registrar el pago y responder 200 con la url de redireccion', async () => {
      const mockPago = {
        id_payments: '10',
        id_users: '1',
        amount: 25000,
        concept: 'Plan Pyme',
        status: 'PENDIENTE',
        external_tx_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPago]
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/pagos/crear',
        payload: {
          id_users: '1',
          amount: 25000,
          concept: 'Plan Pyme'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.pago.id_payments).toBe('10');
      expect(body.data.redirectUrl).toContain('checkout-page');
    });
  });

  describe('GET /api/pagos/usuario/:id_users', () => {
    it('debe retornar la lista de pagos de un usuario', async () => {
      const mockPagosList = [
        {
          id_payments: '10',
          id_users: '1',
          amount: '25000',
          concept: 'Plan Pyme',
          status: 'PENDIENTE',
        }
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockPagosList
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/pagos/usuario/1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].id_payments).toBe('10');
    });
  });

  describe('GET /api/pagos/:id_payments', () => {
    it('debe retornar 404 si el pago no existe', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: []
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/pagos/999',
      });

      expect(response.statusCode).toBe(404);
    });

    it('debe retornar los detalles del pago si existe', async () => {
      const mockPago = {
        id_payments: '10',
        id_users: '1',
        amount: '25000',
        concept: 'Plan Pyme',
        status: 'PENDIENTE',
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPago]
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/pagos/10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id_payments).toBe('10');
    });
  });

  describe('POST /api/pagos/webhook', () => {
    it('debe procesar el webhook del proveedor de pagos y responder 200', async () => {
      const mockPago = {
        id_payments: '10',
        id_users: '1',
        id_billing_cycles: '5',
        amount: '25000',
        concept: 'Plan Pyme',
        status: 'APROBADO',
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [mockPago] // actualizacion estado pago
        })
        .mockResolvedValueOnce({
          rows: [{ id_contracts: '3', amount: 25000 }] // resolver contrato
        });

      // Mock fetch global
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
      global.fetch = mockFetch;

      const response = await app.inject({
        method: 'POST',
        url: '/api/pagos/webhook',
        payload: {
          external_tx_id: 'EXT123',
          status: 'APROBADO',
          id_payments: '10'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('GET /api/pagos/mock-externo/checkout-page', () => {
    it('debe servir la pagina html del checkout de la pasarela de pagos', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pagos/mock-externo/checkout-page',
        query: {
          paymentId: '10',
          amount: '25000',
          concept: 'Plan Pyme'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.body).toContain('PROYECTO PAGOS');
    });
  });
});
