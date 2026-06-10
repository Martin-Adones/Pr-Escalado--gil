import { ProductosController } from '../productos.controller';
import { ProductosService } from '../../services/productos.service';
import { FastifyRequest, FastifyReply } from 'fastify';

jest.mock('../../services/productos.service');
jest.mock('../../utils/validator', () => ({
  transformAndValidate: jest.fn().mockImplementation((_cls: unknown, data: unknown) => Promise.resolve(data)),
}));

describe('ProductosController', () => {
  let controlador: ProductosController;
  let servicioSimulado: jest.Mocked<ProductosService>;
  let respuestaSimulada: Partial<FastifyReply>;

  beforeEach(() => {
    servicioSimulado = new ProductosService() as jest.Mocked<ProductosService>;
    servicioSimulado.crearProducto = jest.fn();
    servicioSimulado.listarProductos = jest.fn();
    servicioSimulado.actualizarProducto = jest.fn();
    servicioSimulado.desactivarProducto = jest.fn();
    controlador = new ProductosController();
    (controlador as unknown as { servicio: ProductosService }).servicio = servicioSimulado;

    respuestaSimulada = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  const logSimulado = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

  describe('manejarCrearProducto', () => {
    it('responde 200 cuando el servicio devuelve datos', async () => {
      const datos = [{ id_products: '1', name: 'A', type: 'X', price: '10.00', quantity: 1, description: null, isActive: true }];
      (servicioSimulado.crearProducto as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarCrearProducto(
        { method: 'POST', log: logSimulado, query: {}, body: { name: 'A', type: 'X', price: 10 } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: datos });
    });

    it('responde 400 si la validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: campo'));

      await controlador.manejarCrearProducto(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio lanza error', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.crearProducto as jest.Mock).mockRejectedValue(new Error('fallo bd'));

      await controlador.manejarCrearProducto(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarListarProductos', () => {
    it('responde 200 con lista', async () => {
      const datos = [{ id_products: '1', name: 'A', type: 'X', price: '10.00', quantity: 1, description: null, isActive: true, total_count: '1' }];
      (servicioSimulado.listarProductos as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarListarProductos(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: y'));

      await controlador.manejarListarProductos(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.listarProductos as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarListarProductos(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarActualizarProducto', () => {
    it('responde 200', async () => {
      const datos = [{ id_products: '1', name: 'B', type: 'X', price: '12.00', quantity: 2, description: null, isActive: true }];
      (servicioSimulado.actualizarProducto as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarActualizarProducto(
        { method: 'POST', log: logSimulado, query: {}, body: { id_products: '1' } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: z'));

      await controlador.manejarActualizarProducto(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.actualizarProducto as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarActualizarProducto(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarDesactivarProducto', () => {
    it('responde 200 con datos del servicio', async () => {
      const datos = [{ id_products: '1', name: 'A', type: 'X', price: '10.00', quantity: 1, description: null, isActive: false }];
      (servicioSimulado.desactivarProducto as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarDesactivarProducto(
        { method: 'POST', log: logSimulado, query: {}, body: { id_products: '1' } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: datos });
    });

    it('responde 400 si validacion falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validacion: x'));

      await controlador.manejarDesactivarProducto(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.desactivarProducto as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarDesactivarProducto(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });
});
