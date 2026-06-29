/**
 * DTOs del dominio Usuarios (tabla `Users`: id_users, type, isActive).
 * Los procedimientos en PostgreSQL están en `database/usuarios/usuarios_funciones.sql`.
 */
import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import {
  REGEX_ID_BIGINT,
  MENSAJE_ID_BIGINT,
  TransformVacioAIndefinido,
  TransformNormalizarBooleano,
} from "shared";

/** Cuerpo POST - `sp_crear_usuario` */
export class CrearUsuarioEntradaDto {
  @IsString()
  @IsNotEmpty({ message: "El campo type es requerido" })
  @MinLength(1, { message: "type no puede estar vacío" })
  @MaxLength(255, { message: "type admite como máximo 255 caracteres" })
  type!: string;

  @TransformNormalizarBooleano
  @IsOptional()
  @IsBoolean({ message: "isActive debe ser booleano" })
  isActive?: boolean;
}

export interface FilaUsuario {
  id_users: string;
  type: string;
  isActive: boolean;
}

/** Query GET - `sp_listar_usuarios` */
export class ListarUsuariosConsultaDto {
  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: "id_users debe ser un UUID v4 válido" })
  id_users!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "type: filtro demasiado largo" })
  type!: string;

  @TransformNormalizarBooleano
  @IsOptional()
  @IsBoolean({ message: "isActive debe ser booleano" })
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page_size: number = 10;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page_number: number = 1;
}

export interface FilaUsuarioListado extends FilaUsuario {
  total_count: string;
}

/** Cuerpo POST - `sp_actualizar_usuario` */
export class ActualizarUsuarioEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: "El campo id_users es requerido" })
  @IsUUID(4, { message: "id_users debe ser un UUID v4 válido" })
  id_users!: string;

  @IsString()
  @IsNotEmpty({ message: "El campo type es requerido" })
  @MinLength(1, { message: "type no puede estar vacío" })
  @MaxLength(255, { message: "type admite como máximo 255 caracteres" })
  type!: string;

  @TransformNormalizarBooleano
  @IsOptional()
  @IsBoolean({ message: "isActive debe ser booleano" })
  isActive?: boolean;
}

/** Resultado de sp_buscar_usuario_por_keycloak_id */
export interface FilaUsuarioPorKeycloakId {
  id_users: string;
  type: string;
  isActive: boolean;
}
