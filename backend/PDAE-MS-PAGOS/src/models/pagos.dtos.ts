import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  Matches,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  REGEX_ID_BIGINT,
  MENSAJE_ID_BIGINT,
  TransformVacioAIndefinido,
} from 'shared';

export class CrearPagoEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_users es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_users: ${MENSAJE_ID_BIGINT}` })
  id_users!: string;

  @IsNotEmpty({ message: 'El campo amount es requerido' })
  @IsNumber({}, { message: 'El campo amount debe ser un número' })
  @Min(1, { message: 'El monto mínimo de pago es 1' })
  amount!: number;

  @IsNotEmpty({ message: 'El campo concept es requerido' })
  @IsString()
  concept!: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_billing_cycles: ${MENSAJE_ID_BIGINT}` })
  id_billing_cycles?: string;
}

export class WebhookProveedorEntradaDto {
  @IsNotEmpty({ message: 'El campo external_tx_id es requerido' })
  @IsString()
  external_tx_id!: string;

  @IsNotEmpty({ message: 'El campo status es requerido' })
  @IsString()
  @IsIn(['APROBADO', 'RECHAZADO', 'completed', 'failed'], {
    message: 'status debe ser APROBADO o RECHAZADO',
  })
  status!: string;

  @IsNotEmpty({ message: 'El campo id_payments es requerido' })
  @IsString()
  @Matches(REGEX_ID_BIGINT, { message: `id_payments: ${MENSAJE_ID_BIGINT}` })
  id_payments!: string;
}

export interface FilaPago {
  id_payments: string;
  id_users: string;
  id_billing_cycles: string | null;
  amount: string;
  concept: string;
  status: string;
  external_tx_id: string | null;
  created_at: string;
  updated_at: string;
}
