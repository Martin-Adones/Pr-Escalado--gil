import { createServer } from '../src/app';

describe('App Server Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('debe crear una instancia de Fastify correctamente en entorno de TEST', async () => {
    process.env.NODE_ENV = 'test';
    const app = await createServer();
    expect(app).toBeDefined();
    await app.close();
  });

  it('debe configurar el logger correctamente en entorno de DESARROLLO', async () => {
    process.env.NODE_ENV = 'development';
    const app = await createServer();
    expect(app).toBeDefined();
    // Verificamos que no lance error al configurar pino-pretty
    await app.close();
  });

  it('debe configurar el logger correctamente en entorno de PRODUCCION', async () => {
    process.env.NODE_ENV = 'production';
    const app = await createServer();
    expect(app).toBeDefined();
    await app.close();
  });
});
