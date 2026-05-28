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
});
