# AutoBridge Deployment Guide

This guide covers deploying the full AutoBridge platform including the main app (Vercel) and scraper microservice (Railway).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Main App)                             │
│                                                                  │
│  • Next.js 14 (App Router)                                       │
│  • API Routes (/api/*)                                           │
│  • NextAuth.js (Google OAuth)                                    │
│  • Drizzle ORM → Neon PostgreSQL                                 │
│                                                                  │
│  Environment:                                                    │
│  - DATABASE_URL (Neon)                                           │
│  - SCRAPER_URL (Railway)                                         │
│  - SCRAPER_API_KEY                                               │
│  - Paystack keys                                                 │
│  - Cloudinary keys                                               │
│  - Resend API key                                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │ POST /scrape/copart
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RAILWAY (Scraper Microservice)                 │
│                                                                  │
│  • Express.js server                                             │
│  • Puppeteer + Stealth Plugin                                    │
│  • Docker container with Chromium                                │
│                                                                  │
│  Environment:                                                    │
│  - SCRAPER_API_KEY                                               │
│  - PORT=3001                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Deploy Scraper to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select the `autobridge-scraper` repository
4. Railway auto-detects the Dockerfile

### Step 2: Configure Environment Variables

In Railway dashboard → **Variables** tab:

```env
SCRAPER_API_KEY=<generate-a-secure-random-string>
PORT=3001
```

Generate a secure API key:
```bash
openssl rand -hex 32
```

### Step 3: Deploy

1. Railway auto-deploys when you push to main branch
2. Click **"Deploy"** or push to trigger
3. Wait for build to complete (2-3 minutes)

### Step 4: Get Public URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Note your URL: `https://autobridge-scraper-production.up.railway.app`

### Step 5: Verify Deployment

```bash
# Health check
curl https://autobridge-scraper-production.up.railway.app/health

# Expected response:
# {"status":"ok","service":"autobridge-scraper"}
```

---

## Part 2: Deploy Main App to Vercel

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import the `autobridge` repository

### Step 2: Configure Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Scraper Service (Railway)
SCRAPER_URL=https://autobridge-scraper-production.up.railway.app
SCRAPER_API_KEY=<same-key-as-railway>

# Authentication
JWT_SECRET=<random-32-character-string>
JWT_EXPIRES_IN=7d
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<random-32-character-string>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>

# Payments (Paystack)
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Resend)
RESEND_API_KEY=re_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. Get your URL: `https://autobridge.vercel.app`

### Step 4: Update NEXTAUTH_URL

After first deploy, update `NEXTAUTH_URL` with your actual domain and redeploy.

---

## Part 3: Configure External Services

### Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`
4. Run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```
4. Copy Client ID and Secret to Vercel env vars

### Paystack

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Get API keys from **Settings** → **API Keys & Webhooks**
3. Add webhook URL:
   ```
   https://your-domain.vercel.app/api/webhooks/paystack
   ```

### Cloudinary

1. Go to [Cloudinary Console](https://console.cloudinary.com)
2. Copy Cloud name, API Key, and API Secret
3. Add to Vercel environment variables

### Resend (Email)

1. Go to [Resend Dashboard](https://resend.com)
2. Create an API key
3. Verify your sending domain
4. Add API key to `RESEND_API_KEY`

---

## Part 4: Verify Full Integration

### Test 1: Health Check

```bash
curl https://autobridge-scraper-production.up.railway.app/health
```

### Test 2: Scraper Endpoint

```bash
curl -X POST https://autobridge-scraper-production.up.railway.app/scrape/copart \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"url": "https://www.copart.com/lot/42002756"}'
```

### Test 3: Full User Flow

1. Go to your deployed app
2. Register/login
3. Navigate to **Request a Bid**
4. Paste a Copart URL
5. Verify vehicle data loads

---

## Updating the Scraper

When you make changes to the scraper:

```bash
cd autobridge-scraper

# Make changes to src/index.js

# Commit and push
git add .
git commit -m "fix: improve date extraction"
git push

# Railway auto-deploys on push
```

### Manual Redeploy

1. Go to Railway dashboard
2. Click on the service
3. Click **"Redeploy"**

---

## Updating the Main App

When you make changes to the main app:

```bash
cd autobridge

# Make changes

# Commit and push
git add .
git commit -m "feat: add new feature"
git push

# Vercel auto-deploys on push
```

---

## Monitoring & Logs

### Railway Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

Or view in Railway dashboard → **Deployments** → **View Logs**

### Vercel Logs

View in Vercel dashboard → **Deployments** → **Functions** → **Logs**

---

## Troubleshooting

### Scraper Returns 502

**Cause**: Puppeteer timeout or crash

**Fix**:
1. Check Railway logs for errors
2. Increase memory allocation in Railway settings
3. Add retry logic in the main app

### Scraper Returns 401

**Cause**: API key mismatch

**Fix**:
1. Verify `SCRAPER_API_KEY` matches in both Railway and Vercel
2. Check header name is `X-API-Key` (case-sensitive)

### Vehicle Data Missing

**Cause**: Copart changed their HTML structure

**Fix**:
1. Check scraper logs for extraction errors
2. Update selectors in `src/index.js`
3. Test locally before deploying

### Database Connection Failed

**Cause**: Invalid connection string or Neon project paused

**Fix**:
1. Check `DATABASE_URL` is correct
2. Verify Neon project is active (not paused)
3. Use the pooled connection string

---

## Environment Variables Reference

### Railway (Scraper)

| Variable | Required | Description |
|----------|----------|-------------|
| `SCRAPER_API_KEY` | Yes | API key for authentication |
| `PORT` | No | Server port (default: 3001) |

### Vercel (Main App)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `SCRAPER_URL` | Yes | Railway scraper URL |
| `SCRAPER_API_KEY` | Yes | Must match Railway key |
| `JWT_SECRET` | Yes | JWT signing secret |
| `NEXTAUTH_URL` | Yes | Your app's public URL |
| `NEXTAUTH_SECRET` | Yes | NextAuth encryption secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth secret |
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Yes | Paystack public key |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `RESEND_API_KEY` | Yes | Resend email API key |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app's public URL |

---

## Cost Estimates

### Railway (Scraper)
- **Hobby Plan**: $5/month (includes $5 usage credit)
- **Pro Plan**: $20/month + usage
- Typical usage: ~$10-20/month depending on scrape volume

### Vercel (Main App)
- **Hobby Plan**: Free (limited)
- **Pro Plan**: $20/month
- Serverless functions included

### Neon (Database)
- **Free Tier**: 512MB storage, 1 compute
- **Pro Plan**: $19/month

### Total Estimated Cost
- **Development**: ~$25-50/month
- **Production**: ~$50-100/month

---

## Security Checklist

- [ ] Use different API keys for dev/prod
- [ ] Never commit secrets to git
- [ ] Enable 2FA on all service accounts
- [ ] Rotate API keys periodically
- [ ] Set up Paystack webhook signature verification
- [ ] Enable Vercel password protection for preview deployments
- [ ] Configure CORS properly on scraper

---

## Quick Commands

```bash
# Deploy main app
cd autobridge && git push

# Deploy scraper
cd autobridge-scraper && git push

# Check scraper health
curl https://autobridge-scraper-production.up.railway.app/health

# View Railway logs
railway logs

# Run database migrations
npm run db:generate && npm run db:migrate

# Generate secure API key
openssl rand -hex 32
```
