import { transformAndValidate } from 'shared';
import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsOptional } from 'class-validator';

class ClienteTicketTestDto {
  @IsNotEmpty({ message: 'El identificador del cliente es requerido' })
  idCliente!: string;
}

class TicketTestDto {
  @IsNotEmpty({ message: 'El asunto del ticket es requerido' })
  asunto!: string;

  @IsOptional()
  prioridad?: string;

  @ValidateNested()
  @Type(() => ClienteTicketTestDto)
  @IsOptional()
  cliente?: ClienteTicketTestDto;
}

describe('Validaciones de DTO para Soporte', () => {
  it('debe validar un ticket con datos correctos', async () => {
    const datos = { asunto: 'Error de cobro en factura', prioridad: 'alta' };
    const resultado = await transformAndValidate(TicketTestDto, datos);
    expect(resultado).toBeInstanceOf(TicketTestDto);
    expect(resultado.asunto).toBe('Error de cobro en factura');
    expect(resultado.prioridad).toBe('alta');
  });

  it('debe fallar si el asunto está vacío', async () => {
    const datos = { prioridad: 'media' };
    await expect(transformAndValidate(TicketTestDto, datos)).rejects.toThrow('El asunto del ticket es requerido');
  });

  it('debe fallar recursivamente si los datos del cliente son inválidos', async () => {
    const datos = { asunto: 'Fallo de acceso', cliente: { idCliente: '' } };
    await expect(transformAndValidate(TicketTestDto, datos)).rejects.toThrow('El identificador del cliente es requerido');
  });
});
