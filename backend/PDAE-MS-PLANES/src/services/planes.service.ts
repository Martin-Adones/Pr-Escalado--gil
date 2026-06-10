import { PlanesRepository } from '../repositories/planes.repository';
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
 * Caso de uso de planes: orquesta el repositorio (sin conocer HTTP).
 */
export class PlanesService {
  private repositorio: PlanesRepository;

  constructor() {
    this.repositorio = new PlanesRepository();
  }

  async crearPlan(dto: CrearPlanEntradaDto): Promise<FilaPlan[]> {
    return await this.repositorio.ejecutarCrearPlan(dto);
  }

  async listarPlanes(dto: ListarPlanesConsultaDto): Promise<FilaPlanListado[]> {
    return await this.repositorio.ejecutarListarPlanes(dto);
  }

  async actualizarPlan(dto: ActualizarPlanEntradaDto): Promise<FilaPlan[]> {
    return await this.repositorio.ejecutarActualizarPlan(dto);
  }

  async desactivarPlan(dto: DesactivarPlanEntradaDto): Promise<FilaPlan[]> {
    return await this.repositorio.ejecutarDesactivarPlan(dto);
  }

  async registrarProductosPlan(dto: RegistrarProductosPlanEntradaDto): Promise<FilaPlanProducto[]> {
    return await this.repositorio.ejecutarRegistrarProductosPlan(dto);
  }
}
