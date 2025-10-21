# Quick Start - MVP with Web Scraping

## Get AutoBridge Running in 30 Minutes

This guide will get your MVP up and running with web scraping for vehicle data.

---

## Step 1: Install Dependencies (5 min)

```bash
cd /Users/AlphaFox/Downloads/AI\ Projects/autobridge

# Install cheerio for scraping
npm install

# This installs cheerio which is already added to package.json
```

**What was installed:**
- `cheerio` - HTML parsing for scraping
- `@types/cheerio` - TypeScript definitions

---

## Step 2: Run Database Migration (3 min)

```bash
# Generate migration for external bid tracking
npm run db:generate

# Apply migration
npm run db:migrate
```

**What this does:**
- Adds `externalBidId`, `externalSource`, `externalStatus`, `lastSyncedAt` to bids table
- Allows tracking manual bid placements on Copart

---

## Step 3: Test the Scraper (2 min)

```bash
# Quick test
npm run scraper:test
```

**Expected output:**
```
✅ Scraper working! Found 5 vehicles
```

**If it fails:**
- Copart may have updated their site
- You may be rate limited
- Network issue

**Don't worry!** You can update the HTML selectors later.

---

## Step 4: Sync First Vehicles (10 min)

```bash
# Run manual sync
npm run scraper:sync
```

**Expected output:**
```
🔄 Starting vehicle sync from Copart...
📊 Scraping Toyota vehicles...
Found 50 Toyota vehicles
  ✓ Added: 2018 Toyota Camry
  ✓ Added: 2019 Toyota Corolla
  ...
✅ Sync complete!
  - New vehicles: 120
  - Errors: 2
```

**This will:**
- Scrape popular makes (Toyota, Honda, Lexus, etc.)
- Add ~100-200 vehicles to your database
- Take 5-10 minutes

---

## Step 5: Check Your Database (2 min)

```bash
# Open database studio
npm run db:studio
```

- Open http://localhost:4983 in your browser
- Click on `vehicles` table
- You should see 100+ vehicles!

---

## Step 6: Start Development Server (1 min)

```bash
# Start Next.js
npm run dev
```

- Open http://localhost:3000
- Browse vehicles - they're real scraped data!
- Try the search/filter

---

## Step 7: Set Up Auto-Sync (5 min)

### Option A: Using Cron (macOS/Linux)

```bash
# Edit crontab
crontab -e

# Add this line (runs every 30 minutes)
*/30 * * * * cd /Users/AlphaFox/Downloads/AI\ Projects/autobridge && npm run scraper:sync >> /tmp/autobridge-sync.log 2>&1
```

### Option B: Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'autobridge-web',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production'
    }
  }, {
    name: 'autobridge-sync',
    script: 'npm',
    args: 'run scraper:sync',
    cron_restart: '*/30 * * * *',
    autorestart: false
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## How to Use MVP (Daily Workflow)

### As Admin:

#### Morning Routine (10 min):
1. Check if scraper ran successfully
2. Review new vehicles in database
3. Check pending bids at `/admin/bids` (you'll build this)

#### When User Places Bid:
1. User selects vehicle and enters max bid
2. System sends you email/notification
3. You log into Copart.com manually
4. Place bid on their behalf
5. Note Copart's bid ID
6. Mark as "placed" in your system

#### After Auction:
1. Check Copart for results
2. Update bid status (won/lost)
3. System auto-notifies user
4. Process payment if won

---

## Testing the Full Flow

### Test Bid Workflow:

1. **Create test user:**
```bash
# In your browser console or API tool
POST http://localhost:3000/api/auth/register
Body: {
  "email": "test@example.com",
  "password": "test123",
  "firstName": "Test",
  "lastName": "User",
  "phone": "+2348012345678"
}
```

2. **Login:**
```bash
POST http://localhost:3000/api/auth/login
Body: {
  "email": "test@example.com",
  "password": "test123"
}
# Save the token
```

3. **Browse vehicles:**
- Go to http://localhost:3000/vehicles
- You should see scraped vehicles

4. **Place bid:**
```bash
POST http://localhost:3000/api/bids
Headers: { Authorization: "Bearer YOUR_TOKEN" }
Body: {
  "vehicleId": "vehicle-id-from-database",
  "maxBidAmount": 5000
}
```

5. **Check pending bids:**
- Build admin dashboard at `/admin/bids`
- Or query database directly

---

## Important Notes

### ⚠️ Scraping Limitations:

1. **Cannot automate bidding** - You must place bids manually on Copart
2. **Rate limited** - Don't run sync more than every 30 minutes
3. **Breaks when site changes** - You'll need to update selectors
4. **No real-time data** - Data is delayed by sync interval

### ✅ What Works Great:

1. **Vehicle browsing** - Users see real cars
2. **Cost calculator** - Works with scraped data
3. **Bid collection** - Track user intent
4. **Notifications** - Alert users of results
5. **Payment processing** - Collect deposits

---

## Files You Need to Know

### Core Scraping:
- `src/lib/copart-scraper.ts` - Main scraper logic
- `src/jobs/sync-vehicles-scraper.ts` - Sync job

### Bid Workflow:
- `src/app/api/bids/route.ts` - Current bid API
- `src/app/api/bids/scraper-workflow.ts` - MVP workflow example

### To Build Next:
- `src/app/admin/bids/page.tsx` - Admin dashboard for pending bids
- `src/app/api/bids/[id]/placed/route.ts` - Mark bid as placed endpoint

---

## Common Commands

```bash
# Development
npm run dev                  # Start dev server
npm run db:studio           # View database

# Scraping
npm run scraper:test        # Test if scraper works
npm run scraper:sync        # Manual vehicle sync

# Database
npm run db:generate         # Generate migrations
npm run db:migrate          # Apply migrations
npm run db:seed             # Seed test data

# Production
npm run build               # Build for production
npm start                   # Start production server
```

---

## Troubleshooting

### "Scraper finds 0 vehicles"

**Fix:**
1. Visit https://www.copart.com in browser
2. Right-click → Inspect → View HTML structure
3. Update selectors in `src/lib/copart-scraper.ts` (lines 184-220)
4. Re-run `npm run scraper:sync`

### "Rate limited / 429 error"

**Fix:**
1. Wait 30-60 minutes
2. Reduce sync frequency
3. Consider using proxy service

### "Cannot place bids"

**Remember:** Scraping CANNOT place bids automatically.
**Solution:** Manual workflow described above.

---

## Next Steps

### This Week:
- [x] Set up scraping
- [x] Sync first vehicles
- [ ] Build admin bid dashboard
- [ ] Test full bid workflow
- [ ] Invite 5 beta users

### Next 2 Weeks:
- [ ] Process 10-20 real bids
- [ ] Get first successful deliveries
- [ ] Collect user feedback
- [ ] Refine process

### Month 2-3:
- [ ] Scale to 50+ users
- [ ] Process 50+ bids/month
- [ ] Migrate to AutoData Direct API
- [ ] Automate bidding

---

## Cost to Run MVP

### First Month:
- Infrastructure: $0-50 (free tier or cheap VPS)
- Domain: $10-20
- Test bids: $200-500
- **Total: ~$210-570**

### Monthly:
- Infrastructure: $50-100
- Your time: 1-2 hours/day
- **Total: ~$50-100/month**

### Revenue Potential:
- 10 successful auctions @ $250 commission each = $2,500/month
- Break-even after 1-2 successful deliveries!

---

## Migration Path

When you hit 50+ monthly bids:

### Switch to AutoData Direct:

1. Sign up: https://www.autodatadirect.com
2. Get API credentials
3. Replace in code:
```typescript
// From:
import { createCopartScraper } from '@/lib/copart-scraper';

// To:
import { createCopartClient } from '@/lib/copart-api';
```
4. Enable auto-bidding
5. Scale to 200+ users!

---

## Success Checklist

### Today:
- [ ] Dependencies installed
- [ ] Database migrated
- [ ] Scraper tested
- [ ] First vehicles synced
- [ ] Dev server running

### This Week:
- [ ] 100+ vehicles in database
- [ ] Auto-sync configured
- [ ] Admin dashboard built
- [ ] First test bid placed

### Month 1:
- [ ] 10+ active users
- [ ] 20+ bid intents
- [ ] 5+ successful wins
- [ ] $5,000+ transaction volume

---

## Support

### Need Help?
- **Documentation:** Read `MVP_SCRAPER_GUIDE.md` for detailed guide
- **Code examples:** Check files in `src/lib/` and `src/jobs/`
- **Issues:** Check logs and error messages
- **Updates:** When Copart changes, update `copart-scraper.ts` selectors

---

## You're Ready!

Your MVP is set up and ready to validate the market. Remember:

✅ **MVP Goal:** Test demand, not build perfect product
✅ **Timeline:** 2-4 weeks to first revenue
✅ **Migration:** Plan to move to API at 50 bids/month
✅ **Focus:** Ship fast, learn, iterate!

**Now go get those first users!** 🚀

```bash
# Start your journey:
npm run dev
```

Open http://localhost:3000 and see your platform in action!

Good luck! 🎉
