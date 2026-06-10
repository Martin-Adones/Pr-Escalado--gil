import { ProductosRepository } from '../repositories/productos.repository';
import {
  CrearProductoEntradaDto,
  ListarProductosConsultaDto,
  ActualizarProductoEntradaDto,
  DesactivarProductoEntradaDto,
  FilaProducto,
  FilaProductoListado,
} from '../models/productos.dtos';

/**
 * Caso de uso de productos: orquesta el repositorio (sin conocer HTTP).
 */
export class ProductosService {
  private repositorio: ProductosRepository;

  constructor() {
    this.repositorio = new ProductosRepository();
  }

  async crearProducto(
    dto: CrearProductoEntradaDto | CrearProductoEntradaDto[]
  ): Promise<FilaProducto[]> {
    const resultados: FilaProducto[] = [];
    const productos = Array.isArray(dto) ? dto : [dto];

    for (const producto of productos) {
      const res = await this.repositorio.ejecutarCrearProducto(producto);
      if (Array.isArray(res)) {
        resultados.push(...res);
      }
    }

    return resultados;
  }

  async listarProductos(dto: ListarProductosConsultaDto): Promise<FilaProductoListado[]> {
    return await this.repositorio.ejecutarListarProductos(dto);
  }

  async actualizarProducto(dto: ActualizarProductoEntradaDto): Promise<FilaProducto[]> {
    return await this.repositorio.ejecutarActualizarProducto(dto);
  }

  async desactivarProducto(dto: DesactivarProductoEntradaDto): Promise<FilaProducto[]> {
    return await this.repositorio.ejecutarDesactivarProducto(dto);
  }
}
