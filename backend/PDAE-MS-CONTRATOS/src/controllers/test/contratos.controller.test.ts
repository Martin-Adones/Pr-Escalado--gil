import { ContratosController } from '../contratos.controller';
import { ContratosService } from '../../services/contratos.service';
import { FastifyRequest, FastifyReply } from 'fastify';

jest.mock('../../services/contratos.service');
jest.mock('../../utils/validator', () => ({
  transformAndValidate: jest.fn().mockImplementation((_cls: unknown, data: unknown) => Promise.resolve(data)),
}));

describe('ContratosController', () => {
  let controlador: ContratosController;
  let servicioSimulado: jest.Mocked<ContratosService>;
  let respuestaSimulada: Partial<FastifyReply>;

  beforeEach(() => {
    servicioSimulado = new ContratosService() as jest.Mocked<ContratosService>;
    servicioSimulado.crearContrato = jest.fn();
    servicioSimulado.finalizarContrato = jest.fn();
    servicioSimulado.listarContratos = jest.fn();
    servicioSimulado.actualizarContrato = jest.fn();
    servicioSimulado.procesarPagoWebhook = jest.fn();
    servicioSimulado.ejecutarProcesoExpiracion = jest.fn();
    controlador = new ContratosController();
    (controlador as unknown as { servicio: ContratosService }).servicio = servicioSimulado;

    respuestaSimulada = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  const logSimulado = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

  describe('manejarCrearContrato', () => {
    it('responde 200 cuando el servicio devuelve datos', async () => {
      const solicitud = {
        method: 'POST',
        url: '/api/contratos/crear',
        log: logSimulado,
        query: {},
        body: { id_users: '1', id_plans: '1', status: 'ACTIVE' },
      };
      const datos = [{ id_contracts: '1' }];
      (servicioSimulado.crearContrato as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarCrearContrato(solicitud as unknown as FastifyRequest, respuestaSimulada as FastifyReply);

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: datos });
    });

    it('responde 400 si la validación falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validación: campo'));

      await controlador.manejarCrearContrato(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio lanza error', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.crearContrato as jest.Mock).mockRejectedValue(new Error('fallo bd'));

      await controlador.manejarCrearContrato(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarFinalizarContrato', () => {
    it('responde 200 con datos del servicio', async () => {
      const datos = [{ id_contracts: '1' }];
      (servicioSimulado.finalizarContrato as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarFinalizarContrato(
        { method: 'POST', log: logSimulado, query: {}, body: { id_contracts: '1' } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({ success: true, data: datos });
    });

    it('responde 400 si validación falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validación: x'));

      await controlador.manejarFinalizarContrato(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.finalizarContrato as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarFinalizarContrato(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });

    it('responde 200 si el cliente finaliza su propio contrato', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      
      const solicitud = {
        method: 'POST',
        log: logSimulado,
        headers: { 'x-user-role': 'client', 'x-user-id': '3' },
        body: { id_contracts: '1' }
      };
      
      (servicioSimulado.listarContratos as jest.Mock).mockResolvedValueOnce([{ id_contracts: '1', id_users: '3' }]);
      (servicioSimulado.finalizarContrato as jest.Mock).mockResolvedValue([{ id_contracts: '1', status: 'TERMINATED' }]);

      await controlador.manejarFinalizarContrato(solicitud as unknown as FastifyRequest, respuestaSimulada as FastifyReply);

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 403 si el cliente intenta finalizar un contrato de otro usuario', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      
      const solicitud = {
        method: 'POST',
        log: logSimulado,
        headers: { 'x-user-role': 'client', 'x-user-id': '3' },
        body: { id_contracts: '1' }
      };
      
      (servicioSimulado.listarContratos as jest.Mock).mockResolvedValueOnce([{ id_contracts: '1', id_users: '99' }]);

      await controlador.manejarFinalizarContrato(solicitud as unknown as FastifyRequest, respuestaSimulada as FastifyReply);

      expect(respuestaSimulada.status).toHaveBeenCalledWith(403);
    });
  });

  describe('manejarListarContratos', () => {
    it('responde 200 con lista', async () => {
      const datos = [{ id_contracts: '1' }];
      (servicioSimulado.listarContratos as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarListarContratos(
        { method: 'GET', log: logSimulado, query: { id_contracts: '1' }, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si validación falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validación: y'));

      await controlador.manejarListarContratos(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.listarContratos as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarListarContratos(
        { method: 'GET', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarActualizarContrato', () => {
    it('responde 200', async () => {
      const datos = [{ id_contracts: '1' }];
      (servicioSimulado.actualizarContrato as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarActualizarContrato(
        { method: 'POST', log: logSimulado, query: {}, body: { id_contracts: '1' } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si validación falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validación: z'));

      await controlador.manejarActualizarContrato(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el servicio falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.actualizarContrato as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarActualizarContrato(
        { method: 'POST', log: logSimulado, query: {}, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarWebhookPagos', () => {
    it('responde 200 si el procesamiento de webhook es exitoso', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      
      const datos = [{ id_contracts: '1', status: 'ACTIVE' }];
      (servicioSimulado.procesarPagoWebhook as jest.Mock).mockResolvedValue(datos);

      await controlador.manejarWebhookPagos(
        { method: 'POST', log: logSimulado, body: { event: 'pago.completado', id_contracts: '1', amount: 19990 } } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({
        success: true,
        message: 'Evento de pago procesado correctamente',
        data: datos
      });
    });

    it('responde 400 si la validación falla en webhook', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockRejectedValueOnce(new Error('Error de Validación: event'));

      await controlador.manejarWebhookPagos(
        { method: 'POST', log: logSimulado, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 si el procesamiento de webhook falla', async () => {
      const { transformAndValidate } = require('../../utils/validator');
      transformAndValidate.mockImplementationOnce((_c: unknown, d: unknown) => Promise.resolve(d));
      (servicioSimulado.procesarPagoWebhook as jest.Mock).mockRejectedValue(new Error('bd'));

      await controlador.manejarWebhookPagos(
        { method: 'POST', log: logSimulado, body: {} } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });

  describe('manejarCronExpiracion', () => {
    it('responde 200 si el cron job se ejecuta correctamente', async () => {
      const reporte = { procesados: 2, detalles: [] };
      (servicioSimulado.ejecutarProcesoExpiracion as jest.Mock).mockResolvedValue(reporte);

      await controlador.manejarCronExpiracion(
        { method: 'POST', log: logSimulado } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(200);
      expect(respuestaSimulada.send).toHaveBeenCalledWith({
        success: true,
        message: 'Cron de expiración de contratos ejecutado correctamente',
        data: reporte
      });
    });

    it('responde 500 si la ejecución de cron falla', async () => {
      (servicioSimulado.ejecutarProcesoExpiracion as jest.Mock).mockRejectedValue(new Error('cron fail'));

      await controlador.manejarCronExpiracion(
        { method: 'POST', log: logSimulado } as unknown as FastifyRequest,
        respuestaSimulada as FastifyReply
      );

      expect(respuestaSimulada.status).toHaveBeenCalledWith(500);
    });
  });
});
