import { UsuariosService } from '../usuarios.service';
import { UsuariosRepository } from '../../repositories/usuarios.repository';

jest.mock('../../repositories/usuarios.repository');

describe('UsuariosService', () => {
  let servicio: UsuariosService;
  let repositorioSimulado: jest.Mocked<UsuariosRepository>;

  beforeEach(() => {
    repositorioSimulado = new UsuariosRepository() as jest.Mocked<UsuariosRepository>;
    repositorioSimulado.ejecutarCrearUsuario = jest.fn();
    repositorioSimulado.ejecutarListarUsuarios = jest.fn();
    repositorioSimulado.ejecutarActualizarUsuario = jest.fn();
    servicio = new UsuariosService();
    (servicio as unknown as { repositorio: UsuariosRepository }).repositorio = repositorioSimulado;
  });

  it('crearUsuario delega al repositorio', async () => {
    const filas = [{ id_users: '1', type: 'X', isActive: true } as never];
    (repositorioSimulado.ejecutarCrearUsuario as jest.Mock).mockResolvedValue(filas);
    const dto = { type: 'CUSTOMER', isActive: true } as never;
    const resultado = await servicio.crearUsuario(dto);
    expect(repositorioSimulado.ejecutarCrearUsuario).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(filas);
  });

  it('listarUsuarios delega al repositorio', async () => {
    (repositorioSimulado.ejecutarListarUsuarios as jest.Mock).mockResolvedValue([]);
    await servicio.listarUsuarios({} as never);
    expect(repositorioSimulado.ejecutarListarUsuarios).toHaveBeenCalled();
  });

  it('actualizarUsuario delega al repositorio', async () => {
    (repositorioSimulado.ejecutarActualizarUsuario as jest.Mock).mockResolvedValue([]);
    await servicio.actualizarUsuario({ id_users: '1', type: 'Y', isActive: false } as never);
    expect(repositorioSimulado.ejecutarActualizarUsuario).toHaveBeenCalled();
  });
});
