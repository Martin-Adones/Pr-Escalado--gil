/**
 * DTOs del dominio Planes (tabla `Plans`: id_plans, name, billing_cycle, amount, isActive).
 * Los procedimientos en PostgreSQL estan en `database/planes/planes_funciones.sql`.
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
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  REGEX_ID_BIGINT,
  MENSAJE_ID_BIGINT,
  TransformVacioAIndefinido,
  TransformNormalizarBooleano,
} from 'shared';

const CICLOS_FACTURACION = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'bimonthly',
  'quarterly',
  'semiannual',
  'yearly',
] as const;

function normalizarCicloOpcional({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value).trim().toLowerCase();
}

function normalizarCicloRequerido({ value }: { value: unknown }) {
  if (value === undefined || value === null) {
    return value;
  }
  return String(value).trim().toLowerCase();
}

function normalizarArrayIds({ value }: { value: unknown }) {
  if (value === undefined || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim());
  }
  return value;
}

/** Cuerpo POST -> `sp_crear_plan` */
export class CrearPlanEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo name es requerido' })
  @MinLength(1, { message: 'name no puede estar vacio' })
  @MaxLength(255, { message: 'name admite como maximo 255 caracteres' })
  name!: string;

  @Transform(normalizarCicloRequerido)
  @IsString()
  @IsNotEmpty({ message: 'El campo billing_cycle es requerido' })
  @IsIn(CICLOS_FACTURACION, {
    message: `billing_cycle debe ser uno de: ${CICLOS_FACTURACION.join(', ')}`,
  })
  billing_cycle!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount debe ser numerico con hasta 2 decimales' })
  @Type(() => Number)
  @Min(0.01, { message: 'amount debe ser mayor que 0' })
  amount!: number;

  @TransformNormalizarBooleano
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser booleano' })
  isActive?: boolean;
}

export interface FilaPlan {
  id_plans: string;
  name: string;
  billing_cycle: string;
  amount: string;
  isActive: boolean;
}

/** Query GET -> `sp_listar_planes` */
export class ListarPlanesConsultaDto {
  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_plans: ${MENSAJE_ID_BIGINT}` })
  id_plans!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'name: filtro demasiado largo' })
  name!: string;

  @Transform(normalizarCicloOpcional)
  @IsOptional()
  @IsIn(CICLOS_FACTURACION, {
    message: `billing_cycle debe ser uno de: ${CICLOS_FACTURACION.join(', ')}`,
  })
  billing_cycle!: string;

  @TransformNormalizarBooleano
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser booleano' })
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

export interface FilaPlanListado extends FilaPlan {
  total_count: string;
}

/** Cuerpo POST -> `sp_actualizar_plan` */
export class ActualizarPlanEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_plans es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_plans: ${MENSAJE_ID_BIGINT}` })
  id_plans!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'name no puede estar vacio' })
  @MaxLength(255, { message: 'name admite como maximo 255 caracteres' })
  name!: string;

  @Transform(normalizarCicloOpcional)
  @IsOptional()
  @IsIn(CICLOS_FACTURACION, {
    message: `billing_cycle debe ser uno de: ${CICLOS_FACTURACION.join(', ')}`,
  })
  billing_cycle!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount debe ser numerico con hasta 2 decimales' })
  @Type(() => Number)
  @Min(0.01, { message: 'amount debe ser mayor que 0' })
  amount?: number;
}

/** Cuerpo POST -> `sp_desactivar_plan` */
export class DesactivarPlanEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_plans es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_plans: ${MENSAJE_ID_BIGINT}` })
  id_plans!: string;
}

export interface FilaPlanProducto {
  id_plans: string;
  id_products: string;
}

/** Cuerpo POST -> `sp_registrar_productos_plan` */
export class RegistrarProductosPlanEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_plans es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_plans: ${MENSAJE_ID_BIGINT}` })
  id_plans!: string;

  @Transform(normalizarArrayIds)
  @IsArray({ message: 'id_products debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'id_products no puede estar vacio' })
  @ArrayMinSize(1, { message: 'id_products debe incluir al menos un elemento' })
  @IsString({ each: true })
  @Matches(REGEX_ID_BIGINT, { each: true, message: `id_products: ${MENSAJE_ID_BIGINT}` })
  id_products!: string[];
}
