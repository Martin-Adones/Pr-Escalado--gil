import { UsuariosRepository } from "../repositories/usuarios.repository";
import {
  CrearUsuarioEntradaDto,
  ListarUsuariosConsultaDto,
  ActualizarUsuarioEntradaDto,
  FilaUsuario,
  FilaUsuarioListado,
  FilaUsuarioPorKeycloakId,
} from "../models/usuarios.dtos";

/** Casos de uso de usuarios (sin dependencia de HTTP). */
export class UsuariosService {
  private repositorio: UsuariosRepository;

  constructor() {
    this.repositorio = new UsuariosRepository();
  }

  async crearUsuario(dto: CrearUsuarioEntradaDto): Promise<FilaUsuario[]> {
    return await this.repositorio.ejecutarCrearUsuario(dto);
  }

  async listarUsuarios(
    dto: ListarUsuariosConsultaDto,
  ): Promise<FilaUsuarioListado[]> {
    return await this.repositorio.ejecutarListarUsuarios(dto);
  }

  async actualizarUsuario(
    dto: ActualizarUsuarioEntradaDto,
  ): Promise<FilaUsuario[]> {
    return await this.repositorio.ejecutarActualizarUsuario(dto);
  }

  async buscarUsuarioActual(
    keycloak_id: string,
  ): Promise<FilaUsuarioPorKeycloakId | null> {
    const filas =
      await this.repositorio.ejecutarBuscarPorKeycloakId(keycloak_id);
    return filas[0] ?? null;
  }
}
