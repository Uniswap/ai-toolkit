# Vercel Deployment Guide

This guide walks you through deploying the Slack OAuth Backend to Vercel.

## Prerequisites

- Vercel account (with your organization's team access)
- Slack App configured with OAuth
- Git repository pushed to GitHub/GitLab/Bitbucket

## Deployment Steps

### 1. Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import the `ai-toolkit-slack-oauth-backend` repository
4. Select your organization's team from the dropdown

### 2. Configure Build Settings

**Important**: Set the **Root Directory** to `apps/slack-oauth-backend` in Vercel

When importing, configure these settings:

- **Framework Preset**: Other
- **Root Directory**: `apps/slack-oauth-backend` ← **IMPORTANT**
- **Build Command**: (Leave blank - auto-detected from vercel.json)
- **Output Directory**: (Leave blank - auto-detected from vercel.json)
- **Install Command**: (Leave blank - auto-detected from vercel.json)

The build will:

1. Navigate to the monorepo root
2. Run `npx nx build slack-oauth-backend`
3. Output files to the correct location for Vercel deployment

### 3. Set Environment Variables

Add these environment variables in the Vercel dashboard:

#### Required Variables

| Variable              | Description                                              | Sensitive |
| --------------------- | -------------------------------------------------------- | --------- |
| `SLACK_CLIENT_ID`     | Your Slack app client ID                                 | No        |
| `SLACK_CLIENT_SECRET` | Your Slack app client secret                             | Yes ✓     |
| `SLACK_BOT_TOKEN`     | Bot user OAuth token (xoxb-...)                          | Yes ✓     |
| `SESSION_SECRET`      | 32+ character random string                              | Yes ✓     |
| `SLACK_REDIRECT_URI`  | `https://[your-project].vercel.app/slack/oauth/callback` | No        |

#### Optional Variables

| Variable         | Description         | Default      |
| ---------------- | ------------------- | ------------ |
| `NODE_ENV`       | Environment mode    | `production` |
| `LOG_LEVEL`      | Logging verbosity   | `info`       |
| `NOTION_DOC_URL` | Documentation URL   | -            |
| `CORS_ORIGIN`    | CORS allowed origin | -            |

**To generate SESSION_SECRET:**

```bash
openssl rand -hex 32
```

### 4. Deploy

Click **"Deploy"** and wait for the build to complete. Vercel will:

1. Install dependencies
2. Build the project using Nx
3. Deploy the serverless function
4. Provide you with a deployment URL

### 5. Post-Deployment Setup

#### Update Slack App Configuration

1. Copy your Vercel deployment URL (e.g., `https://slack-oauth-backend.vercel.app`)
2. Go to [api.slack.com/apps](https://api.slack.com/apps) → Your App → **OAuth & Permissions**
3. Update the **Redirect URL** to:

   ```
   https://your-deployment-url.vercel.app/slack/oauth/callback
   ```

4. Save changes

#### Update Environment Variable

1. Go back to Vercel Dashboard → Project Settings → Environment Variables
2. Update `SLACK_REDIRECT_URI` with your actual deployment URL
3. Redeploy to apply the change (Vercel → Deployments → Redeploy)

### 6. Test Your Deployment

1. Visit your deployment URL: `https://your-project.vercel.app`
2. Click the **"Add to Slack"** button
3. Complete the OAuth flow
4. Verify you receive the token via Slack DM

## Custom Domain (Optional)

To use a custom domain:

1. Go to Vercel Dashboard → Project Settings → **Domains**
2. Add your custom domain (e.g., `oauth.yourdomain.com`)
3. Follow the DNS configuration instructions
4. Update `SLACK_REDIRECT_URI` environment variable
5. Update Slack app OAuth redirect URL

## Local Development with Vercel

### Setup Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables for local development
vercel env pull apps/slack-oauth-backend/.env.local
```

### Run Locally

```bash
# Development with hot reload
cd apps/slack-oauth-backend
vercel dev

# Or use the npm script
npm run vercel-dev
```

The local dev server will run on `http://localhost:3000` with your Vercel environment variables.

## Monitoring & Debugging

### View Logs

1. Go to Vercel Dashboard → Your Project → **Functions** tab
2. Click on the function to view real-time logs
3. Use filters to search for specific events

### Check Function Metrics

- **Invocations**: Number of function calls
- **Duration**: Execution time per invocation
- **Errors**: Failed invocations with stack traces

### Common Issues

#### "Function Timeout"

- Default timeout is 10 seconds
- Can be increased up to 60 seconds on Pro plan
- Check for slow Slack API calls

#### "Environment Variable Not Found"

- Ensure all variables are set in Vercel dashboard
- Redeploy after adding/updating variables
- Check variable names match exactly

#### "Module Not Found"

- Ensure build completes successfully
- Check `vercel.json` outputDirectory matches build output
- Verify all dependencies are in `package.json`

## Deployment Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# List all deployments
vercel ls

# Inspect deployment
vercel inspect [deployment-url]

# View logs
vercel logs [deployment-url]

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## CI/CD Integration

Vercel automatically creates preview deployments for pull requests. To set up:

1. Enable **Preview Deployments** in Vercel project settings
2. Every PR will get a unique preview URL
3. Production deploys on merge to main branch

## Security Notes

- All sensitive environment variables should be marked as "Sensitive" in Vercel
- Use Vercel's built-in secret rotation for regular updates
- Monitor function logs for suspicious activity
- Enable Vercel's DDoS protection (automatic on Pro plan)

## Cost Considerations

For your use case (one-time token generation per employee):

- **Free Tier**: 100GB bandwidth, 100GB-hrs compute - More than sufficient
- **Function Invocations**: Unlimited on all plans
- **Monitoring**: Basic analytics included free

Your usage will easily fit within Vercel's free tier.

## Support

- **Vercel Issues**: [vercel.com/support](https://vercel.com/support)
- **Project Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Slack API**: [api.slack.com/support](https://api.slack.com/support)
