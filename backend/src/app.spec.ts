import request from 'supertest';
import app from './app';
import { getDatabase, initDatabase } from './config/db';

describe('Thor WMS Backend API Endpoints', () => {
  beforeAll(async () => {
    // Set environment to use SQLite for tests
    process.env.NODE_ENV = 'test';
    // Initialize DB schema in SQLite
    await initDatabase();
  });

  afterAll(async () => {
    const db = getDatabase();
    await db.close();
  });

  it('should return 200 OK on /health health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should reject unauthorized logins with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong_password' });
    
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should reject requests with missing body elements with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' });
    
    expect(res.status).toBe(400);
  });
});
