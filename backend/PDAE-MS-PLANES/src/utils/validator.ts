import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

/**
 * Utilidad para validar DTOs (Clases con decoradores)
 * Transforma datos planos a instancias de clase y aplica validaciones.
 */
export async function transformAndValidate<T extends object>(
  targetClass: new () => T,
  rawData: any
): Promise<T> {
  // 1. Transformar objeto plano a instancia de clase (para que funcionen los decoradores)
  const instance = plainToInstance(targetClass, rawData, {
    enableImplicitConversion: true // Permite transformar strings a numbers automáticamente en DTOs
  });

  // 2. Ejecutar validaciones de class-validator
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false }
  });

  if (errors.length > 0) {
    const message = formatErrors(errors);
    throw new Error(`Error de Validacion: ${message}`);
  }

  return instance;
}

/**
 * Formatea los errores de ValidationError a un string legible
 */
function formatErrors(errors: ValidationError[]): string {
  return errors
    .map((err) => {
      if (err.children && err.children.length > 0) {
        return formatErrors(err.children);
      }
      return Object.values(err.constraints || {}).join(', ');
    })
    .join('; ');
}
