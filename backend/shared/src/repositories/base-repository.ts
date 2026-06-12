import { db as defaultDb } from '../database/pg-client';

export abstract class BaseRepository {
  protected getDb() { return defaultDb; }

  protected async callProcedure<T>(
    procedure: string,
    params: any[] = [],
    _options?: {
      pagination?: { limit: number, offset: number },
      sorting?: { sortBy: string, direction: 'ASC' | 'DESC' }
    }
  ): Promise<T[]> {
    const db = this.getDb();
    const isMock = process.env.NODE_ENV === 'mock';

    if (isMock) {
      return this.getMockData<T>(procedure);
    }

    const client = await db.getClient();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');

      const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
      const query = `SELECT * FROM ${procedure}(${placeholders})`;

      const result = await client.query(query, params);
      let finalRows = result.rows;

      if (result.rows.length > 0) {
        const firstRow = result.rows[0] as any;
        const potentialCursor = Object.values(firstRow)[0];

        if (typeof potentialCursor === 'string' &&
           (potentialCursor.startsWith('<unnamed') || potentialCursor.includes('cursor'))) {
          const fetchResult = await client.query(`FETCH ALL IN "${potentialCursor}"`);
          finalRows = fetchResult.rows;
        }
      }

      await client.query('COMMIT');

      const duration = Date.now() - startTime;
      if (process.env.LOG_DB !== '0') {
        console.log(`[DB] ${procedure} ${duration}ms`);
      }

      return this.mapResponse(finalRows) as T[];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private mapResponse(rows: any[]): any[] {
    return rows.map(row => {
      const newRow: any = {};
      for (const key in row) {
        const cleanKey = key.replace(/^(pi_|po_|p_|i_)/i, '');
        newRow[cleanKey] = row[key];
      }
      return newRow;
    });
  }

  private getMockData<T>(procedure: string): T[] {
    return [
      { id: 1, info: `Mock data para ${procedure}`, simulated: true } as unknown as T
    ];
  }
}
