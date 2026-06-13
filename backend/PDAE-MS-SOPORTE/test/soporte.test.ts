process.env.NODE_ENV = 'test';

import { createServer } from '../src/app';
import supertest from 'supertest';
import { SoporteRepository } from '../src/repositories/soporte.repository';

// Mock global de la DB para evitar conexiones reales
jest.mock('../src/database/pg-client');

describe('Soporte API Endpoints', () => {
  let app: any;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/soporte/crear', () => {
    it('debe crear un ticket y retornar 200', async () => {
      const mockTicket = {
        id_support: '1',
        id_contracts: '5',
        id_users: '10',
        description: 'Error en el panel',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const spy = jest
        .spyOn(SoporteRepository.prototype, 'ejecutarCrearTicket')
        .mockResolvedValue([mockTicket as any]);

      const response = await supertest(app.server)
        .post('/api/soporte/crear')
        .send({
          id_contracts: '5',
          description: 'Error en el panel',
          status: 'open',
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [mockTicket],
      });
      expect(spy).toHaveBeenCalled();
    });

    it('debe crear múltiples tickets si se envía un array directamente', async () => {
      const mockTicket = {
        id_support: '2',
        id_contracts: '5',
        id_users: '10',
        description: 'Error',
        status: 'open',
      };
      jest
        .spyOn(SoporteRepository.prototype, 'ejecutarCrearTicket')
        .mockResolvedValue([mockTicket as any]);

      await supertest(app.server)
        .post('/api/soporte/crear')
        .send([
          { id_contracts: '5', description: 'Error 1' },
          { id_contracts: '5', description: 'Error 2' },
        ])
        .expect(200);
    });

    it('debe crear múltiples tickets si se envía un objeto con una propiedad tickets', async () => {
      const mockTicket = {
        id_support: '3',
        id_contracts: '5',
        id_users: '10',
        description: 'Error',
        status: 'open',
      };
      jest
        .spyOn(SoporteRepository.prototype, 'ejecutarCrearTicket')
        .mockResolvedValue([mockTicket as any]);

      await supertest(app.server)
        .post('/api/soporte/crear')
        .send({
          tickets: [
            { id_contracts: '5', description: 'Error 1' },
          ],
        })
        .expect(200);
    });

    it('debe retornar 400 si Fastify detecta un body inválido', async () => {
      const response = await supertest(app.server)
        .post('/api/soporte/crear')
        .send({
          id_contracts: 'no-es-numero', // Inválido
          description: '', // Inválido
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('debe retornar 400 si ocurre una validación de DTO', async () => {
      jest
        .spyOn(SoporteRepository.prototype, 'ejecutarCrearTicket')
        .mockRejectedValue(new Error('Error de Validacion: descripcion invalida'));

      const response = await supertest(app.server)
        .post('/api/soporte/crear')
        .send({
          id_contracts: '5',
          description: 'Problema técnico',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Error de Validacion: descripcion invalida',
      });
    });

    it('debe retornar 500 si el repositorio lanza un error genérico', async () => {
      jest
        .spyOn(SoporteRepository.prototype, 'ejecutarCrearTicket')
        .mockRejectedValue(new Error('Error de DB simulado'));

      const response = await supertest(app.server)
        .post('/api/soporte/crear')
        .send({
          id_contracts: '5',
          description: 'Problema técnico',
        })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Error de DB simulado',
      });
    });
  });

  describe('GET /api/soporte/listar', () => {
    it('debe listar tickets con filtros y retornar 200', async () => {
      const mockTickets = [
        {
          id_support: '1',
          id_contracts: '5',
          id_users: '10',
          description: 'Error en el panel',
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_count: 1,
        },
      ];

      const spy = jest
        .spyOn(SoporteRepository.prototype, 'ejecutarListarTickets')
        .mockResolvedValue(mockTickets as any);

      const response = await supertest(app.server)
        .get('/api/soporte/listar')
        .query({
          id_users: '10',
          status: 'open',
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockTickets,
      });
      expect(spy).toHaveBeenCalled();
    });

    it('debe retornar 400 si la querystring es inválida para Fastify', async () => {
      const response = await supertest(app.server)
        .get('/api/soporte/listar')
        .query({
          status: 'invalido-estado',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('debe retornar 400 si ocurre una validación de DTO en listado', async () => {
      jest
        .spyOn(SoporteRepository.prototype, 'ejecutarListarTickets')
        .mockRejectedValue(new Error('Error de Validacion: filtro invalido'));

      const response = await supertest(app.server)
        .get('/api/soporte/listar')
        .query({
          status: 'open',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Error de Validacion: filtro invalido',
      });
    });

    it('debe retornar 500 si el listar lanza un error genérico', async () => {
      jest
        .spyOn(SoporteRepository.prototype, 'ejecutarListarTickets')
        .mockRejectedValue(new Error('Error de DB genérico'));

      const response = await supertest(app.server)
        .get('/api/soporte/listar')
        .query({
          status: 'open',
        })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Error de DB genérico',
      });
    });
  });

  describe('POST /api/soporte/actualizar', () => {
    it('debe actualizar el ticket y retornar 200', async () => {
      const mockTicket = {
        id_support: '1',
        id_contracts: '5',
        id_users: '10',
        description: 'Error corregido',
        status: 'resolved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const spy = jest
        .spyOn(SoporteRepository.prototype, 'ejecutarActualizarTicket')
        .mockResolvedValue([mockTicket as any]);

      const response = await supertest(app.server)
        .post('/api/soporte/actualizar')
        .send({
          id_support: '1',
          status: 'resolved',
          description: 'Error corregido',
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [mockTicket],
      });
      expect(spy).toHaveBeenCalled();
    });

    it('debe retornar 400 si el body de actualización es inválido para Fastify', async () => {
      const response = await supertest(app.server)
        .post('/api/soporte/actualizar')
        .send({
          status: 'resolved', // Falta id_support
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('debe retornar 400 si ocurre una validación de DTO en actualización', async () => {
      jest
        .spyOn(SoporteRepository.prototype, 'ejecutarActualizarTicket')
        .mockRejectedValue(new Error('Error de Validacion: campos invalidos'));

      const response = await supertest(app.server)
        .post('/api/soporte/actualizar')
        .send({
          id_support: '1',
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Error de Validacion: campos invalidos',
      });
    });

    it('debe retornar 500 si la actualización lanza un error genérico', async () => {
      jest
        .spyOn(SoporteRepository.prototype, 'ejecutarActualizarTicket')
        .mockRejectedValue(new Error('Error de DB genérico'));

      const response = await supertest(app.server)
        .post('/api/soporte/actualizar')
        .send({
          id_support: '1',
        })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Error de DB genérico',
      });
    });
  });
});
