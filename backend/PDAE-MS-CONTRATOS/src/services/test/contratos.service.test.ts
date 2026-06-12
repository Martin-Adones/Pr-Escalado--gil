import { ContratosService } from '../contratos.service';
import { ContratosRepository } from '../../repositories/contratos.repository';

jest.mock('../../repositories/contratos.repository');

describe('ContratosService', () => {
  let servicio: ContratosService;
  let repositorioSimulado: jest.Mocked<ContratosRepository>;

  beforeEach(() => {
    repositorioSimulado = new ContratosRepository() as jest.Mocked<ContratosRepository>;
    repositorioSimulado.ejecutarCrearContrato = jest.fn();
    repositorioSimulado.ejecutarFinalizarContrato = jest.fn();
    repositorioSimulado.ejecutarListarContratos = jest.fn();
    repositorioSimulado.ejecutarActualizarContrato = jest.fn();
    repositorioSimulado.registrarCicloDeCobro = jest.fn();
    repositorioSimulado.registrarLogAuditoria = jest.fn();
    repositorioSimulado.obtenerContratosExpirados = jest.fn();
    servicio = new ContratosService();
    (servicio as unknown as { repositorio: ContratosRepository }).repositorio = repositorioSimulado;
  });

  it('crearContrato delega al repositorio', async () => {
    const filas = [{ id_contracts: '1' } as never];
    (repositorioSimulado.ejecutarCrearContrato as jest.Mock).mockResolvedValue(filas);
    const dto = { id_users: '1', id_plans: '1', status: 'ACTIVE' } as never;
    const resultado = await servicio.crearContrato(dto);
    expect(repositorioSimulado.ejecutarCrearContrato).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(filas);
  });

  it('finalizarContrato delega al repositorio', async () => {
    const filas = [{ id_contracts: '1' } as never];
    (repositorioSimulado.ejecutarFinalizarContrato as jest.Mock).mockResolvedValue(filas);
    const dto = { id_contracts: '1' } as never;
    await servicio.finalizarContrato(dto);
    expect(repositorioSimulado.ejecutarFinalizarContrato).toHaveBeenCalledWith(dto);
  });

  it('listarContratos delega al repositorio', async () => {
    (repositorioSimulado.ejecutarListarContratos as jest.Mock).mockResolvedValue([]);
    await servicio.listarContratos({} as never);
    expect(repositorioSimulado.ejecutarListarContratos).toHaveBeenCalled();
  });

  it('actualizarContrato delega al repositorio', async () => {
    (repositorioSimulado.ejecutarActualizarContrato as jest.Mock).mockResolvedValue([]);
    await servicio.actualizarContrato({ id_contracts: '1' } as never);
    expect(repositorioSimulado.ejecutarActualizarContrato).toHaveBeenCalled();
  });

  describe('procesarPagoWebhook', () => {
    it('procesa pago completado exitosamente', async () => {
      const dto = { event: 'pago.completado', id_contracts: '1', amount: 19990 };
      (repositorioSimulado.ejecutarActualizarContrato as jest.Mock).mockResolvedValue([{ id_contracts: '1', status: 'ACTIVE' }]);

      const resultado = await servicio.procesarPagoWebhook(dto as any);

      expect(repositorioSimulado.ejecutarActualizarContrato).toHaveBeenCalledWith({
        id_contracts: '1',
        status: 'ACTIVE'
      });
      expect(repositorioSimulado.registrarCicloDeCobro).toHaveBeenCalledWith('1', 19990, 'completed', 0);
      expect(repositorioSimulado.registrarLogAuditoria).toHaveBeenCalledWith('1', 'PAGO_COMPLETADO_WEBHOOK', 'sistema');
      expect(resultado).toEqual([{ id_contracts: '1', status: 'ACTIVE' }]);
    });

    it('procesa pago fallido exitosamente', async () => {
      const dto = { event: 'pago.fallido', id_contracts: '2', amount: 9990 };
      (repositorioSimulado.ejecutarActualizarContrato as jest.Mock).mockResolvedValue([{ id_contracts: '2', status: 'SUSPENDED' }]);

      const resultado = await servicio.procesarPagoWebhook(dto as any);

      expect(repositorioSimulado.ejecutarActualizarContrato).toHaveBeenCalledWith({
        id_contracts: '2',
        status: 'SUSPENDED'
      });
      expect(repositorioSimulado.registrarCicloDeCobro).toHaveBeenCalledWith('2', 9990, 'failed', 1);
      expect(repositorioSimulado.registrarLogAuditoria).toHaveBeenCalledWith('2', 'PAGO_FALLIDO_WEBHOOK', 'sistema');
      expect(resultado).toEqual([{ id_contracts: '2', status: 'SUSPENDED' }]);
    });
  });

  describe('ejecutarProcesoExpiracion', () => {
    it('finaliza los contratos expirados y registra en auditoria', async () => {
      const expiredList = [
        { id_contracts: '10', id_users: '3', status: 'ACTIVE', end_date: '2026-06-01' },
        { id_contracts: '11', id_users: '4', status: 'SUSPENDED', end_date: '2026-06-02' }
      ];
      (repositorioSimulado.obtenerContratosExpirados as jest.Mock).mockResolvedValue(expiredList);
      (repositorioSimulado.ejecutarFinalizarContrato as jest.Mock).mockResolvedValue([]);

      const resultado = await servicio.ejecutarProcesoExpiracion();

      expect(repositorioSimulado.obtenerContratosExpirados).toHaveBeenCalled();
      expect(repositorioSimulado.ejecutarFinalizarContrato).toHaveBeenCalledTimes(2);
      expect(repositorioSimulado.ejecutarFinalizarContrato).toHaveBeenNthCalledWith(1, { id_contracts: '10' });
      expect(repositorioSimulado.ejecutarFinalizarContrato).toHaveBeenNthCalledWith(2, { id_contracts: '11' });
      expect(repositorioSimulado.registrarLogAuditoria).toHaveBeenCalledWith('10', 'FINALIZAR_CONTRATO_CRON', 'sistema');
      expect(repositorioSimulado.registrarLogAuditoria).toHaveBeenCalledWith('11', 'FINALIZAR_CONTRATO_CRON', 'sistema');
      expect(resultado.procesados).toBe(2);
    });
  });
});
