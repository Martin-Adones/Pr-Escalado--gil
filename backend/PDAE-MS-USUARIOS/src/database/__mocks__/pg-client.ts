export const db = {
  query: jest.fn().mockResolvedValue({ rows: [] }),
  getClient: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn(),
  }),
};
