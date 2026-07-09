import { transformAndValidate } from 'shared';
import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

class UsuarioDetallesTestDto {
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  telefono!: string;
}

class UsuarioTestDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre!: string;

  @IsEmail({}, { message: 'El correo debe ser válido' })
  correo!: string;

  @ValidateNested()
  @Type(() => UsuarioDetallesTestDto)
  @IsOptional()
  detalles?: UsuarioDetallesTestDto;
}

describe('Validaciones de DTO para Usuarios', () => {
  it('debe validar un usuario con datos correctos', async () => {
    const datos = { nombre: 'Juan', correo: 'juan@example.com' };
    const resultado = await transformAndValidate(UsuarioTestDto, datos);
    expect(resultado).toBeInstanceOf(UsuarioTestDto);
    expect(resultado.nombre).toBe('Juan');
    expect(resultado.correo).toBe('juan@example.com');
  });

  it('debe fallar si el correo no tiene formato válido', async () => {
    const datos = { nombre: 'Juan', correo: 'correo-invalido' };
    await expect(transformAndValidate(UsuarioTestDto, datos)).rejects.toThrow('El correo debe ser válido');
  });

  it('debe fallar recursivamente si los detalles del usuario son inválidos', async () => {
    const datos = { nombre: 'Juan', correo: 'juan@example.com', detalles: { telefono: '' } };
    await expect(transformAndValidate(UsuarioTestDto, datos)).rejects.toThrow('El teléfono es requerido');
  });
});
