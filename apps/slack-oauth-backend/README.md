# Slack OAuth Backend

A secure OAuth backend service for Slack integration that handles token exchange and delivers tokens via direct message.

## 🎯 Overview

This service automates the Slack OAuth 2.0 flow, enabling users to easily obtain their User OAuth Tokens (xoxp-) for use with Slack integrations. The service securely exchanges authorization codes for tokens and delivers them directly via Slack DM, eliminating manual token management.

## ✨ Features

- 🔐 **Secure OAuth 2.0 Flow** - Complete implementation with CSRF protection
- 📨 **Automatic Token Delivery** - Tokens sent directly via Slack DM
- 🛡️ **State Validation** - CSRF protection with cryptographically secure state parameters
- 📝 **Comprehensive Error Handling** - User-friendly error pages with recovery guidance
- ⚡ **High Performance** - Built with Express, TypeScript, and optimized for production
- 🏗️ **Nx Integration** - Full monorepo tooling support with build, test, and deploy targets
- 🔄 **Retry Logic** - Automatic retry with exponential backoff for Slack API calls
- 📊 **Health Monitoring** - Built-in health check endpoint for monitoring

## 📋 Prerequisites

- Node.js 18+ or Bun 1.0+
- A Slack App configured with OAuth
- Access to Slack workspace with admin privileges
- Domain with HTTPS for production deployment (optional for local development)

## 🚀 Quick Start

### 1. Create and Configure Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App**
2. Choose **From scratch** and provide:

   - App Name: `Your App Name`
   - Workspace: Select your workspace

3. Configure **OAuth & Permissions**:

   **Bot Token Scopes** (required):

   - `chat:write` - Send messages as bot
   - `im:write` - Open direct messages
   - `users:read` - Access user information
   - `users:read.email` - Read user email addresses (optional)

   **User Token Scopes** (what users will authorize):

   - Configure based on your integration needs
   - Common scopes: `chat:write`, `channels:read`, `groups:read`

4. Configure **Redirect URLs**:

   - Development: `http://localhost:3000/slack/oauth/callback`
   - Production: `https://your-domain.com/slack/oauth/callback`

5. Install App to Workspace:

   - Click **Install to Workspace**
   - Authorize the bot permissions
   - Copy the **Bot User OAuth Token** (starts with `xoxb-`)

6. Get App Credentials:
   - Go to **Basic Information**
   - Copy **Client ID** and **Client Secret**

### 2. Environment Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd ai-toolkit-slack-oauth-backend

# Create environment file
cp apps/slack-oauth-backend/.env.example apps/slack-oauth-backend/.env

# Or use the Nx command
bunx nx env-setup slack-oauth-backend
```

Edit `.env` with your credentials:

```env
# Required Slack Configuration
SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_REDIRECT_URI=http://localhost:3000/slack/oauth/callback

# Security (generate with: openssl rand -hex 32)
SESSION_SECRET=your_session_secret_here

# Optional Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
NOTION_DOC_URL=https://your-docs-url.com/setup
```

### 3. Install Dependencies

```bash
# From monorepo root
bun install

# Or with npm/yarn
npm install
yarn install
```

### 4. Run the Application

#### Development Mode

```bash
# Using Nx (recommended)
bunx nx serve slack-oauth-backend

# With debugging
bunx nx serve slack-oauth-backend --configuration=development

# Direct run
bun run apps/slack-oauth-backend/src/main.ts
```

#### Production Build

```bash
# Build the application
bunx nx build slack-oauth-backend --configuration=production

# Run the built application
node dist/apps/slack-oauth-backend/main.js

# Or use PM2 for process management
pm2 start dist/apps/slack-oauth-backend/main.js --name slack-oauth
```

## 📖 Usage Guide

### OAuth Flow Process

1. **User Initiates OAuth**:

   - Visit `http://localhost:3000/` (or your production URL)
   - Click the "Add to Slack" button
   - Or directly construct the OAuth URL:

   ```
   https://slack.com/oauth/v2/authorize
     ?client_id=YOUR_CLIENT_ID
     &scope=chat:write,users:read
     &redirect_uri=YOUR_REDIRECT_URI
     &state=SECURE_RANDOM_STATE
   ```

2. **User Authorizes**:

   - User reviews requested permissions
   - Clicks "Allow" to grant access

3. **Service Handles Callback**:
   - Validates state parameter (CSRF protection)
   - Exchanges authorization code for access token
   - Fetches user information
   - Sends token via Slack DM
   - Displays success/error page

### API Endpoints

| Endpoint                 | Method | Description                                |
| ------------------------ | ------ | ------------------------------------------ |
| `/`                      | GET    | Landing page with "Add to Slack" button    |
| `/slack/oauth/authorize` | GET    | Initiates OAuth flow (generates state)     |
| `/slack/oauth/callback`  | GET    | Handles OAuth callback from Slack          |
| `/health`                | GET    | Health check endpoint                      |
| `/metrics`               | GET    | Prometheus-compatible metrics (if enabled) |

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
bunx nx test slack-oauth-backend

# Run with coverage
bunx nx test slack-oauth-backend --configuration=ci

# Watch mode for development
bunx nx test slack-oauth-backend --configuration=watch

# Run specific test file
bunx jest apps/slack-oauth-backend/src/oauth/handler.spec.ts
```

### Test Coverage

Current test coverage includes:

- ✅ OAuth handler logic (17 test cases)
- ✅ Slack client operations (23 test cases)
- ✅ Integration tests for full flow (15 scenarios)
- ✅ Error handling and edge cases

### Manual Testing

1. **Test OAuth Flow**:

   ```bash
   # Start the server
   bunx nx serve slack-oauth-backend

   # Visit http://localhost:3000
   # Click "Add to Slack" and complete the flow
   ```

2. **Test Error Scenarios**:
   - Invalid state parameter
   - Expired authorization code
   - Network failures
   - Missing environment variables

## 🚢 Deployment Guide

### Docker Deployment

```dockerfile
# Dockerfile (create in apps/slack-oauth-backend/)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist/apps/slack-oauth-backend ./
EXPOSE 3000
CMD ["node", "main.js"]
```

Build and run:

```bash
# Build Docker image
bunx nx docker-build slack-oauth-backend

# Run container
docker run -p 3000:3000 --env-file .env slack-oauth-backend:latest
```

### Vercel Deployment

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Configure `vercel.json`**:

   ```json
   {
     "builds": [
       {
         "src": "dist/apps/slack-oauth-backend/main.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/apps/slack-oauth-backend/main.js"
       }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   bunx nx build slack-oauth-backend --configuration=production
   vercel --prod
   ```

### Heroku Deployment

1. **Create `Procfile`**:

   ```
   web: node dist/apps/slack-oauth-backend/main.js
   ```

2. **Deploy**:

   ```bash
   # Create Heroku app
   heroku create your-app-name

   # Set environment variables
   heroku config:set SLACK_CLIENT_ID=xxx
   heroku config:set SLACK_CLIENT_SECRET=xxx
   heroku config:set SLACK_BOT_TOKEN=xxx
   heroku config:set SLACK_REDIRECT_URI=https://your-app.herokuapp.com/slack/oauth/callback

   # Deploy
   git push heroku main
   ```

### AWS Lambda Deployment

1. **Install Serverless Framework**:

   ```bash
   npm i -g serverless
   ```

2. **Create `serverless.yml`**:

   ```yaml
   service: slack-oauth-backend

   provider:
     name: aws
     runtime: nodejs18.x
     environment:
       SLACK_CLIENT_ID: ${env:SLACK_CLIENT_ID}
       SLACK_CLIENT_SECRET: ${env:SLACK_CLIENT_SECRET}
       SLACK_BOT_TOKEN: ${env:SLACK_BOT_TOKEN}
       SLACK_REDIRECT_URI: ${env:SLACK_REDIRECT_URI}

   functions:
     app:
       handler: dist/apps/slack-oauth-backend/main.handler
       events:
         - http: ANY /
         - http: ANY /{proxy+}
   ```

3. **Deploy**:
   ```bash
   bunx nx build slack-oauth-backend --configuration=production
   serverless deploy
   ```

### Google Cloud Run Deployment

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/slack-oauth-backend

# Deploy to Cloud Run
gcloud run deploy slack-oauth-backend \
  --image gcr.io/PROJECT_ID/slack-oauth-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SLACK_CLIENT_ID=xxx,SLACK_CLIENT_SECRET=xxx
```

### DigitalOcean App Platform

1. **Create `app.yaml`**:

   ```yaml
   name: slack-oauth-backend
   services:
     - name: web
       github:
         repo: your-username/your-repo
         branch: main
       build_command: bunx nx build slack-oauth-backend --configuration=production
       run_command: node dist/apps/slack-oauth-backend/main.js
       environment_slug: node-js
       http_port: 3000
       instance_count: 1
       instance_size_slug: basic-xs
       envs:
         - key: SLACK_CLIENT_ID
           value: ${SLACK_CLIENT_ID}
         - key: SLACK_CLIENT_SECRET
           value: ${SLACK_CLIENT_SECRET}
           type: SECRET
   ```

2. **Deploy via CLI**:
   ```bash
   doctl apps create --spec app.yaml
   ```

## 🔧 Configuration

### Environment Variables

| Variable              | Required | Description             | Example                                    |
| --------------------- | -------- | ----------------------- | ------------------------------------------ |
| `SLACK_CLIENT_ID`     | ✅       | Slack app client ID     | `123456789.987654321`                      |
| `SLACK_CLIENT_SECRET` | ✅       | Slack app client secret | `abcdef123456`                             |
| `SLACK_BOT_TOKEN`     | ✅       | Bot user OAuth token    | `xoxb-123456789`                           |
| `SLACK_REDIRECT_URI`  | ✅       | OAuth redirect URL      | `https://example.com/slack/oauth/callback` |
| `SESSION_SECRET`      | ✅       | Session encryption key  | 32+ character random string                |
| `PORT`                | ❌       | Server port             | `3000` (default)                           |
| `NODE_ENV`            | ❌       | Environment mode        | `development` or `production`              |
| `LOG_LEVEL`           | ❌       | Logging verbosity       | `debug`, `info`, `warn`, `error`           |
| `NOTION_DOC_URL`      | ❌       | Documentation URL       | `https://notion.so/setup`                  |
| `RATE_LIMIT_MAX`      | ❌       | Max requests per window | `100` (default)                            |
| `RATE_LIMIT_WINDOW`   | ❌       | Rate limit window (ms)  | `900000` (15 min default)                  |

### Security Features

The service includes comprehensive security measures:

#### Built-in Security Middleware

1. **Helmet.js Integration**:

   - Sets secure HTTP headers
   - Prevents common attacks (XSS, clickjacking, etc.)
   - Content Security Policy (CSP) enforcement
   - HSTS for HTTPS enforcement

2. **Rate Limiting**:

   - Global: 100 requests per 15 minutes per IP
   - OAuth endpoints: 10 requests per 15 minutes per IP
   - Configurable via environment variables

3. **Input Sanitization**:

   - XSS protection via DOMPurify
   - SQL injection prevention
   - Path traversal protection

4. **CSRF Protection**:
   - Cryptographically secure state parameters
   - State validation on OAuth callback
   - Session-based verification

#### Security Headers

```javascript
// Automatically applied via Helmet:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

#### Security Best Practices

1. **Token Security**:

   - Tokens automatically redacted in logs
   - Secure session storage with encryption
   - No token persistence to disk
   - Automatic token sanitization in errors
   - Token delivery only via secure DM

2. **Network Security**:

   - HTTPS enforcement in production
   - CORS configuration for API access
   - IP-based rate limiting
   - Connection throttling

3. **Environment Security**:

   - Environment variable validation on startup
   - Secrets never logged or exposed
   - Secure session secret generation required
   - Support for secret management services

4. **Data Protection**:
   - No storage of user tokens
   - Minimal data retention
   - Automatic cache expiration
   - Secure error messages (no stack traces in production)

#### Security Monitoring

```bash
# Check security headers
curl -I http://localhost:3000 | grep -E "X-|Strict-"

# Monitor rate limiting
curl -I http://localhost:3000/slack/oauth/authorize | grep "X-RateLimit"

# Audit log analysis
grep "SECURITY" app.log | tail -50

# Check for exposed secrets
bunx nx serve slack-oauth-backend --log-level=debug | grep -E "xox[bpra]-"
```

#### Compliance Considerations

- GDPR: Minimal data collection, no persistence
- SOC2: Audit logging, access controls
- OAuth 2.0: Full spec compliance
- Slack Security: Following Slack's security best practices

## 🐛 Troubleshooting

### Common Issues and Solutions

#### "Missing required environment variable"

```bash
# Check all variables are set
printenv | grep SLACK

# Verify .env file is loaded
cat apps/slack-oauth-backend/.env

# Validate configuration on startup
bunx nx serve slack-oauth-backend --log-level=debug
```

#### "Invalid client_id or client_secret"

- Verify credentials in Slack app settings
- Check for extra spaces or newlines in .env
- Ensure app is not deleted or suspended
- Regenerate client secret if needed
- Check configuration validation errors in logs

#### "Invalid redirect_uri"

- Must exactly match Slack app configuration
- Check protocol (http vs https)
- Verify no trailing slashes
- Ensure domain is correct
- Check CORS settings if cross-origin

#### "Cannot send DM to user"

```bash
# Check bot token scopes
curl -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer xoxb-your-token"

# Verify bot is in workspace
curl -X POST https://slack.com/api/team.info \
  -H "Authorization: Bearer xoxb-your-token"

# Test direct message capability
curl -X POST https://slack.com/api/conversations.open \
  -H "Authorization: Bearer xoxb-your-token" \
  -H "Content-Type: application/json" \
  -d '{"users": "USER_ID"}'
```

#### "State parameter mismatch"

- Check session configuration
- Verify SESSION_SECRET is set and consistent
- Clear browser cookies
- Check for multiple redirect URIs
- Verify state validation in logs
- Check for CSRF token expiration

#### "Token exchange timeout"

- Check network connectivity
- Verify Slack API status
- Increase timeout settings (default 10s)
- Check firewall rules
- Monitor retry attempts in logs
- Check connection pool status in /health endpoint

#### "Rate limit exceeded"

- Check rate limit headers in response
- Default: 100 requests per 15 minutes per IP
- OAuth endpoints: 10 requests per 15 minutes per IP
- Increase limits via environment variables if needed
- Implement client-side retry with backoff

#### "Cache related issues"

```bash
# Check cache statistics
curl http://localhost:3000/health | jq '.cache'

# Monitor cache hit rates
curl http://localhost:3000/metrics | grep cache

# Clear caches (requires restart)
# Caches are automatically cleared on graceful shutdown
```

### Debug Mode

Enable detailed logging:

```bash
# Set debug log level
LOG_LEVEL=debug bunx nx serve slack-oauth-backend

# With additional Node.js debugging
DEBUG=* bunx nx serve slack-oauth-backend

# Inspect mode for breakpoints
bunx nx serve slack-oauth-backend --inspect
```

### Monitoring and Logs

#### Application Logs

```bash
# View application logs with different log levels
LOG_LEVEL=debug bunx nx serve slack-oauth-backend 2>&1 | tee app.log

# Monitor in production with PM2
pm2 start dist/apps/slack-oauth-backend/main.js --name slack-oauth
pm2 logs slack-oauth --lines 100
pm2 monit

# View structured logs (production)
bunx nx serve slack-oauth-backend --configuration=production | jq '.'
```

#### Health Monitoring

```bash
# Basic health check
curl http://localhost:3000/health

# Health check with formatting
curl http://localhost:3000/health | jq '.'

# Monitor health continuously
watch -n 5 'curl -s http://localhost:3000/health | jq ".status, .uptime, .slack.connected"'
```

#### Metrics and Performance

```bash
# Get Prometheus metrics
curl http://localhost:3000/metrics

# Monitor specific metrics
curl -s http://localhost:3000/metrics | grep -E "cache_hits|cache_size|uptime"

# Cache performance analysis
curl -s http://localhost:3000/health | jq '.cache'

# Memory usage monitoring
curl -s http://localhost:3000/health | jq '.node.memory'
```

#### Real-time Monitoring Setup

1. **Prometheus Configuration** (`prometheus.yml`):

```yaml
scrape_configs:
  - job_name: 'slack-oauth-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

2. **Grafana Dashboard**:

   - Import dashboard ID: [Create custom dashboard]
   - Key metrics to track:
     - Request rate and response times
     - Cache hit rates
     - Memory usage
     - Error rates
     - OAuth success/failure ratio

3. **AlertManager Rules**:

```yaml
groups:
  - name: slack_oauth_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: 'High error rate detected'

      - alert: LowCacheHitRate
        expr: cache_hits_total / (cache_hits_total + cache_misses_total) < 0.5
        for: 10m
        annotations:
          summary: 'Cache hit rate below 50%'
```

## 📊 Performance Optimization

### Built-in Optimizations

The service includes several performance optimizations out of the box:

1. **Connection Pooling**: HTTP agent with keep-alive connections
2. **In-Memory Caching**: User info and DM channels cached with TTL
3. **Singleton Pattern**: Slack client reuses connections
4. **Rate Limiting**: Prevents abuse and protects resources
5. **Graceful Shutdown**: Proper resource cleanup

### Caching Strategy

#### Current Implementation

```javascript
// Built-in caches with configurable TTL
- userInfoCache: 10 minutes TTL, 500 items max
- channelCache: 30 minutes TTL, 200 items max
- tokenValidationCache: 5 minutes TTL, 100 items max
```

#### Cache Statistics

Monitor cache performance via health endpoint:

```json
{
  "cache": {
    "userInfo": {
      "size": 45,
      "hitRate": "85.23%"
    },
    "channels": {
      "size": 23,
      "hitRate": "92.15%"
    }
  }
}
```

#### Redis Integration (Optional)

For distributed deployments, replace in-memory cache with Redis:

```bash
# Install Redis adapter
bun add redis ioredis

# Configure Redis URL
REDIS_URL=redis://localhost:6379
```

### Performance Tuning

#### Environment Variables

```env
# Connection pooling
HTTP_MAX_SOCKETS=10        # Max concurrent connections per host
HTTP_MAX_FREE_SOCKETS=5    # Max idle connections per host
HTTP_KEEP_ALIVE_MSECS=1000 # Keep-alive ping interval

# Cache configuration
CACHE_USER_TTL=600000      # User info cache TTL (ms)
CACHE_CHANNEL_TTL=1800000  # Channel cache TTL (ms)
CACHE_MAX_SIZE=500         # Max items per cache

# Rate limiting
RATE_LIMIT_WINDOW=900000   # Rate limit window (15 min)
RATE_LIMIT_MAX=100         # Max requests per window
OAUTH_RATE_LIMIT_MAX=10    # Max OAuth attempts per window

# Timeouts
API_TIMEOUT=10000          # Slack API timeout (ms)
RETRY_MAX_TIME=30000       # Max retry time (ms)
```

#### Node.js Optimizations

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=512"

# Enable clustering (PM2)
pm2 start main.js -i max  # Use all CPU cores

# Production optimizations
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size"
```

### Scaling Considerations

#### Horizontal Scaling

1. **Load Balancer Configuration**:

```nginx
upstream slack_oauth {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

2. **Session Sharing**:

   - Use Redis for shared session storage
   - Implement sticky sessions if needed

3. **Cache Synchronization**:
   - Use Redis for distributed caching
   - Implement cache invalidation strategy

#### Vertical Scaling

- Increase Node.js memory limit
- Optimize connection pool sizes
- Tune garbage collection
- Use worker threads for CPU-intensive tasks

### Monitoring Performance

```bash
# CPU and memory profiling
bunx nx serve slack-oauth-backend --inspect
# Connect Chrome DevTools to chrome://inspect

# Load testing with k6
k6 run load-test.js

# Monitor event loop lag
npm install event-loop-stats
```

### Best Practices

1. **Database Optimization** (if using):

   - Connection pooling
   - Query optimization
   - Proper indexing

2. **API Response Caching**:

   - Cache successful OAuth responses
   - Cache user lookups
   - Implement cache warming

3. **Resource Management**:
   - Graceful shutdown handling
   - Proper error recovery
   - Circuit breaker pattern for external APIs

## 🤝 Contributing

This project is part of the AI Toolkit monorepo. Please follow these guidelines:

1. **Code Style**: Run `bunx nx format:write` before committing
2. **Testing**: Ensure all tests pass with `bunx nx test slack-oauth-backend`
3. **Type Safety**: Run `bunx nx typecheck slack-oauth-backend`
4. **Linting**: Fix all lint issues with `bunx nx lint slack-oauth-backend --fix`
5. **Documentation**: Update README for new features

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
bunx nx test slack-oauth-backend
bunx nx lint slack-oauth-backend

# Format code
bunx nx format:write

# Commit with conventional commits
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature
```

## 📚 Additional Resources

- [Slack OAuth Documentation](https://api.slack.com/authentication/oauth-v2)
- [Slack Web API Reference](https://api.slack.com/web)
- [Express.js Documentation](https://expressjs.com/)
- [Nx Documentation](https://nx.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Slack Community**: [Join our Slack](https://your-slack-invite-link)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- Slack API Team for excellent documentation
- Nx team for the powerful monorepo tools
- Open source community for invaluable packages

---

Built with ❤️ as part of the AI Toolkit project
