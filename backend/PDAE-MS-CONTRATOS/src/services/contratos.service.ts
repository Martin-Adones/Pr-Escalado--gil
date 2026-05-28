import { ContratosRepository } from '../repositories/contratos.repository';
import {
  CrearContratoEntradaDto,
  FinalizarContratoEntradaDto,
  ListarContratosConsultaDto,
  ActualizarContratoEntradaDto,
  FilaContrato,
  FilaContratoListado,
} from '../models/contratos.dtos';

/**
 * Caso de uso de contratos: orquesta el repositorio (sin conocer HTTP).
 */
export class ContratosService {
  private repositorio: ContratosRepository;

  constructor() {
    this.repositorio = new ContratosRepository();
  }

  async crearContrato(dto: CrearContratoEntradaDto): Promise<FilaContrato[]> {
    return await this.repositorio.ejecutarCrearContrato(dto);
  }

  async finalizarContrato(dto: FinalizarContratoEntradaDto): Promise<FilaContrato[]> {
    return await this.repositorio.ejecutarFinalizarContrato(dto);
  }

  async listarContratos(dto: ListarContratosConsultaDto): Promise<FilaContratoListado[]> {
    return await this.repositorio.ejecutarListarContratos(dto);
  }

  async actualizarContrato(dto: ActualizarContratoEntradaDto): Promise<FilaContrato[]> {
    return await this.repositorio.ejecutarActualizarContrato(dto);
  }
}
