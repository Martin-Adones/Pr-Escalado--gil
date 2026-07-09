import { transformAndValidate } from 'shared';
import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

class FirmanteTestDto {
  @IsNotEmpty({ message: 'El nombre del firmante es requerido' })
  nombreFirmante!: string;
}

class ContratoTestDto {
  @IsNotEmpty({ message: 'El título del contrato es requerido' })
  titulo!: string;

  @IsInt({ message: 'Los días de vigencia deben ser un número entero' })
  diasVigencia!: number;

  @ValidateNested()
  @Type(() => FirmanteTestDto)
  @IsOptional()
  firmante?: FirmanteTestDto;
}

describe('Validaciones de DTO para Contratos', () => {
  it('debe validar un contrato con datos correctos', async () => {
    const datos = { titulo: 'Contrato de Servicios TI', diasVigencia: 365 };
    const resultado = await transformAndValidate(ContratoTestDto, datos);
    expect(resultado).toBeInstanceOf(ContratoTestDto);
    expect(resultado.titulo).toBe('Contrato de Servicios TI');
    expect(resultado.diasVigencia).toBe(365);
  });

  it('debe fallar si los días de vigencia no son entero', async () => {
    const datos = { titulo: 'Contrato A', diasVigencia: 'un año' };
    await expect(transformAndValidate(ContratoTestDto, datos)).rejects.toThrow('Los días de vigencia deben ser un número entero');
  });

  it('debe fallar recursivamente si los datos del firmante son inválidos', async () => {
    const datos = { titulo: 'Contrato A', diasVigencia: 30, firmante: { nombreFirmante: '' } };
    await expect(transformAndValidate(ContratoTestDto, datos)).rejects.toThrow('El nombre del firmante es requerido');
  });
});
