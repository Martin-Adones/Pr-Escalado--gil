import { transformAndValidate } from 'shared';
import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

class CategoriaTestDto {
  @IsNotEmpty({ message: 'La descripción de la categoría es requerida' })
  descripcion!: string;
}

class ProductoTestDto {
  @IsNotEmpty({ message: 'El nombre del producto es requerido' })
  nombreProducto!: string;

  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  precio!: number;

  @ValidateNested()
  @Type(() => CategoriaTestDto)
  @IsOptional()
  categoria?: CategoriaTestDto;
}

describe('Validaciones de DTO para Productos', () => {
  it('debe validar un producto con datos correctos', async () => {
    const datos = { nombreProducto: 'Licencia SaaS', precio: 15000 };
    const resultado = await transformAndValidate(ProductoTestDto, datos);
    expect(resultado).toBeInstanceOf(ProductoTestDto);
    expect(resultado.nombreProducto).toBe('Licencia SaaS');
    expect(resultado.precio).toBe(15000);
  });

  it('debe fallar si el precio no es un número', async () => {
    const datos = { nombreProducto: 'Licencia SaaS', precio: 'gratis' };
    await expect(transformAndValidate(ProductoTestDto, datos)).rejects.toThrow('El precio debe ser un número válido');
  });

  it('debe fallar recursivamente si los datos de categoría son inválidos', async () => {
    const datos = { nombreProducto: 'Licencia SaaS', precio: 15000, categoria: { descripcion: '' } };
    await expect(transformAndValidate(ProductoTestDto, datos)).rejects.toThrow('La descripción de la categoría es requerida');
  });
});
