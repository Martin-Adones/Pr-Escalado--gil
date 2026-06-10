import { BaseRepository } from './base-repository';
import {
  CrearPlanEntradaDto,
  ListarPlanesConsultaDto,
  ActualizarPlanEntradaDto,
  DesactivarPlanEntradaDto,
  FilaPlan,
  FilaPlanListado,
  RegistrarProductosPlanEntradaDto,
  FilaPlanProducto,
} from '../models/planes.dtos';

/**
 * Acceso a datos de planes: procedimientos en `database/planes/planes_funciones.sql`.
 */
export class PlanesRepository extends BaseRepository {
  async ejecutarCrearPlan(dto: CrearPlanEntradaDto): Promise<FilaPlan[]> {
    const params = [dto.name, dto.billing_cycle, dto.amount, dto.isActive ?? true];
    return await this.callProcedure<FilaPlan>('sp_crear_plan', params, undefined);
  }

  async ejecutarListarPlanes(dto: ListarPlanesConsultaDto): Promise<FilaPlanListado[]> {
    const params = [
      dto.id_plans ?? null,
      dto.name ?? null,
      dto.billing_cycle ?? null,
      dto.isActive ?? null,
      dto.page_size,
      dto.page_number,
    ];
    return await this.callProcedure<FilaPlanListado>('sp_listar_planes', params, undefined);
  }

  async ejecutarActualizarPlan(dto: ActualizarPlanEntradaDto): Promise<FilaPlan[]> {
    const params = [dto.id_plans, dto.name ?? null, dto.billing_cycle ?? null, dto.amount ?? null];
    return await this.callProcedure<FilaPlan>('sp_actualizar_plan', params, undefined);
  }

  async ejecutarDesactivarPlan(dto: DesactivarPlanEntradaDto): Promise<FilaPlan[]> {
    const params = [dto.id_plans];
    return await this.callProcedure<FilaPlan>('sp_desactivar_plan', params, undefined);
  }

  async ejecutarRegistrarProductosPlan(dto: RegistrarProductosPlanEntradaDto): Promise<FilaPlanProducto[]> {
    const params = [dto.id_plans, dto.id_products];
    return await this.callProcedure<FilaPlanProducto>('sp_registrar_productos_plan', params, undefined);
  }
}
