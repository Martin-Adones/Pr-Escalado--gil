import { BaseRepository } from "./base-repository";
import {
  CrearUsuarioEntradaDto,
  ListarUsuariosConsultaDto,
  ActualizarUsuarioEntradaDto,
  SincronizarUsuarioEntradaDto,
  FilaUsuario,
  FilaUsuarioListado,
  FilaUsuarioPorKeycloakId,
  FilaSincronizarUsuario,
} from "../models/usuarios.dtos";

/**
 * Acceso a datos de usuarios: procedimientos en `database/usuarios/usuarios_funciones.sql`.
 */
export class UsuariosRepository extends BaseRepository {
  async ejecutarCrearUsuario(
    dto: CrearUsuarioEntradaDto,
  ): Promise<FilaUsuario[]> {
    const params = [dto.type, null, dto.isActive ?? true];
    return await this.callProcedure<FilaUsuario>(
      "sp_crear_usuario",
      params,
      undefined,
    );
  }

  async ejecutarListarUsuarios(
    dto: ListarUsuariosConsultaDto,
  ): Promise<FilaUsuarioListado[]> {
    const params = [
      dto.id_users ?? null,
      dto.type ?? null,
      dto.page_size,
      dto.page_number,
      dto.isActive ?? null,
    ];
    return await this.callProcedure<FilaUsuarioListado>(
      "sp_listar_usuarios",
      params,
      undefined,
    );
  }

  async ejecutarActualizarUsuario(
    dto: ActualizarUsuarioEntradaDto,
  ): Promise<FilaUsuario[]> {
    const params = [dto.id_users, dto.type, dto.isActive ?? null];
    return await this.callProcedure<FilaUsuario>(
      "sp_actualizar_usuario",
      params,
      undefined,
    );
  }

  async ejecutarBuscarPorKeycloakId(
    keycloak_id: string,
  ): Promise<FilaUsuarioPorKeycloakId[]> {
    return await this.callProcedure<FilaUsuarioPorKeycloakId>(
      "sp_buscar_usuario_por_keycloak_id",
      [keycloak_id],
      undefined,
    );
  }

  async ejecutarSincronizarUsuario(
    dto: SincronizarUsuarioEntradaDto,
  ): Promise<FilaSincronizarUsuario[]> {
    const params = [dto.keycloak_id, dto.type ?? "cliente", dto.isActive ?? true];
    return await this.callProcedure<FilaSincronizarUsuario>(
      "sp_sincronizar_usuario",
      params,
      undefined,
    );
  }
}
