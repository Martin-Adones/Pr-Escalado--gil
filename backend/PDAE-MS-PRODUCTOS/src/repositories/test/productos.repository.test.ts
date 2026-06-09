import { ProductosRepository } from '../productos.repository';
import { BaseRepository } from '../base-repository';

describe('ProductosRepository', () => {
  let repositorio: ProductosRepository;

  beforeEach(() => {
    repositorio = new ProductosRepository();
    jest.restoreAllMocks();
  });

  it('ejecutarCrearProducto llama a sp_crear_producto con los parametros en orden', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    const dto = { name: 'A', description: null, type: 'X', quantity: 1, price: 10, isActive: true } as never;
    await repositorio.ejecutarCrearProducto(dto);
    expect(espia).toHaveBeenCalledWith('sp_crear_producto', ['A', null, 'X', 1, 10, true], undefined);
  });

  it('ejecutarListarProductos llama a sp_listar_productos', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarListarProductos({ id_products: '1' } as never);
    expect(espia).toHaveBeenCalledWith('sp_listar_productos', expect.any(Array), undefined);
  });

  it('ejecutarActualizarProducto llama a sp_actualizar_producto', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarActualizarProducto({ id_products: '1' } as never);
    expect(espia).toHaveBeenCalledWith('sp_actualizar_producto', expect.any(Array), undefined);
  });

  it('ejecutarDesactivarProducto llama a sp_desactivar_producto', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    await repositorio.ejecutarDesactivarProducto({ id_products: '9' } as never);
    expect(espia).toHaveBeenCalledWith('sp_desactivar_producto', ['9'], undefined);
  });
});
