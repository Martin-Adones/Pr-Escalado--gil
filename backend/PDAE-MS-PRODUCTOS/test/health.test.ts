process.env.NODE_ENV = 'test';

import { createServer } from '../src/app';
import supertest from 'supertest';

// Mock global de la DB
jest.mock('../src/database/pg-client');

describe('Health Check API', () => {
  let app: any;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 and UP status', async () => {
    const response = await supertest(app.server)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('service', 'PDAE-MS-PRODUCTOS-1');
  });
});
