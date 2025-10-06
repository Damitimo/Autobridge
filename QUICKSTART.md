# 🚀 AutoBridge QuickStart

Get AutoBridge running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check PostgreSQL (need 14+)
psql --version

# Check Redis
redis-cli --version
```

Don't have them? See [SETUP.md](./SETUP.md) for installation links.

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Create database
createdb autobridge

# 3. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 4. Run migrations
npm run db:migrate

# 5. Seed with sample data
npm run db:seed

# 6. Start Redis (separate terminal)
redis-server

# 7. Start dev server
npm run dev
```

## 🎉 You're Ready!

Open http://localhost:3000 in your browser.

### Test Account
- **Email**: emeka@example.com
- **Password**: password123

## What to Try

1. **Browse Vehicles** - See 5 sample vehicles
2. **View Details** - Click any vehicle to see cost calculator
3. **Login** - Use test account above
4. **Dashboard** - View your sample shipment
5. **Track Shipment** - See real-time tracking timeline

## Common Issues

**Port 3000 already in use?**
```bash
PORT=3001 npm run dev
```

**Database error?**
```bash
# Make sure PostgreSQL is running
pg_isready

# Recreate database
dropdb autobridge && createdb autobridge
npm run db:migrate
npm run db:seed
```

**Redis error?**
```bash
# Start Redis
redis-server
```

## File Structure

```
autobridge/
├── src/
│   ├── app/              # Pages & API routes
│   ├── components/       # React components
│   ├── db/              # Database (schema, migrations)
│   └── lib/             # Business logic & utilities
├── .env.example         # Environment template
├── README.md            # Full documentation
├── SETUP.md            # Detailed setup guide
└── PROJECT_STATUS.md   # What's built & what's next
```

## Need Help?

- **Setup Issues**: See [SETUP.md](./SETUP.md)
- **What's Built**: See [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- **Full Docs**: See [README.md](./README.md)

## Next Steps

1. ✅ Explore the demo with seed data
2. 📖 Read PROJECT_STATUS.md to understand what's complete
3. 🔧 Configure external APIs (payment, notifications)
4. 🚀 Start customizing for your needs!

---

**Happy coding! 🎊**

