import { registerSwagger } from '../swagger';
import fastify, { FastifyInstance } from 'fastify';

/** @fastify/swagger-ui puede tardar >5s en CI o equipos lentos */
jest.setTimeout(30000);

describe('Swagger Setup', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    try {
      await app.close();
    } catch {
      // evitar fallo si ya se cerró
    }
  });

  it('debe registrar el plugin de swagger correctamente', async () => {
    await registerSwagger(app);
    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/api-doc',
    });

    expect([302, 301, 200].includes(res.statusCode)).toBe(true);
  });
});
