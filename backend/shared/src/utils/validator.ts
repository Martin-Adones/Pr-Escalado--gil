import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export async function transformAndValidate<T extends object>(
  targetClass: new () => T,
  rawData: any
): Promise<T> {
  const instance = plainToInstance(targetClass, rawData, {
    enableImplicitConversion: true
  });

  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false }
  });

  if (errors.length > 0) {
    const message = formatErrors(errors);
    throw new Error(`Error de Validación: ${message}`);
  }

  return instance;
}

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
