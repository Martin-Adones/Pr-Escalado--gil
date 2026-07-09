import { transformAndValidate } from 'shared';
import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsOptional } from 'class-validator';

class MetadatosTestDto {
  @IsNotEmpty({ message: 'El valor de metadatos es requerido' })
  valor!: string;
}

class AuditoriaTestDto {
  @IsNotEmpty({ message: 'La acción a registrar es requerida' })
  accion!: string;

  @IsOptional()
  ipUsuario?: string;

  @ValidateNested()
  @Type(() => MetadatosTestDto)
  @IsOptional()
  metadatos?: MetadatosTestDto;
}

describe('Validaciones de DTO para Auditoría', () => {
  it('debe validar un registro de auditoría con datos correctos', async () => {
    const datos = { accion: 'crear_contrato', ipUsuario: '192.168.1.1' };
    const resultado = await transformAndValidate(AuditoriaTestDto, datos);
    expect(resultado).toBeInstanceOf(AuditoriaTestDto);
    expect(resultado.accion).toBe('crear_contrato');
    expect(resultado.ipUsuario).toBe('192.168.1.1');
  });

  it('debe fallar si la acción a registrar está vacía', async () => {
    const datos = { ipUsuario: '192.168.1.1' };
    await expect(transformAndValidate(AuditoriaTestDto, datos)).rejects.toThrow('La acción a registrar es requerida');
  });

  it('debe fallar recursivamente si los metadatos son inválidos', async () => {
    const datos = { accion: 'crear_contrato', metadatos: { valor: '' } };
    await expect(transformAndValidate(AuditoriaTestDto, datos)).rejects.toThrow('El valor de metadatos es requerido');
  });
});
