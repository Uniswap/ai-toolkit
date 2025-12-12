# Slack OAuth Backend

## Overview

Express.js backend application that handles Slack OAuth 2.0 authentication flow for the AI Toolkit. Provides secure token exchange and user authorization for Slack integrations.

## Key Commands

- `nx build slack-oauth-backend` - Build the application for production
- `nx build slack-oauth-backend:development` - Build with development configuration
- `nx serve slack-oauth-backend` - Start development server with hot reload
- `nx test slack-oauth-backend` - Run unit tests
- `nx test slack-oauth-backend:ci` - Run tests with coverage reporting
- `nx lint slack-oauth-backend` - Run ESLint checks
- `nx typecheck slack-oauth-backend` - Run TypeScript type checking
- `nx docker-build slack-oauth-backend --tag=<version>` - Build Docker image
- `nx docker-run slack-oauth-backend` - Run Docker container locally
- `nx env-setup slack-oauth-backend` - Copy .env.example to .env
- `nx deploy slack-oauth-backend` - Deploy to configured platform
- `nx clean slack-oauth-backend` - Remove build artifacts

## Project Structure

```
apps/slack-oauth-backend/
├── src/
│   ├── main.ts              # Application entry point
│   ├── server.ts            # Express server configuration
│   ├── oauth/               # OAuth handler implementation
│   ├── routes/              # API route definitions
│   ├── middleware/          # Express middleware
│   ├── slack/               # Slack API integrations
│   ├── messages/            # Response messages
│   ├── config/              # Environment configuration
│   ├── assets/              # Static assets
│   └── utils/               # Utility functions
├── Dockerfile               # Docker container configuration
└── webpack.config.js        # Webpack build configuration
```

## Dependencies

<!-- AUTO-GENERATED - Updated by /update-claude-md -->

- **@slack/web-api** (^7.10.0) - Official Slack Web API client for Node.js
- **express** (^5.1.0) - Fast, unopinionated web framework for Node.js
- **cors** (^2.8.5) - CORS middleware for Express
- **helmet** (^8.1.0) - Security middleware for Express headers
- **dotenv** (^17.2.1) - Environment variable management

## Environment Variables

Required variables (see `.env.example`):

- `SLACK_CLIENT_ID` - Slack app client ID
- `SLACK_CLIENT_SECRET` - Slack app client secret
- `SLACK_REDIRECT_URI` - OAuth redirect URI
- `PORT` - Server port (default: 3000)

## Development

1. Set up environment:

   ```bash
   nx env-setup slack-oauth-backend
   # Edit apps/slack-oauth-backend/.env with your Slack credentials
   ```

2. Start development server:

   ```bash
   nx serve slack-oauth-backend
   ```

3. Run tests:

   ```bash
   nx test slack-oauth-backend:watch
   ```

## Deployment

### Docker

```bash
# Build image
nx docker-build slack-oauth-backend --tag=v1.0.0

# Run locally
nx docker-run slack-oauth-backend
```

### Platform-specific

Configure the `deploy` target in `project.json` for your platform (AWS, GCP, Azure, Vercel, etc.).

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory or subdirectories, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
