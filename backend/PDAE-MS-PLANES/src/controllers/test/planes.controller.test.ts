import { PlanesController } from '../planes.controller';
import { PlanesService } from '../../services/planes.service';
import { FastifyRequest, FastifyReply } from 'fastify';

jest.mock('../../services/planes.service');
jest.mock('../../utils/validator', () => ({
  transformAndValidate: jest.fn().mockImplementation((_cls: unknown, data: unknown) => Promise.resolve(data)),
}));

describe('PlanesController', () => {
  let controlador: PlanesController;
  let servicioSimulado: jest.Mocked<PlanesService>;
  let respuestaSimulada: Partial<FastifyReply>;

  beforeEach(() => {
    servicioSimulado = new PlanesService() as jest.Mocked<PlanesService>;
    servicioSimulado.crearPlan = jest.fn();
    servicioSimulado.listarPlanes = jest.fn();
    servicioSimulado.actualizarPlan = jest.fn();
    servicioSimulado.desactivarPlan = jest.fn();
    servicioSimulado.registrarProductosPlan = jest.fn();
    controlador = new PlanesController();
    (controlador as unknown as { servicio: PlanesService }).servicio = servicioSimulado;

    respuestaSimulada = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  const logSimulado = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

  describe('manejarCrearPlan', () => {
    it('responde 200 cuando el servicio devuelve datos', async () => {
      const datos = [{ id_plans: '1', name: 'BASICO', billing_cycle: 'monthly', amount: '20.00', isActive: true }];
      (servicioSimulado.crearPlan as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarCrearPlan(
        { method: 'POST', log: logSimulado, query: {}, body: { name: 'BASICO', billing_cycle: 'monthly', amount: 20 } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: datos });
    });

    it('responde 400 si la validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: campo'));

      await controlador.manejarCrearPlan(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio lanza error', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.crearPlan as jest.Mock).mockRejectedValue(new Error('fallo bd'));

      await controlador.manejarCrearPlan(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarListarPlanes', () => {
    it('responde 200 con lista', async () => {
      const datos = [{ id_plans: '1', name: 'A', billing_cycle: 'monthly', amount: '10.00', isActive: true, total_count: '1' }];
      (servicioSimulado.listarPlanes as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarListarPlanes(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: y'));

      await controlador.manejarListarPlanes(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.listarPlanes as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarListarPlanes(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarActualizarPlan', () => {
    it('responde 200', async () => {
      const datos = [{ id_plans: '1', name: 'PRO', billing_cycle: 'monthly', amount: '35.00', isActive: true }];
      (servicioSimulado.actualizarPlan as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarActualizarPlan(
        { method: 'POST', log: logSimulado, query: {}, body: { id_plans: '1' } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: z'));

      await controlador.manejarActualizarPlan(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.actualizarPlan as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarActualizarPlan(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarDesactivarPlan', () => {
    it('responde 200 con datos del servicio', async () => {
      const datos = [{ id_plans: '1', name: 'BASICO', billing_cycle: 'monthly', amount: '10.00', isActive: false }];
      (servicioSimulado.desactivarPlan as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarDesactivarPlan(
        { method: 'POST', log: logSimulado, query: {}, body: { id_plans: '1' } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: datos });
    });

    it('responde 400 si validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: x'));

      await controlador.manejarDesactivarPlan(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.desactivarPlan as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarDesactivarPlan(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarRegistrarProductosPlan', () => {
    it('responde 200 con datos del servicio', async () => {
      const datos = [{ id_plans: '1', id_products: '2' }];
      (servicioSimulado.registrarProductosPlan as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarRegistrarProductosPlan(
        { method: 'POST', log: logSimulado, query: {}, body: { id_plans: '1', id_products: ['2'] } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: datos });
    });

    it('responde 400 si validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: x'));

      await controlador.manejarRegistrarProductosPlan(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.registrarProductosPlan as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarRegistrarProductosPlan(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });
});
