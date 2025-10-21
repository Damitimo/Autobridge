# Quick Database Setup for MVP

## Option 1: Local PostgreSQL (Recommended - 5 minutes)

### Install PostgreSQL via Homebrew:

```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb autobridge

# Update .env
DATABASE_URL=postgresql://localhost:5432/autobridge
```

## Option 2: Cloud Database (Fastest - 2 minutes)

### Use Supabase (Free tier):

1. Go to https://supabase.com
2. Sign up and create new project
3. Wait 2 minutes for provisioning
4. Copy connection string from Settings → Database
5. Update .env:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

## Option 3: Neon (Serverless PostgreSQL - 2 minutes)

1. Go to https://neon.tech
2. Sign up (GitHub login works)
3. Create project "autobridge"
4. Copy connection string
5. Update .env

```env
DATABASE_URL=postgresql://[user]:[password]@[host].neon.tech/autobridge?sslmode=require
```

---

## Which should you choose?

**For MVP testing:** Option 2 (Supabase) or 3 (Neon) - fastest, no local setup
**For production:** Option 1 (Local) for development, then deploy to cloud

---

## After setting up database:

```bash
# Run migration
npm run db:migrate

# Test scraper  
npm run scraper:test

# Sync vehicles (limited for MVP)
npm run scraper:sync

# Start server
npm run dev
```
