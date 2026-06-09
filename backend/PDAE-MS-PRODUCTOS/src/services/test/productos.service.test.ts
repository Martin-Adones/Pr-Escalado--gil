import { ProductosService } from '../productos.service';
import { ProductosRepository } from '../../repositories/productos.repository';

jest.mock('../../repositories/productos.repository');

describe('ProductosService', () => {
  let servicio: ProductosService;
  let repositorioSimulado: jest.Mocked<ProductosRepository>;

  beforeEach(() => {
    repositorioSimulado = new ProductosRepository() as jest.Mocked<ProductosRepository>;
    repositorioSimulado.ejecutarCrearProducto = jest.fn();
    repositorioSimulado.ejecutarListarProductos = jest.fn();
    repositorioSimulado.ejecutarActualizarProducto = jest.fn();
    repositorioSimulado.ejecutarDesactivarProducto = jest.fn();
    servicio = new ProductosService();
    (servicio as unknown as { repositorio: ProductosRepository }).repositorio = repositorioSimulado;
  });

  it('crearProducto delega al repositorio', async () => {
    const filas = [{ id_products: '1' } as never];
    (repositorioSimulado.ejecutarCrearProducto as jest.Mock).mockResolvedValue(filas);
    const dto = { name: 'A', type: 'X', price: 10 } as never;
    const resultado = await servicio.crearProducto(dto);
    expect(repositorioSimulado.ejecutarCrearProducto).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(filas);
  });

  it('listarProductos delega al repositorio', async () => {
    (repositorioSimulado.ejecutarListarProductos as jest.Mock).mockResolvedValue([]);
    await servicio.listarProductos({} as never);
    expect(repositorioSimulado.ejecutarListarProductos).toHaveBeenCalled();
  });

  it('actualizarProducto delega al repositorio', async () => {
    (repositorioSimulado.ejecutarActualizarProducto as jest.Mock).mockResolvedValue([]);
    await servicio.actualizarProducto({ id_products: '1' } as never);
    expect(repositorioSimulado.ejecutarActualizarProducto).toHaveBeenCalled();
  });

  it('desactivarProducto delega al repositorio', async () => {
    (repositorioSimulado.ejecutarDesactivarProducto as jest.Mock).mockResolvedValue([]);
    await servicio.desactivarProducto({ id_products: '1' } as never);
    expect(repositorioSimulado.ejecutarDesactivarProducto).toHaveBeenCalled();
  });
});
