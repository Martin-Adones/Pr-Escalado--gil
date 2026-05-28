/**
 * DTOs del dominio Usuarios (tabla `Users`: id_users, type).
 * Los procedimientos en PostgreSQL están en `database/usuarios/usuarios_funciones.sql`.
 */
import { IsString, IsOptional, IsInt, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const REGEX_ID_BIGINT = /^[0-9]+$/;
const MENSAJE_ID_BIGINT = 'debe ser un entero positivo en texto (BIGINT), ej. "1"';

function vacioAIndefinido({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value).trim();
}

/** Cuerpo POST → `sp_crear_usuario` */
export class CrearUsuarioEntradaDto {
  @IsString()
  @IsNotEmpty({ message: 'El campo type es requerido' })
  @MinLength(1, { message: 'type no puede estar vacío' })
  @MaxLength(255, { message: 'type admite como máximo 255 caracteres' })
  type!: string;
}

export interface FilaUsuario {
  id_users: string;
  type: string;
}

/** Query GET → `sp_listar_usuarios` */
export class ListarUsuariosConsultaDto {
  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_users: ${MENSAJE_ID_BIGINT}` })
  id_users!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'type: filtro demasiado largo' })
  type!: string;

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

/** Cuerpo POST → `sp_actualizar_usuario` */
export class ActualizarUsuarioEntradaDto {
  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo id_users es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_users: ${MENSAJE_ID_BIGINT}` })
  id_users!: string;

  @IsString()
  @IsNotEmpty({ message: 'El campo type es requerido' })
  @MinLength(1, { message: 'type no puede estar vacío' })
  @MaxLength(255, { message: 'type admite como máximo 255 caracteres' })
  type!: string;
}
