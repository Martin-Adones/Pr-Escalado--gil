import { createServer } from '../src/app';
import { db } from '../src/database/pg-client';

describe('Endpoints de Pagos con UCNPAY', () => {
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
    it('debe registrar el pago y devolver redirectUrl si el usuario no tiene tarjeta guardada', async () => {
      const mockPago = {
        id_payments: '100',
        id_users: '1',
        amount: 25000,
        concept: 'Suscripción mensual',
        status: 'PENDIENTE',
        external_tx_id: null,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockPago] }) // crearPago
        .mockResolvedValueOnce({ rows: [] }); // obtenerPrimerTarjetaUsuario

      const response = await app.inject({
        method: 'POST',
        url: '/api/pagos/crear',
        payload: {
          id_users: '1',
          amount: 25000,
          concept: 'Suscripción mensual'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.pago.status).toBe('PENDIENTE');
      expect(body.data.redirectUrl).toBeDefined();
    });
  });

  describe('POST /api/pagos/tarjeta', () => {
    it('debe registrar la tarjeta en UCNPAY y guardar localmente', async () => {
      const mockCardDb = {
        id_user_cards: '1',
        id_users: '1',
        payment_method_token: 'token_123',
        card_brand: 'VISA',
        card_last4: '4444',
        holder_name: 'Juan Perez'
      };

      // Mock fetch global
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'APROBADO',
          paymentMethodToken: 'token_123',
          card: { brand: 'VISA', last4: '4444' }
        })
      });
      global.fetch = mockFetch;

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockCardDb]
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/pagos/tarjeta',
        payload: {
          id_users: '1',
          titular: 'Juan Perez',
          tarjeta: {
            numero: '1111222233334444',
            exp_mes: '01',
            exp_ano: '2027',
            cvc: '123'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.payment_method_token).toBe('token_123');
    });
  });

  describe('GET /api/pagos/tarjeta/:id_users', () => {
    it('debe listar las tarjetas registradas para el usuario', async () => {
      const mockCards = [
        {
          id_user_cards: '1',
          payment_method_token: 'token_123',
          card_brand: 'VISA',
          card_last4: '4444',
          holder_name: 'Juan Perez'
        }
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockCards
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/pagos/tarjeta/1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
    });
  });

  describe('POST /api/pagos/webhook (UCNPAY Structure)', () => {
    it('debe procesar el webhook aprobado y sincronizar con contratos', async () => {
      const mockPago = {
        id_payments: '10',
        id_users: '1',
        id_billing_cycles: '5',
        amount: '25000',
        status: 'APROBADO',
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockPago] }) // actualizacion pago
        .mockResolvedValueOnce({ rows: [{ id_contracts: '3', amount: 25000 }] }); // resolver contrato

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
      global.fetch = mockFetch;

      const response = await app.inject({
        method: 'POST',
        url: '/api/pagos/webhook',
        payload: {
          event: 'transaction.approved',
          transactionId: 'trx_456',
          idOrden: 'PAG-10',
          status: 'APROBADO',
          monto: 25000
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });
});
