const request = require('supertest');

jest.mock('pg', () => {
  const queryMock = jest.fn();

  const PoolMock = jest.fn(() => ({
    query: queryMock,
    end: jest.fn(),
  }));

  return { Pool: PoolMock };
});

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_API_TOKEN = 'admin-token';
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/aegis_test';
process.env.JWT_EXPIRES_IN = '24h';

const argon2 = require('argon2');
const { Pool } = require('pg');
const { app } = require('../server');

const poolInstance = new Pool();

describe('Auth API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user successfully', async () => {
    argon2.hash.mockResolvedValueOnce('hashed-password');

    poolInstance.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 'user-123',
            username: 'new-user',
            public_key: 'public-key',
            encrypted_private_key: 'encrypted-private-key',
          },
        ],
      });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'new-user',
        password: 'Password1!',
        publicKey: 'public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      userId: 'user-123',
      username: 'new-user',
      publicKey: 'public-key',
      encryptedPrivateKey: 'encrypted-private-key',
    });
  });

  it('logs in a user successfully', async () => {
    poolInstance.query.mockResolvedValueOnce({
      rows: [
        {
          user_id: 'user-456',
          username: 'existing-user',
          password_hash: 'hashed-password',
          public_key: 'public-key',
          encrypted_private_key: 'encrypted-private-key',
        },
      ],
    });

    argon2.verify.mockResolvedValueOnce(true);

    const response = await request(app).post('/api/v1/auth/login').send({
      username: 'existing-user',
      password: 'Password1!',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: expect.any(String),
      userId: 'user-456',
      username: 'existing-user',
      publicKey: 'public-key',
      encryptedPrivateKey: 'encrypted-private-key',
    });
  });

  it('rejects login with invalid credentials', async () => {
    poolInstance.query.mockResolvedValueOnce({
      rows: [
        {
          user_id: 'user-456',
          username: 'existing-user',
          password_hash: 'hashed-password',
          public_key: 'public-key',
          encrypted_private_key: 'encrypted-private-key',
        },
      ],
    });

    argon2.verify.mockResolvedValueOnce(false);

    const response = await request(app).post('/api/v1/auth/login').send({
      username: 'existing-user',
      password: 'WrongPassword!',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid credentials.' });
  });

  it('rejects registration when username already exists', async () => {
    argon2.hash.mockResolvedValueOnce('hashed-password');

    const uniqueViolationError = new Error('duplicate key value violates unique constraint');
    uniqueViolationError.code = '23505';

    poolInstance.query.mockResolvedValueOnce({ rows: [] });
    poolInstance.query.mockRejectedValueOnce(uniqueViolationError);

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'new-user',
        password: 'Password1!',
        publicKey: 'public-key',
        encryptedPrivateKey: 'encrypted-private-key',
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Username already exists.' });
  });
});

