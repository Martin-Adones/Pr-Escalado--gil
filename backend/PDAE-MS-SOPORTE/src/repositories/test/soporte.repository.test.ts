import { SoporteRepository } from '../soporte.repository';
import { BaseRepository } from '../base-repository';

describe('SoporteRepository', () => {
  let repositorio: SoporteRepository;

  beforeEach(() => {
    repositorio = new SoporteRepository();
    jest.restoreAllMocks();
  });

  it('ejecutarCrearTicket llama a sp_crear_ticket con los parametros en orden', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    const dto = { id_contracts: '2', description: 'Problema', status: 'open' } as any;
    await repositorio.ejecutarCrearTicket(dto);
    expect(espia).toHaveBeenCalledWith('sp_crear_ticket', ['2', 'Problema', 'open'], undefined);
  });

  it('ejecutarListarTickets llama a sp_listar_tickets con los parametros en orden', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    const dto = { id_support: '1', id_contracts: '2', id_users: '3', status: 'open', page_size: 10, page_number: 1 } as any;
    await repositorio.ejecutarListarTickets(dto);
    expect(espia).toHaveBeenCalledWith('sp_listar_tickets', ['1', '2', '3', 'open', 10, 1], undefined);
  });

  it('ejecutarActualizarTicket llama a sp_actualizar_ticket con los parametros en orden', async () => {
    const espia = jest.spyOn(BaseRepository.prototype as any, 'callProcedure').mockResolvedValue([{ id: 1 }]);
    const dto = { id_support: '1', id_contracts: '2', description: 'Modificado', status: 'resolved' } as any;
    await repositorio.ejecutarActualizarTicket(dto);
    expect(espia).toHaveBeenCalledWith('sp_actualizar_ticket', ['1', '2', 'Modificado', 'resolved'], undefined);
  });
});
