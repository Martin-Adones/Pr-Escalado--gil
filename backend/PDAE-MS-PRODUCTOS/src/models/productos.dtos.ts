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
import { Type } from 'class-transformer';
import {
  REGEX_ID_BIGINT,
  MENSAJE_ID_BIGINT,
  TransformVacioAIndefinido,
  TransformNormalizarBooleano,
} from 'shared';

/** Cuerpo POST -> `sp_crear_producto` */
export class CrearProductoEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo name es requerido' })
  @MinLength(1, { message: 'name no puede estar vacio' })
  @MaxLength(255, { message: 'name admite como maximo 255 caracteres' })
  name!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  description?: string;

  @TransformVacioAIndefinido
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

  @TransformNormalizarBooleano
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
  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_products: ${MENSAJE_ID_BIGINT}` })
  id_products!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'name: filtro demasiado largo' })
  name!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'type: filtro demasiado largo' })
  type!: string;

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

export interface FilaProductoListado extends FilaProducto {
  total_count: string;
}

/** Cuerpo POST -> `sp_actualizar_producto` */
export class ActualizarProductoEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_products es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_products: ${MENSAJE_ID_BIGINT}` })
  id_products!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'name no puede estar vacio' })
  @MaxLength(255, { message: 'name admite como maximo 255 caracteres' })
  name?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  description?: string;

  @TransformVacioAIndefinido
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
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_products es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_products: ${MENSAJE_ID_BIGINT}` })
  id_products!: string;
}
