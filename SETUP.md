# AutoBridge Setup Guide

This guide will walk you through setting up AutoBridge locally for development.

## Prerequisites

Make sure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Redis** 6.x or higher ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd autobridge

# Install dependencies
npm install
```

## Step 2: Database Setup

### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql postgres

# Create the database
CREATE DATABASE autobridge;

# Create a user (optional)
CREATE USER autobridge_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE autobridge TO autobridge_user;

# Exit psql
\q
```

### Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` and update these critical values:

```env
# Database - Update with your credentials
DATABASE_URL=postgresql://localhost:5432/autobridge
# or if you created a user:
# DATABASE_URL=postgresql://autobridge_user:your_password@localhost:5432/autobridge

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secret - Generate a strong secret
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# For development, these can stay as placeholders
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Database Migrations

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate
```

### Seed Database with Sample Data (Optional but Recommended)

```bash
npm run db:seed
```

This will create:
- A test user account:
  - Email: `emeka@example.com`
  - Password: `password123`
- 5 sample vehicles
- Sample bid and shipment

## Step 3: Start Redis

### On macOS (with Homebrew):
```bash
brew services start redis
```

### On Linux:
```bash
sudo systemctl start redis
```

### On Windows:
Download Redis from [GitHub](https://github.com/microsoftarchive/redis/releases) or use WSL

### Verify Redis is Running:
```bash
redis-cli ping
# Should return: PONG
```

## Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 5: Test the Application

### 1. Homepage
- Visit http://localhost:3000
- You should see the AutoBridge landing page

### 2. Browse Vehicles
- Navigate to "Browse Vehicles" 
- Search and filter the sample vehicles

### 3. Login
- Go to Login page
- Use test credentials:
  - Email: `emeka@example.com`
  - Password: `password123`

### 4. Dashboard
- After login, you'll be redirected to the dashboard
- View your sample shipment and bid

### 5. View Vehicle Details
- Click on any vehicle
- See the AI cost calculator in action

## Troubleshooting

### Database Connection Issues

**Error: "connection refused"**
```bash
# Check if PostgreSQL is running
pg_isready

# If not, start it:
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

**Error: "database does not exist"**
```bash
# Recreate the database
createdb autobridge
npm run db:migrate
```

### Redis Connection Issues

**Error: "Redis connection failed"**
```bash
# Check if Redis is running
redis-cli ping

# If not:
redis-server
```

### Port Already in Use

**Error: "Port 3000 is already in use"**
```bash
# Run on a different port
PORT=3001 npm run dev
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

## Development Tools

### Database Studio (GUI for Database)
```bash
npm run db:studio
```
Opens Drizzle Studio at http://localhost:4983

### TypeScript Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

## Next Steps

1. **Configure Payment Gateways**: Add real API keys for Paystack/Flutterwave
2. **Setup Email**: Configure SendGrid or AWS SES for email notifications
3. **Setup SMS**: Configure Termii for SMS notifications
4. **External APIs**: Integrate Copart/IAAI broker API
5. **Vehicle History**: Add Carfax/NMVTIS API keys

## Production Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Getting Help

- **Issues**: Create an issue on GitHub
- **Email**: support@autobridge.ng
- **Documentation**: Check the main README.md

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:seed          # Seed sample data
npm run db:studio        # Open database GUI

# Code Quality
npm run lint             # Run ESLint
npx tsc --noEmit        # Type check
```

---

Happy coding! 🚀

