import fastify from 'fastify';
import rutasUsuarios from '../usuarios.routes';

jest.mock('../../controllers/usuarios.controller');

describe('Rutas usuarios', () => {
  const app = fastify();

  beforeAll(async () => {
    app.register(rutasUsuarios, { prefix: '/api' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra POST /api/usuarios/crear', () => {
    expect(app.findRoute({ method: 'POST', url: '/api/usuarios/crear' })).toBeDefined();
  });

  it('registra GET /api/usuarios/listar', () => {
    expect(app.findRoute({ method: 'GET', url: '/api/usuarios/listar' })).toBeDefined();
  });

  it('registra POST /api/usuarios/actualizar', () => {
    expect(app.findRoute({ method: 'POST', url: '/api/usuarios/actualizar' })).toBeDefined();
  });

  it('registra POST /api/usuarios/sincronizar', () => {
    expect(app.findRoute({ method: 'POST', url: '/api/usuarios/sincronizar' })).toBeDefined();
  });

  it('registra GET /api/usuarios/me', () => {
    expect(app.findRoute({ method: 'GET', url: '/api/usuarios/me' })).toBeDefined();
  });
});
