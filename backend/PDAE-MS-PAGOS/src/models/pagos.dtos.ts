import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  Matches,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  REGEX_ID_BIGINT,
  MENSAJE_ID_BIGINT,
  TransformVacioAIndefinido,
} from 'shared';

export class TarjetaSubDto {
  @IsNotEmpty({ message: 'El número de tarjeta es requerido' })
  @IsString()
  numero!: string;

  @IsNotEmpty({ message: 'El mes de vencimiento es requerido' })
  @IsString()
  exp_mes!: string;

  @IsNotEmpty({ message: 'El año de vencimiento es requerido' })
  @IsString()
  exp_ano!: string;

  @IsNotEmpty({ message: 'El código CVC es requerido' })
  @IsString()
  cvc!: string;
}

export class RegistrarTarjetaEntradaDto {
  @TransformVacioAIndefinido
  @IsString()
  @IsNotEmpty({ message: 'El campo id_users es requerido' })
  @Matches(REGEX_ID_BIGINT, { message: `id_users: ${MENSAJE_ID_BIGINT}` })
  id_users!: string;

  @IsNotEmpty({ message: 'El titular de la tarjeta es requerido' })
  @IsString()
  titular!: string;

  @ValidateNested()
  @Type(() => TarjetaSubDto)
  tarjeta!: TarjetaSubDto;
}

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

export class CardWebhookDetailDto {
  @IsString()
  brand!: string;

  @IsString()
  last4!: string;

  @IsNumber()
  expMonth!: number;

  @IsNumber()
  expYear!: number;
}

export class UcnpayWebhookEntradaDto {
  @IsNotEmpty({ message: 'El campo event es requerido' })
  @IsString()
  @IsIn(['transaction.approved', 'transaction.rejected'], {
    message: 'event debe ser transaction.approved o transaction.rejected',
  })
  event!: string;

  @IsNotEmpty({ message: 'El campo transactionId es requerido' })
  @IsString()
  transactionId!: string;

  @IsNotEmpty({ message: 'El campo idOrden es requerido' })
  @IsString()
  idOrden!: string;

  @IsNotEmpty({ message: 'El campo status es requerido' })
  @IsString()
  @IsIn(['APROBADO', 'RECHAZADO'], {
    message: 'status debe ser APROBADO o RECHAZADO',
  })
  status!: string;

  @IsNotEmpty({ message: 'El campo monto es requerido' })
  @IsNumber()
  monto!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  paymentMethodToken?: string;
  
  @IsOptional()
  @IsString()
  mandateId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CardWebhookDetailDto)
  card?: CardWebhookDetailDto;
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

export interface FilaUserCard {
  id_user_cards: string;
  id_users: string;
  payment_method_token: string;
  card_brand: string;
  card_last4: string;
  holder_name: string;
  created_at: string;
}
