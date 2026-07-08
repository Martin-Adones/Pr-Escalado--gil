import { PlanesRepository } from '../repositories/planes.repository';
import {
  CrearPlanEntradaDto,
  ListarPlanesConsultaDto,
  ActualizarPlanEntradaDto,
  DesactivarPlanEntradaDto,
  FilaPlan,
  FilaPlanListado,
  FilaProducto,
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
    const planes = await this.repositorio.ejecutarListarPlanes(dto);
    if (planes.length === 0) return planes;

    const idPlans = planes.map(p => p.id_plans);
    const productos = await this.repositorio.ejecutarListarProductosDePlanes(idPlans);
    const productosPorPlan = new Map<string, FilaProducto[]>();
    for (const prod of productos) {
      const arr = productosPorPlan.get(prod.id_plans);
      if (arr) {
        arr.push(prod);
      } else {
        productosPorPlan.set(prod.id_plans, [prod]);
      }
    }

    for (const plan of planes) {
      const prods = productosPorPlan.get(plan.id_plans);
      if (prods) {
        plan.products = prods;
      }
    }

    return planes;
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
