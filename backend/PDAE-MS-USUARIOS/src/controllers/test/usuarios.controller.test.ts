import { UsuariosController } from '../usuarios.controller';
import { UsuariosService } from '../../services/usuarios.service';
import { FastifyRequest, FastifyReply } from 'fastify';

jest.mock('../../services/usuarios.service');
jest.mock('shared', () => {
  const actual = jest.requireActual('shared');
  return {
    ...actual,
    transformAndValidate: jest.fn().mockImplementation((_cls: unknown, data: unknown) => Promise.resolve(data)),
    extraerSubDeJwt: jest.fn().mockReturnValue('test-uuid-1234'),
    extraerBearerToken: jest.fn().mockReturnValue('fake-token'),
  };
});

describe('UsuariosController', () => {
  let controlador: UsuariosController;
  let servicioSimulado: jest.Mocked<UsuariosService>;
  let respuestaSimulada: Partial<FastifyReply>;

  beforeEach(() => {
    servicioSimulado = new UsuariosService() as jest.Mocked<UsuariosService>;
    servicioSimulado.crearUsuario = jest.fn();
    servicioSimulado.listarUsuarios = jest.fn();
    servicioSimulado.actualizarUsuario = jest.fn();
    servicioSimulado.sincronizarUsuario = jest.fn();
    controlador = new UsuariosController();
    (controlador as unknown as { servicio: UsuariosService }).servicio = servicioSimulado;

    respuestaSimulada = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  const logSimulado = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

  describe('manejarCrearUsuario', () => {
    it('responde 200 cuando el servicio devuelve datos', async () => {
      const datos = [{ id_users: '1', type: 'CUSTOMER', isActive: true }];
      (servicioSimulado.crearUsuario as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarCrearUsuario(
        { method: 'POST', log: logSimulado, query: {}, body: { type: 'CUSTOMER' } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: datos });
    });

    it('responde 400 si la validación falla', async () => {
      const { transformAndValidate } = require('shared');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validación: campo'));

      await controlador.manejarCrearUsuario(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio lanza error', async () => {
      const { transformAndValidate } = require('shared');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.crearUsuario as jest.Mock).mockRejectedValue(new Error('fallo bd'));

      await controlador.manejarCrearUsuario(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarListarUsuarios', () => {
    it('responde 200 con lista', async () => {
      const datos = [{ id_users: '1', type: 'A', isActive: true, total_count: '1' }];
      (servicioSimulado.listarUsuarios as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarListarUsuarios(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si validación falla', async () => {
      const { transformAndValidate } = require('shared');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validación: y'));

      await controlador.manejarListarUsuarios(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('shared');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.listarUsuarios as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarListarUsuarios(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarActualizarUsuario', () => {
    it('responde 200', async () => {
      const datos = [{ id_users: '1', type: 'ADMIN', isActive: false }];
      (servicioSimulado.actualizarUsuario as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarActualizarUsuario(
        {
          method: 'POST',
          log: logSimulado,
          query: {},
          body: { id_users: '1', type: 'ADMIN' },
        } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si validación falla', async () => {
      const { transformAndValidate } = require('shared');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validación: z'));

      await controlador.manejarActualizarUsuario(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('shared');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.actualizarUsuario as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarActualizarUsuario(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarSincronizarUsuario', () => {
    beforeEach(() => {
      // Resetear los mocks de shared antes de cada test de sincronizar
      const shared = require('shared');
      shared.extraerBearerToken.mockReturnValue('fake-token');
      shared.extraerSubDeJwt.mockReturnValue('test-uuid-1234');
    });

    it('responde 200 cuando JWT es válido y el servicio retorna el usuario', async () => {
      const usuario = { id_users: 'test-uuid-1234', type: 'cliente', isActive: true };
      (servicioSimulado.sincronizarUsuario as jest.Mock).mockResolvedValue(usuario);

      await controlador.manejarSincronizarUsuario(
        { method: 'POST', log: logSimulado, headers: { authorization: 'Bearer fake-token' }, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: usuario });
    });

    it('responde 401 si no hay token', async () => {
      const { extraerBearerToken } = require('shared');
      extraerBearerToken.mockReturnValueOnce(null);

      await controlador.manejarSincronizarUsuario(
        { method: 'POST', log: logSimulado, headers: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(401);
    });

    it('responde 401 si el JWT es inválido', async () => {
      const { extraerSubDeJwt } = require('shared');
      extraerSubDeJwt.mockImplementationOnce(() => { throw new Error('token inválido'); });

      await controlador.manejarSincronizarUsuario(
        { method: 'POST', log: logSimulado, headers: { authorization: 'Bearer bad' }, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(401);
    });

    it('responde 500 si el servicio de sincronizar falla', async () => {
      (servicioSimulado.sincronizarUsuario as jest.Mock).mockRejectedValue(new Error('bd falla'));

      await controlador.manejarSincronizarUsuario(
        { method: 'POST', log: logSimulado, headers: { authorization: 'Bearer fake-token' }, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply,
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });
});
