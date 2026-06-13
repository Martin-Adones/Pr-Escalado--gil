import { transformAndValidate } from 'shared';
import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsOptional } from 'class-validator';

class ChildDTO {
  @IsNotEmpty({ message: 'Child name required' })
  childName!: string;
}

class CustomTestDTO {
  @IsNotEmpty({ message: 'Nombre es requerido' })
  nombre!: string;

  @IsOptional()
  edad?: number;

  @ValidateNested()
  @Type(() => ChildDTO)
  @IsOptional()
  child?: ChildDTO;
}

describe('Validator Utils', () => {
  it('debe validar correctamente un objeto DTO válido', async () => {
    const validData = { nombre: 'Test', edad: 20 };
    const result = await transformAndValidate(CustomTestDTO, validData);
    expect(result).toBeInstanceOf(CustomTestDTO);
    expect(result.nombre).toBe('Test');
    expect(result.edad).toBe(20);
  });

  it('debe arrojar error si faltan campos obligatorios', async () => {
    const invalidData = { edad: 20 };
    await expect(transformAndValidate(CustomTestDTO, invalidData)).rejects.toThrow('Error de Validación: Nombre es requerido');
  });

  it('debe formatear errores anidados recursivamente en propiedades hijas', async () => {
    const invalidData = { nombre: 'Valid', child: { childName: '' } }; // object present but empty child property fails IsNotEmpty validation
    await expect(transformAndValidate(CustomTestDTO, invalidData)).rejects.toThrow('Child name required');
  });
});
