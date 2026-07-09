import { transformAndValidate } from 'shared';
import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

class CicloTestDto {
  @IsNotEmpty({ message: 'El tipo de ciclo es requerido' })
  tipoCiclo!: string;
}

class PlanTestDto {
  @IsNotEmpty({ message: 'El nombre del plan es requerido' })
  nombrePlan!: string;

  @IsPositive({ message: 'El costo del plan debe ser un número positivo' })
  costo!: number;

  @ValidateNested()
  @Type(() => CicloTestDto)
  @IsOptional()
  ciclo?: CicloTestDto;
}

describe('Validaciones de DTO para Planes', () => {
  it('debe validar un plan con datos correctos', async () => {
    const datos = { nombrePlan: 'Plan Profesional', costo: 29990 };
    const resultado = await transformAndValidate(PlanTestDto, datos);
    expect(resultado).toBeInstanceOf(PlanTestDto);
    expect(resultado.nombrePlan).toBe('Plan Profesional');
    expect(resultado.costo).toBe(29990);
  });

  it('debe fallar si el costo del plan es negativo', async () => {
    const datos = { nombrePlan: 'Plan Básico', costo: -500 };
    await expect(transformAndValidate(PlanTestDto, datos)).rejects.toThrow('El costo del plan debe ser un número positivo');
  });

  it('debe fallar recursivamente si los datos del ciclo de facturación son inválidos', async () => {
    const datos = { nombrePlan: 'Plan Profesional', costo: 29990, ciclo: { tipoCiclo: '' } };
    await expect(transformAndValidate(PlanTestDto, datos)).rejects.toThrow('El tipo de ciclo es requerido');
  });
});
