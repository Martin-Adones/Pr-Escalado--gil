import { Transform } from 'class-transformer';

export const REGEX_ID_BIGINT = /^[0-9]+$/;
export const MENSAJE_ID_BIGINT = 'debe ser un entero positivo en texto (BIGINT), ej. "1"';

export function vacioAIndefinido({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value).trim();
}

export function normalizarBooleano({ value }: { value: unknown }) {
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

export const TransformVacioAIndefinido = Transform(vacioAIndefinido);
export const TransformNormalizarBooleano = Transform(normalizarBooleano);
