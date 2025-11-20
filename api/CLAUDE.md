# Vercel API Endpoints

## Purpose

Serverless API endpoints deployed on Vercel. Provides backend functionality for the AI Toolkit web services.

## Endpoint Files

### slack-oauth.js

**Purpose**: Serverless endpoint for Slack OAuth flow

**URL**: `https://yourdomain.vercel.app/api/slack-oauth`

**Method**: GET

**Query Parameters**:

- `code` - Authorization code from Slack
- `state` - CSRF protection state parameter
- `error` - Error code if authorization failed
- `error_description` - Human-readable error description

**Response**:

- **Success**: Redirect to success page with tokens
- **Error**: Redirect to error page with message

**Implementation**:

```javascript
// api/slack-oauth.js
module.exports = async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/error?message=${error}`);
  }

  try {
    // Exchange code for access token
    const tokens = await exchangeCodeForToken(code);

    // Store tokens securely
    await storeTokens(tokens);

    // Redirect to success
    res.redirect('/success');
  } catch (err) {
    res.redirect(`/error?message=${err.message}`);
  }
};
```

## Vercel Serverless Functions

### File Structure

```
api/
└── slack-oauth.js    # OAuth callback endpoint
```

Each `.js` file in `api/` becomes a serverless function:

- `api/slack-oauth.js` → `/api/slack-oauth`
- `api/example.js` → `/api/example`

### Function Format

```javascript
// Export handler function
module.exports = async (request, response) => {
  // Access request
  const { query, body, method, headers } = request;

  // Send response
  response.status(200).json({ success: true });
};
```

### Environment Variables

Configure in Vercel dashboard or `vercel.json`:

```json
{
  "env": {
    "SLACK_CLIENT_ID": "@slack-client-id",
    "SLACK_CLIENT_SECRET": "@slack-client-secret"
  }
}
```

Access in code:

```javascript
const clientId = process.env.SLACK_CLIENT_ID;
```

## Deployment

### Vercel Configuration

Create `vercel.json` at repository root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

### Deployment Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### GitHub Integration

Vercel can auto-deploy on push:

1. Connect repository in Vercel dashboard
2. Configure environment variables
3. Automatic deployments on commits

## Development

### Local Testing

```bash
# Install Vercel CLI
npm install -g vercel

# Run local dev server
vercel dev

# Test endpoint
curl http://localhost:3000/api/slack-oauth?code=test
```

### Adding New Endpoints

1. **Create endpoint file**:

   ```bash
   touch api/my-endpoint.js
   ```

2. **Implement handler**:

   ```javascript
   module.exports = async (req, res) => {
     const { param } = req.query;

     try {
       const result = await processRequest(param);
       res.status(200).json(result);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

3. **Test locally**:

   ```bash
   vercel dev
   curl http://localhost:3000/api/my-endpoint?param=value
   ```

4. **Deploy**:

   ```bash
   vercel --prod
   ```

### Testing Endpoints

```javascript
// api/my-endpoint.test.js
const handler = require('./my-endpoint');

describe('my-endpoint', () => {
  it('should handle valid request', async () => {
    const req = { query: { param: 'value' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
```

## Security Considerations

### Input Validation

Always validate input:

```javascript
if (!code || typeof code !== 'string') {
  return res.status(400).json({ error: 'Invalid code' });
}
```

### Rate Limiting

Implement rate limiting for public endpoints:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

module.exports = limiter(async (req, res) => {
  // Handler code
});
```

### Secrets Management

- **Never commit secrets** to repository
- Use Vercel environment variables
- Reference with `process.env.SECRET_NAME`
- Rotate secrets regularly

## Related Documentation

- Slack OAuth implementation: `../apps/slack-oauth-backend/src/oauth/CLAUDE.md`
- Vercel docs: <https://vercel.com/docs/serverless-functions/introduction>
- Deployment workflows: `../.github/workflows/CLAUDE.md`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
