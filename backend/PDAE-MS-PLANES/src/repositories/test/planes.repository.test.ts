import { PlanesRepository } from '../planes.repository';
import { BaseRepository } from '../base-repository';

describe('PlanesRepository', () => {
  let repositorio: PlanesRepository;

  beforeEach(() => {
    repositorio = new PlanesRepository();
    jest.restoreAllMocks();
  });

  it('ejecutarCrearPlan llama a sp_crear_plan con los parametros en orden', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    const dto = { name: 'BASICO', billing_cycle: 'monthly', amount: 20, isActive: true } as never;
    await repositorio.ejecutarCrearPlan(dto);
    expect(espia).toHaveBeenCalledWith('sp_crear_plan', ['BASICO', 'monthly', 20, true], undefined);
  });

  it('ejecutarListarPlanes llama a sp_listar_planes', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarListarPlanes({ id_plans: '1' } as never);
    expect(espia).toHaveBeenCalledWith('sp_listar_planes', expect.any(Array), undefined);
  });

  it('ejecutarActualizarPlan llama a sp_actualizar_plan', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarActualizarPlan({ id_plans: '1' } as never);
    expect(espia).toHaveBeenCalledWith('sp_actualizar_plan', expect.any(Array), undefined);
  });

  it('ejecutarDesactivarPlan llama a sp_desactivar_plan', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarDesactivarPlan({ id_plans: '9' } as never);
    expect(espia).toHaveBeenCalledWith('sp_desactivar_plan', ['9'], undefined);
  });

  it('ejecutarRegistrarProductosPlan llama a sp_registrar_productos_plan', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarRegistrarProductosPlan({ id_plans: '1', id_products: ['2', '3'] } as never);
    expect(espia).toHaveBeenCalledWith('sp_registrar_productos_plan', ['1', ['2', '3']], undefined);
  });
});
