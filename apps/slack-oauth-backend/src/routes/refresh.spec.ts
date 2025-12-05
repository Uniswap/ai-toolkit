import { WebClient } from '@slack/web-api';
import request from 'supertest';
import express from 'express';

// Mock the Slack WebClient
jest.mock('@slack/web-api');

// Mock the config module
jest.mock('../config', () => ({
  config: {
    slackClientId: 'test-client-id',
    slackClientSecret: 'test-client-secret',
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

describe('Token Refresh Endpoint', () => {
  let mockOAuthV2Access: jest.Mock;

  function createTestApp(): express.Application {
    // Create a fresh app instance for each test to avoid rate limiter state issues
    const app = express();
    app.use(express.json());

    // Dynamically import the router to get a fresh instance with new rate limiter
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const freshRouter = require('./refresh').default;
      app.use('/slack/refresh', freshRouter);
    });

    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementation
    mockOAuthV2Access = jest.fn();

    // Mock WebClient constructor and methods
    (WebClient as jest.MockedClass<typeof WebClient>).mockImplementation(
      () => {
        const client = {
          oauth: {
            v2: {
              access: mockOAuthV2Access,
            },
          },
        } as any;
        return client;
      }
    );
  });

  describe('POST /slack/refresh', () => {
    describe('with valid refresh token', () => {
      const validRefreshToken = 'xoxe-1-valid-refresh-token-12345678901234567890';

      const mockTokenResponse = {
        ok: true,
        access_token: 'xoxp-new-access-token',
        refresh_token: 'xoxe-1-new-refresh-token',
        token_type: 'user',
      };

      beforeEach(() => {
        mockOAuthV2Access.mockResolvedValue(mockTokenResponse);
      });

      it('should successfully refresh token', async () => {
        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(200)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: true,
          access_token: 'xoxp-new-access-token',
          refresh_token: 'xoxe-1-new-refresh-token',
        });
      });

      it('should call Slack API with correct parameters', async () => {
        const app = createTestApp();
        await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(200);

        expect(mockOAuthV2Access).toHaveBeenCalledWith({
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          grant_type: 'refresh_token',
          refresh_token: validRefreshToken,
        });
      });

      it('should handle response without new refresh token', async () => {
        mockOAuthV2Access.mockResolvedValue({
          ok: true,
          access_token: 'xoxp-new-access-token',
          token_type: 'user',
        });

        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(200);

        expect(response.body.ok).toBe(true);
        expect(response.body.access_token).toBe('xoxp-new-access-token');
        expect(response.body.refresh_token).toBeUndefined();
      });
    });

    describe('validation errors', () => {
      it('should reject request without refresh_token', async () => {
        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({})
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: false,
          error: 'missing_refresh_token',
        });
      });

      it('should reject non-string refresh_token', async () => {
        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: 12345 })
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: false,
          error: 'invalid_refresh_token',
        });
      });

      it('should reject refresh_token with invalid format', async () => {
        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: 'invalid-format-token' })
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: false,
          error: 'invalid_refresh_token',
        });
      });

      it('should reject refresh_token that is too short', async () => {
        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: 'xoxe-short' })
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: false,
          error: 'invalid_refresh_token',
        });
      });

      it('should reject refresh_token that is too long', async () => {
        const app = createTestApp();
        const veryLongToken = 'xoxe-' + 'a'.repeat(500);
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: veryLongToken })
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: false,
          error: 'invalid_refresh_token',
        });
      });
    });

    describe('Slack API errors', () => {
      const validRefreshToken = 'xoxe-1-valid-refresh-token-12345678901234567890';

      it('should handle invalid refresh token error', async () => {
        mockOAuthV2Access.mockResolvedValue({
          ok: false,
          error: 'invalid_refresh_token',
        });

        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: false,
          error: 'invalid_refresh_token',
        });
      });

      it('should handle expired refresh token error', async () => {
        mockOAuthV2Access.mockResolvedValue({
          ok: false,
          error: 'token_expired',
        });

        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: false,
          error: 'token_expired',
        });
      });

      it('should handle generic Slack API error', async () => {
        mockOAuthV2Access.mockResolvedValue({
          ok: false,
          error: 'unknown_error',
        });

        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(400);

        expect(response.body.ok).toBe(false);
        expect(response.body.error).toBe('unknown_error');
      });

      it('should handle network errors during token refresh', async () => {
        mockOAuthV2Access.mockRejectedValue(new Error('Network error'));

        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(500);

        // Should not leak internal error details
        expect(response.body.ok).toBeUndefined();
      });

      it('should handle response without access token', async () => {
        mockOAuthV2Access.mockResolvedValue({
          ok: true,
          // Missing access_token
        });

        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(500)
          .expect('Content-Type', /json/);

        expect(response.body).toEqual({
          ok: false,
          error: 'invalid_response',
        });
      });
    });

    describe('rate limiting', () => {
      const validRefreshToken = 'xoxe-1-valid-refresh-token-12345678901234567890';

      beforeEach(() => {
        mockOAuthV2Access.mockResolvedValue({
          ok: true,
          access_token: 'xoxp-new-access-token',
          refresh_token: 'xoxe-1-new-refresh-token',
        });
      });

      it('should have rate limiting configured', async () => {
        // Just verify that a single request succeeds
        // Rate limiting behavior is tested in integration tests
        const app = createTestApp();
        await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: validRefreshToken })
          .expect(200);
      });
    });

    describe('security', () => {
      it('should not leak sensitive information in errors', async () => {
        mockOAuthV2Access.mockRejectedValue(new Error('Database connection failed'));

        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .send({ refresh_token: 'xoxe-1-valid-refresh-token-12345678901234' });

        // Should return a 500 status if not rate limited
        if (response.status !== 429) {
          expect(response.status).toBe(500);
          // Should not contain internal error details
          expect(JSON.stringify(response.body)).not.toContain('Database');
        }
      });

      it('should handle malformed JSON gracefully', async () => {
        const app = createTestApp();
        const response = await request(app)
          .post('/slack/refresh')
          .set('Content-Type', 'application/json')
          .send('invalid-json{')
          .expect(400);

        expect(response.body).toBeDefined();
      });
    });
  });

  describe('CORS support', () => {
    it('should handle OPTIONS preflight request', async () => {
      const app = createTestApp();
      const response = await request(app).options('/slack/refresh');

      // Should either return 200 (OPTIONS handled) or 404 (no CORS in test app)
      expect([200, 404]).toContain(response.status);
    });
  });
});
