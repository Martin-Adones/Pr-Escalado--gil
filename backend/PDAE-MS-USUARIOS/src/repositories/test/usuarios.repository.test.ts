import { UsuariosRepository } from '../usuarios.repository';
import { BaseRepository } from '../base-repository';

describe('UsuariosRepository', () => {
  let repositorio: UsuariosRepository;

  beforeEach(() => {
    repositorio = new UsuariosRepository();
    jest.restoreAllMocks();
  });

  it('ejecutarCrearUsuario llama a sp_crear_usuario con type e isActive', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id_users: '1' }]);
    await repositorio.ejecutarCrearUsuario({ type: 'CUSTOMER' } as never);
    expect(espia).toHaveBeenCalledWith('sp_crear_usuario', ['CUSTOMER', true], undefined);
  });

  it('ejecutarListarUsuarios llama a sp_listar_usuarios con orden de parámetros', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([]);
    await repositorio.ejecutarListarUsuarios({
      id_users: '5',
      type: 'ADM',
      page_size: 20,
      page_number: 2,
    } as never);
    expect(espia).toHaveBeenCalledWith('sp_listar_usuarios', ['5', 'ADM', 20, 2, null], undefined);
  });

  it('ejecutarListarUsuarios pasa null en filtros omitidos', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([]);
    await repositorio.ejecutarListarUsuarios({
      page_size: 10,
      page_number: 1,
    } as never);
    expect(espia).toHaveBeenCalledWith('sp_listar_usuarios', [null, null, 10, 1, null], undefined);
  });

  it('ejecutarActualizarUsuario llama a sp_actualizar_usuario', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([]);
    await repositorio.ejecutarActualizarUsuario({ id_users: '3', type: 'ADMIN' } as never);
    expect(espia).toHaveBeenCalledWith('sp_actualizar_usuario', ['3', 'ADMIN', null], undefined);
  });
});
