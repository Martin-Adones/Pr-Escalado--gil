/**
 * DTOs del dominio Productos (tabla `Products`: id_products, name, description, type, quantity, price, isActive).
 * Los procedimientos en PostgreSQL estan en `database/productos/productos_funciones.sql`.
 */
import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const REGEX_ID_BIGINT = /^[0-9]+$/;
const MENSAJE_ID_BIGINT = 'debe ser un entero positivo en texto (BIGINT), ej. "1"';

function vacioAIndefinido({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value).trim();
}

function normalizarBooleano({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const raw = String(value).trim().toLowerCase();
  if (raw === 'true' || raw === '1') {
    return true;
  }
  if (raw === 'false' || raw === '0') {
    return false;
  }
  return value;
}

/** Cuerpo POST -> `sp_crear_producto` */
export class CrearProductoEntradaDto {
  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo name es requerido' })
  @MinLength(1, { message: 'name no puede estar vacio' })
  @MaxLength(255, { message: 'name admite como maximo 255 caracteres' })
  name!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo type es requerido' })
  @MinLength(1, { message: 'type no puede estar vacio' })
  @MaxLength(255, { message: 'type admite como maximo 255 caracteres' })
  type!: string;

  @IsOptional()
  @IsInt({ message: 'quantity debe ser entero' })
  @Type(() => Number)
  @Min(0, { message: 'quantity debe ser mayor o igual que 0' })
  quantity?: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price debe ser numerico con hasta 2 decimales' })
  @Type(() => Number)
  @Min(0.01, { message: 'price debe ser mayor que 0' })
  price!: number;

  @Transform(normalizarBooleano)
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser booleano' })
  isActive?: boolean;
}

export interface FilaProducto {
  id_products: string;
  name: string;
  description: string | null;
  type: string;
  quantity: number | null;
  price: string;
  isActive: boolean;
}

/** Query GET -> `sp_listar_productos` */
export class ListarProductosConsultaDto {
  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_products: ${MENSAJE_ID_BIGINT}` })
  id_products!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'name: filtro demasiado largo' })
  name!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'type: filtro demasiado largo' })
  type!: string;

  @Transform(normalizarBooleano)
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

export interface FilaProductoListado extends FilaProducto {
  total_count: string;
}

/** Cuerpo POST -> `sp_actualizar_producto` */
export class ActualizarProductoEntradaDto {
  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo id_products es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_products: ${MENSAJE_ID_BIGINT}` })
  id_products!: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'name no puede estar vacio' })
  @MaxLength(255, { message: 'name admite como maximo 255 caracteres' })
  name?: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'type no puede estar vacio' })
  @MaxLength(255, { message: 'type admite como maximo 255 caracteres' })
  type?: string;

  @IsOptional()
  @IsInt({ message: 'quantity debe ser entero' })
  @Type(() => Number)
  @Min(0, { message: 'quantity debe ser mayor o igual que 0' })
  quantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price debe ser numerico con hasta 2 decimales' })
  @Type(() => Number)
  @Min(0.01, { message: 'price debe ser mayor que 0' })
  price?: number;
}

/** Cuerpo POST -> `sp_desactivar_producto` */
export class DesactivarProductoEntradaDto {
  @Transform(vacioAIndefinido)
  @IsString()
  @IsNotEmpty({ message: 'El campo id_products es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_products: ${MENSAJE_ID_BIGINT}` })
  id_products!: string;
}
