import { IsString, IsOptional, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';

function vacioAIndefinido({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value).trim();
}

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
  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  id_audit_logs?: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  id_contracts?: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  action?: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  assignet_to?: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  created_at_from?: string;

  @Transform(vacioAIndefinido)
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
