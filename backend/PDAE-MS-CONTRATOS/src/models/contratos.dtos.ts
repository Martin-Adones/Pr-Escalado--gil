/**
 * Objetos de transferencia (DTO) para el dominio Contratos.
 * Cada clase corresponde al cuerpo o query que espera un procedimiento en español en PostgreSQL.
 */
import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  IsIn,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CONTRATO_ESTADOS, CONTRATO_ESTADOS_INICIAL } from '../domain/estados-contrato';

const estadosLista = [...CONTRATO_ESTADOS] as [string, ...string[]];
const estadosInicialLista = [...CONTRATO_ESTADOS_INICIAL] as [string, ...string[]];

/** Patrón BIGINT positivo enviado como texto en JSON (ej. "1"). */
const REGEX_ID_BIGINT = /^[0-9]+$/;
const MENSAJE_ID_BIGINT = 'debe ser un entero positivo en texto (BIGINT), ej. "1"';

function vacioAIndefinido({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value).trim();
}

function normalizarEstadoOpcional({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value).trim().toUpperCase();
}

function normalizarEstadoRequerido({ value }: { value: unknown }) {
  if (value === undefined || value === null) {
    return value;
  }
  return String(value).trim().toUpperCase();
}

/** Entrada HTTP → procedimiento `sp_crear_contrato` */
export class CrearContratoEntradaDto {
  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo id_users es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_users: ${MENSAJE_ID_BIGINT}` })
  id_users!: string;

  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo id_plans es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_plans: ${MENSAJE_ID_BIGINT}` })
  id_plans!: string;

  @Transform(normalizarEstadoRequerido)
  @IsString()
  @IsNotEmpty({ message: 'El campo status es requerido' })
  @IsIn(estadosInicialLista, {
    message: `status debe ser uno de: ${CONTRATO_ESTADOS_INICIAL.join(', ')}`,
  })
  status!: string;

  @IsString()
  @IsOptional()
  start_date!: string;

  @IsString()
  @IsOptional()
  end_date!: string;
}

/** Una fila devuelta por crear / actualizar / finalizar (mismas columnas que la tabla lógica). */
export interface FilaContrato {
  id_contracts: string;
  id_users: string;
  id_plans: string;
  status: string;
  start_date: string;
  end_date: string;
  updated_at: string;
}

/** Entrada HTTP → `sp_finalizar_contrato` */
export class FinalizarContratoEntradaDto {
  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo id_contracts es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_contracts: ${MENSAJE_ID_BIGINT}` })
  id_contracts!: string;
}

/** Query GET → `sp_listar_contratos` */
export class ListarContratosConsultaDto {
  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_contracts: ${MENSAJE_ID_BIGINT}` })
  id_contracts!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_users: ${MENSAJE_ID_BIGINT}` })
  id_users!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_plans: ${MENSAJE_ID_BIGINT}` })
  id_plans!: string;

  @IsOptional()
  @Transform(normalizarEstadoOpcional)
  @IsIn(estadosLista, {
    message: `status debe ser uno de: ${CONTRATO_ESTADOS.join(', ')}`,
  })
  status!: string;

  @IsString()
  @IsOptional()
  start_date_from!: string;

  @IsString()
  @IsOptional()
  start_date_to!: string;

  @IsString()
  @IsOptional()
  end_date_from!: string;

  @IsString()
  @IsOptional()
  end_date_to!: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page_size: number = 10;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page_number: number = 1;
}

export interface FilaContratoListado extends FilaContrato {
  total_count: string;
}

/** Entrada HTTP → `sp_actualizar_contrato` */
export class ActualizarContratoEntradaDto {
  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo id_contracts es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_contracts: ${MENSAJE_ID_BIGINT}` })
  id_contracts!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_users: ${MENSAJE_ID_BIGINT}` })
  id_users!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_plans: ${MENSAJE_ID_BIGINT}` })
  id_plans!: string;

  @IsOptional()
  @Transform(normalizarEstadoOpcional)
  @IsIn(estadosLista, {
    message: `status debe ser uno de: ${CONTRATO_ESTADOS.join(', ')}`,
  })
  status!: string;

  @IsString()
  @IsOptional()
  start_date!: string;

  @IsString()
  @IsOptional()
  end_date!: string;
}

/** Entrada para Webhook de Pagos */
export class WebhookPagosEntradaDto {
  @IsNotEmpty({ message: 'El campo event es requerido' })
  @IsString()
  @IsIn(['pago.completado', 'pago.fallido'], {
    message: 'event debe ser pago.completado o pago.fallido',
  })
  event!: string;

  @IsNotEmpty({ message: 'El campo id_contracts es requerido' })
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_contracts: ${MENSAJE_ID_BIGINT}` })
  id_contracts!: string;

  @IsNotEmpty({ message: 'El campo amount es requerido' })
  amount!: number;
}
