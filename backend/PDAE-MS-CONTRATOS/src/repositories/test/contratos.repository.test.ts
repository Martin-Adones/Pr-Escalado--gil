import { ContratosRepository } from '../contratos.repository';
import { BaseRepository } from '../base-repository';

describe('ContratosRepository', () => {
  let repositorio: ContratosRepository;

  beforeEach(() => {
    repositorio = new ContratosRepository();
    jest.restoreAllMocks();
  });

  it('ejecutarCrearContrato llama a sp_crear_contrato con los parámetros en orden', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    const dto = { id_users: '1', id_plans: '2', status: 'ACTIVE', start_date: undefined, end_date: undefined } as never;
    await repositorio.ejecutarCrearContrato(dto);
    expect(espia).toHaveBeenCalledWith('sp_crear_contrato', ['1', '2', 'ACTIVE', undefined, undefined], undefined);
  });

  it('ejecutarFinalizarContrato llama a sp_finalizar_contrato', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarFinalizarContrato({ id_contracts: '9' } as never);
    expect(espia).toHaveBeenCalledWith('sp_finalizar_contrato', ['9'], undefined);
  });

  it('ejecutarListarContratos llama a sp_listar_contratos', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarListarContratos({ id_contracts: '1' } as never);
    expect(espia).toHaveBeenCalledWith('sp_listar_contratos', expect.any(Array), undefined);
  });

  it('ejecutarActualizarContrato llama a sp_actualizar_contrato', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarActualizarContrato({ id_contracts: '1' } as never);
    expect(espia).toHaveBeenCalledWith('sp_actualizar_contrato', expect.any(Array), undefined);
  });
});
