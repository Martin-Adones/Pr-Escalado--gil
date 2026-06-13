import { IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformVacioAIndefinido } from 'shared';

export interface FilaLogAuditoria {
  id_audit_logs: string;
  id_contracts: string | null;
  action: string;
  assignet_to: string | null;
  created_at: string;
}

export interface FilaLogAuditoriaListado extends FilaLogAuditoria {
  total_count: string;
}

export class ListarLogsAuditoriaConsultaDto {
  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  id_audit_logs?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  id_contracts?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  action?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  assignet_to?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  created_at_from?: string;

  @TransformVacioAIndefinido
  @IsOptional()
  @IsString()
  created_at_to?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page_size: number = 10;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page_number: number = 1;
}
