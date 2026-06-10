import { PlanesService } from '../planes.service';
import { PlanesRepository } from '../../repositories/planes.repository';

jest.mock('../../repositories/planes.repository');

describe('PlanesService', () => {
  let servicio: PlanesService;
  let repositorioSimulado: jest.Mocked<PlanesRepository>;

  beforeEach(() => {
    repositorioSimulado = new PlanesRepository() as jest.Mocked<PlanesRepository>;
    repositorioSimulado.ejecutarCrearPlan = jest.fn();
    repositorioSimulado.ejecutarListarPlanes = jest.fn();
    repositorioSimulado.ejecutarActualizarPlan = jest.fn();
    repositorioSimulado.ejecutarDesactivarPlan = jest.fn();
    repositorioSimulado.ejecutarRegistrarProductosPlan = jest.fn();
    servicio = new PlanesService();
    (servicio as unknown as { repositorio: PlanesRepository }).repositorio = repositorioSimulado;
  });

  it('crearPlan delega al repositorio', async () => {
    const filas = [{ id_plans: '1' } as never];
    (repositorioSimulado.ejecutarCrearPlan as jest.Mock).mockResolvedValue(filas);
    const dto = { name: 'BASICO', billing_cycle: 'monthly', amount: 20 } as never;
    const resultado = await servicio.crearPlan(dto);
    expect(repositorioSimulado.ejecutarCrearPlan).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(filas);
  });

  it('listarPlanes delega al repositorio', async () => {
    (repositorioSimulado.ejecutarListarPlanes as jest.Mock).mockResolvedValue([]);
    await servicio.listarPlanes({} as never);
    expect(repositorioSimulado.ejecutarListarPlanes).toHaveBeenCalled();
  });

  it('actualizarPlan delega al repositorio', async () => {
    (repositorioSimulado.ejecutarActualizarPlan as jest.Mock).mockResolvedValue([]);
    await servicio.actualizarPlan({ id_plans: '1' } as never);
    expect(repositorioSimulado.ejecutarActualizarPlan).toHaveBeenCalled();
  });

  it('desactivarPlan delega al repositorio', async () => {
    (repositorioSimulado.ejecutarDesactivarPlan as jest.Mock).mockResolvedValue([]);
    await servicio.desactivarPlan({ id_plans: '1' } as never);
    expect(repositorioSimulado.ejecutarDesactivarPlan).toHaveBeenCalled();
  });

  it('registrarProductosPlan delega al repositorio', async () => {
    (repositorioSimulado.ejecutarRegistrarProductosPlan as jest.Mock).mockResolvedValue([]);
    await servicio.registrarProductosPlan({ id_plans: '1', id_products: ['2'] } as never);
    expect(repositorioSimulado.ejecutarRegistrarProductosPlan).toHaveBeenCalled();
  });
});
