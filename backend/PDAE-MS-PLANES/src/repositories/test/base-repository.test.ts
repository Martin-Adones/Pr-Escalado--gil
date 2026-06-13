import { BaseRepository } from '../base-repository';
import { db } from '../../database/pg-client';

class TestRepository extends BaseRepository {
  public async call(proc: string, params: any[] = []) {
    return this.callProcedure<any>(proc, params);
  }
}

jest.mock('../../database/pg-client');

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    (db.getClient as jest.Mock).mockResolvedValue(mockClient);
    repository = new TestRepository();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('debe manejar transacciones correctamente (BEGIN -> CALL -> COMMIT)', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // SP CALL
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

    await repository.call('mi_sp', ['p1']);

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('debe pasar los parámetros al SP exactamente como se proporcionan', async () => {
    mockClient.query.mockResolvedValue({ rows: [] });
    
    await repository.call('sp_parametros', ['search', 10, 0, 'nombre', 'ASC']);

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('sp_parametros($1, $2, $3, $4, $5)'),
      ['search', 10, 0, 'nombre', 'ASC']
    );
  });

  it('debe manejar cursores correctamente (FETCH ALL)', async () => {
    const cursorName = '<unnamed cursor 1>';
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ cursor: cursorName }] }) // SP CALL returns cursor name
      .mockResolvedValueOnce({ rows: [{ id: 1, po_nombre: 'Test' }] }) // FETCH ALL
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const result = await repository.call('sp_cursor');

    expect(mockClient.query).toHaveBeenCalledWith(`FETCH ALL IN "${cursorName}"`);
    expect(result[0]).toHaveProperty('nombre', 'Test');
  });

  it('debe manejar cursores personalizados correctamente usando fallback includes cursor', async () => {
    const cursorName = 'mi_cursor_personalizado';
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ cursor: cursorName }] }) // SP CALL returns cursor name
      .mockResolvedValueOnce({ rows: [{ id: 2, po_nombre: 'Test2' }] }) // FETCH ALL
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const result = await repository.call('sp_cursor_custom');

    expect(mockClient.query).toHaveBeenCalledWith(`FETCH ALL IN "${cursorName}"`);
    expect(result[0]).toHaveProperty('nombre', 'Test2');
  });

  it('debe entrar en modo MOCK si NODE_ENV es mock', async () => {
    process.env.NODE_ENV = 'mock';
    const result = await repository.call('sp_test');
    
    expect(result[0]).toHaveProperty('simulated', true);
    expect(db.getClient).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = 'test'; // Restore
  });

  it('debe hacer ROLLBACK si ocurre un error', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockRejectedValueOnce(new Error('DB Error')); // SP CALL fails
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    await expect(repository.call('sp_error')).rejects.toThrow('DB Error');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
