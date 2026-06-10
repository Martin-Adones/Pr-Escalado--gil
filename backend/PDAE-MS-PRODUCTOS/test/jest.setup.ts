import 'reflect-metadata';
// Mock Global de Base de Datos
// Esto garantiza que ningún test intente conectar a Postgres.

// 1. Mock de la librería 'pg' para que 'new Pool()' no haga nada
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

// 2. Mock del cliente de base de datos del proyecto
jest.mock('../src/database/pg-client', () => ({
  db: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    getClient: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
  },
}));
