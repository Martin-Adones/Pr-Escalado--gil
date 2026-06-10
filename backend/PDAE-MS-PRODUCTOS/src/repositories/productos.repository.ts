import { BaseRepository } from './base-repository';
import {
  CrearProductoEntradaDto,
  ListarProductosConsultaDto,
  ActualizarProductoEntradaDto,
  DesactivarProductoEntradaDto,
  FilaProducto,
  FilaProductoListado,
} from '../models/productos.dtos';

/**
 * Acceso a datos de productos: procedimientos en `database/productos/productos_funciones.sql`.
 */
export class ProductosRepository extends BaseRepository {
  async ejecutarCrearProducto(dto: CrearProductoEntradaDto): Promise<FilaProducto[]> {
    const params = [
      dto.name,
      dto.description ?? null,
      dto.type,
      dto.quantity ?? null,
      dto.price,
      dto.isActive ?? true,
    ];
    return await this.callProcedure<FilaProducto>('sp_crear_producto', params, undefined);
  }

  async ejecutarListarProductos(dto: ListarProductosConsultaDto): Promise<FilaProductoListado[]> {
    const params = [
      dto.id_products ?? null,
      dto.name ?? null,
      dto.type ?? null,
      dto.isActive ?? null,
      dto.page_size,
      dto.page_number,
    ];
    return await this.callProcedure<FilaProductoListado>('sp_listar_productos', params, undefined);
  }

  async ejecutarActualizarProducto(dto: ActualizarProductoEntradaDto): Promise<FilaProducto[]> {
    const params = [
      dto.id_products,
      dto.name ?? null,
      dto.description ?? null,
      dto.type ?? null,
      dto.quantity ?? null,
      dto.price ?? null,
    ];
    return await this.callProcedure<FilaProducto>('sp_actualizar_producto', params, undefined);
  }

  async ejecutarDesactivarProducto(dto: DesactivarProductoEntradaDto): Promise<FilaProducto[]> {
    const params = [dto.id_products];
    return await this.callProcedure<FilaProducto>('sp_desactivar_producto', params, undefined);
  }
}
