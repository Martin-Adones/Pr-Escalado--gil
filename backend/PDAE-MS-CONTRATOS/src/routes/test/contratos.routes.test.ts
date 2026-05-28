import fastify from 'fastify';
import rutasContratos from '../contratos.routes';

jest.mock('../../controllers/contratos.controller');

describe('Rutas contratos', () => {
  const app = fastify();

  beforeAll(async () => {
    app.register(rutasContratos, { prefix: '/api' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra POST /api/contratos/crear', () => {
    expect(app.findRoute({ method: 'POST', url: '/api/contratos/crear' })).toBeDefined();
  });

  it('registra POST /api/contratos/finalizar', () => {
    expect(app.findRoute({ method: 'POST', url: '/api/contratos/finalizar' })).toBeDefined();
  });

  it('registra GET /api/contratos/listar', () => {
    expect(app.findRoute({ method: 'GET', url: '/api/contratos/listar' })).toBeDefined();
  });

  it('registra POST /api/contratos/actualizar', () => {
    expect(app.findRoute({ method: 'POST', url: '/api/contratos/actualizar' })).toBeDefined();
  });
});
