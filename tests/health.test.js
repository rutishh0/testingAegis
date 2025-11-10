jest.mock('pg', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
  const mockPool = jest.fn(() => ({
    query: mockQuery,
    end: jest.fn(),
  }));

  return { Pool: mockPool };
});

process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_API_TOKEN = 'admin-token';
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/aegis_test';

const request = require('supertest');
const { app } = require('../server');

describe('GET /health', () => {
  it('returns ok when database query succeeds', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'reachable' });
  });
});

