/**
 * DTOs del dominio Soporte (tabla `Support`: id_support, id_contracts, description, status, created_at, updated_at).
 * Los procedimientos en PostgreSQL están en `database/soporte/soporte_funciones.sql`.
 */
import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  REGEX_ID_BIGINT,
  MENSAJE_ID_BIGINT,
  TransformVacioAIndefinido,
} from 'shared';

const SOPORTE_ESTADOS = ['open', 'in_progress', 'resolved', 'closed'] as const;

/** Cuerpo POST -> `sp_crear_ticket` */
export class CrearTicketEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_contracts es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_contracts: ${MENSAJE_ID_BIGINT}` })
  id_contracts!: string;

  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo description es requerido' })
  @MinLength(1, { message: 'description no puede estar vacía' })
  description!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @IsIn(SOPORTE_ESTADOS, { message: 'status debe ser uno de: open, in_progress, resolved, closed' })
  status?: string;
}

export interface FilaTicket {
  id_support: string;
  id_contracts: string;
  id_users: string;
  description: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

/** Query GET -> `sp_listar_tickets` */
export class ListarTicketsConsultaDto {
  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_support: ${MENSAJE_ID_BIGINT}` })
  id_support?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_contracts: ${MENSAJE_ID_BIGINT}` })
  id_contracts?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsUUID(4, { message: 'id_users debe ser un UUID v4 válido' })
  id_users?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @IsIn(SOPORTE_ESTADOS, { message: 'status debe ser uno de: open, in_progress, resolved, closed' })
  status?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page_size: number = 10;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page_number: number = 1;
}

export interface FilaTicketListado extends FilaTicket {
  total_count: string;
}

/** Cuerpo POST -> `sp_actualizar_ticket` */
export class ActualizarTicketEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_support es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_support: ${MENSAJE_ID_BIGINT}` })
  id_support!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_contracts: ${MENSAJE_ID_BIGINT}` })
  id_contracts?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'description no puede estar vacía si se proporciona' })
  description?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @IsIn(SOPORTE_ESTADOS, { message: 'status debe ser uno de: open, in_progress, resolved, closed' })
  status?: string;
}
