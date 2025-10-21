# Copart Integration Guide for AutoBridge

## Overview

This guide explains how to integrate with Copart to scrape vehicle data and place proxy bids for your clients.

## ⚠️ Critical Decision: Choose Your Integration Method

### Option 1: Official Copart Dealer API ⭐ **RECOMMENDED**

**Best for:** Professional, scalable operations

**Requirements:**
1. Register as a Copart dealer
2. Complete business verification
3. Maintain deposit account ($5,000-$10,000)
4. Pay registration fees (~$200-500)
5. Get API credentials

**Process:**
1. Visit: https://www.copart.com/becomeAMember/
2. Select "Dealer" account type
3. Submit business documents:
   - Business registration
   - Tax ID (EIN)
   - Banking information
   - Professional references
4. Wait 2-4 weeks for approval
5. Request API access from account manager

**Advantages:**
- ✅ Legal and compliant
- ✅ Official support
- ✅ Real-time data access
- ✅ Bidding capabilities
- ✅ Won't get banned
- ✅ Professional relationship
- ✅ Lower transaction fees

**Disadvantages:**
- ❌ Higher initial cost
- ❌ Longer setup time
- ❌ Requires business registration
- ❌ Ongoing deposit requirements

**Cost Structure:**
- Registration: $200-500 one-time
- Deposit: $5,000-10,000 (refundable)
- Annual membership: $0-200
- API access: Usually included
- Per-transaction fees: 2-5% of sale price

---

### Option 2: Data Broker Services ⭐ **EASIEST FOR STARTUPS**

**Best for:** Quick launch, MVP testing, lower initial investment

**Recommended Providers:**

#### A) AutoData Direct
- **Website:** https://www.autodatadirect.com
- **Cost:** $200-500/month + per-transaction fees
- **Features:**
  - Real-time Copart + IAAI inventory feeds
  - Vehicle history reports integration
  - Image hosting
  - Bidding API
  - Customer support
  - No dealer license needed

#### B) DataOne Software
- **Website:** https://www.dataone.com
- **Cost:** $300-1,000/month based on volume
- **Features:**
  - Enterprise-grade API
  - Multi-source data (Copart, IAAI, Manheim)
  - Advanced filtering
  - Webhook notifications
  - Dedicated account manager

#### C) ACV Auctions API
- **Website:** https://www.acvauctions.com
- **Cost:** Custom pricing
- **Features:**
  - Live auction data
  - Mobile-optimized
  - Condition reports
  - Direct bidding integration

**Setup Process:**
1. Sign up on provider website
2. Pay subscription fee
3. Get API credentials (usually instant)
4. Integrate API into your platform
5. Start pulling data (same day)

**Advantages:**
- ✅ No dealer license needed
- ✅ Quick setup (1-3 days)
- ✅ Lower upfront costs
- ✅ Professional support
- ✅ Legal data access
- ✅ Multiple data sources

**Disadvantages:**
- ❌ Monthly subscription costs
- ❌ Per-transaction fees
- ❌ Less control over data
- ❌ Dependent on third party

---

### Option 3: Web Scraping ❌ **NOT RECOMMENDED**

**Only consider if:**
- You're building a proof-of-concept
- You can't afford official access yet
- You understand the legal risks

**Legal Risks:**
- ⚠️ Violates Copart Terms of Service
- ⚠️ Potential lawsuit for unauthorized access
- ⚠️ IP theft concerns
- ⚠️ CFAA (Computer Fraud and Abuse Act) violations
- ⚠️ Can't bid via scraping (requires authentication)

**Technical Challenges:**
- Anti-bot measures (Cloudflare, CAPTCHAs)
- Rate limiting
- IP bans
- Constant maintenance
- Unreliable data
- Can't access authenticated features

**If you still want to try (for education only):**
- See: `src/lib/copart-scraper-example.ts`
- Use rotating proxies
- Implement CAPTCHA solving
- Rate limit your requests
- Expect to be blocked

**Transition Plan:**
Start with scraping → Move to broker → Eventually get dealer license

---

## Implementation Steps

### Step 1: Choose Your Integration Method

Based on your situation:

| Situation | Recommended Option |
|-----------|-------------------|
| Funded startup, serious business | Official Copart API |
| MVP/testing phase, limited budget | Data Broker |
| Just exploring/learning | Scraping (educational only) |
| Need quick launch | Data Broker |
| Long-term scalability | Official Copart API |

### Step 2: Update Environment Variables

Add to your `.env` file:

#### For Official Copart API:
```env
# Copart Official API
COPART_API_KEY=your_api_key_here
COPART_USERNAME=your_dealer_username
COPART_PASSWORD=your_dealer_password
COPART_DEALER_NUMBER=your_dealer_number
```

#### For Data Broker (AutoData Direct example):
```env
# AutoData Direct API
AUTODATA_API_KEY=your_api_key_here
AUTODATA_ACCOUNT_ID=your_account_id
AUTODATA_WEBHOOK_SECRET=your_webhook_secret
```

### Step 3: Implement Data Sync

Create a scheduled job to sync vehicle data:

```typescript
// src/jobs/sync-vehicles.ts
import { createCopartClient } from '@/lib/copart-api';
import { db } from '@/db';
import { vehicles } from '@/db/schema';

export async function syncCopartVehicles() {
  const copartClient = createCopartClient();
  
  // Fetch new vehicles
  const result = await copartClient.searchVehicles({
    limit: 100,
    page: 1,
  });
  
  // Insert/update in database
  for (const vehicle of result.vehicles) {
    await db.insert(vehicles).values({
      auctionSource: 'copart',
      lotNumber: vehicle.lotNumber,
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      // ... other fields
    }).onConflictDoUpdate({
      target: vehicles.lotNumber,
      set: {
        currentBid: vehicle.pricing.currentBid,
        updatedAt: new Date(),
      },
    });
  }
  
  console.log(`Synced ${result.vehicles.length} vehicles`);
}

// Run every 15 minutes
setInterval(syncCopartVehicles, 15 * 60 * 1000);
```

### Step 4: Implement Proxy Bidding

Update your bid API to place real bids on Copart:

```typescript
// src/app/api/bids/route.ts (updated)
import { createCopartClient } from '@/lib/copart-api';

export async function POST(request: NextRequest) {
  // ... your existing auth and validation code ...
  
  // Place bid on Copart
  const copartClient = createCopartClient();
  
  try {
    const copartBid = await copartClient.placeBid({
      lotNumber: vehicle.lotNumber,
      maxBidAmount: validated.maxBidAmount,
      clientId: user.id,
      proxyBid: true,
    });
    
    // Save to your database with external reference
    const [newBid] = await db.insert(bids).values({
      userId: user.id,
      vehicleId: validated.vehicleId,
      maxBidAmount: validated.maxBidAmount.toString(),
      status: 'pending',
      externalBidId: copartBid.bidId, // Track Copart's bid ID
    }).returning();
    
    // Send notification
    await sendNotification({
      userId: user.id,
      type: 'bid_placed',
      title: 'Bid Placed Successfully',
      message: `Your bid of $${validated.maxBidAmount} has been placed on Copart`,
      channels: ['in_app', 'email', 'sms'],
    });
    
    return NextResponse.json({ success: true, data: newBid });
    
  } catch (error) {
    console.error('Failed to place bid on Copart:', error);
    return NextResponse.json(
      { error: 'Failed to place bid with auction house' },
      { status: 500 }
    );
  }
}
```

### Step 5: Implement Bid Status Monitoring

Create a background job to check bid results:

```typescript
// src/jobs/check-bid-results.ts
import { createCopartClient } from '@/lib/copart-api';
import { db } from '@/db';
import { bids } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function checkBidResults() {
  const copartClient = createCopartClient();
  
  // Get all pending bids
  const pendingBids = await db
    .select()
    .from(bids)
    .where(eq(bids.status, 'pending'));
  
  for (const bid of pendingBids) {
    if (!bid.externalBidId) continue;
    
    // Check status with Copart
    const status = await copartClient.getBidStatus(bid.externalBidId);
    
    if (status.status !== bid.status) {
      // Update status
      await db.update(bids)
        .set({ 
          status: status.status,
          finalBidAmount: status.currentBid.toString(),
        })
        .where(eq(bids.id, bid.id));
      
      // Notify user
      if (status.status === 'won') {
        await sendNotification({
          userId: bid.userId,
          type: 'auction_won',
          title: 'Congratulations! You Won!',
          message: `You won the auction for $${status.currentBid}`,
          channels: ['in_app', 'email', 'sms', 'whatsapp'],
        });
      } else if (status.status === 'lost') {
        await sendNotification({
          userId: bid.userId,
          type: 'auction_lost',
          title: 'Auction Ended',
          message: `Unfortunately, you didn't win this auction`,
          channels: ['in_app', 'email'],
        });
      }
    }
  }
}

// Run every 5 minutes
setInterval(checkBidResults, 5 * 60 * 1000);
```

## Cost Analysis

### Official Copart API
**Initial Setup:** $5,200-10,700
- Registration: $200-500
- Deposit: $5,000-10,000
- First month API: $0-200

**Monthly Operating:** $0-200
- Membership: $0-200
- API: Usually included

**Per Transaction:** 2-5% of sale price

**Break-even:** ~50-100 transactions

### Data Broker
**Initial Setup:** $200-1,000
- First month subscription

**Monthly Operating:** $200-1,000
- Subscription: $200-1,000
- Per-vehicle fees: $0.10-1.00 each

**Per Transaction:** 1-3% or flat fee

**Break-even:** Immediate (no large deposit)

## Recommendation for AutoBridge

Based on your project status:

### Phase 1 (NOW - MVP): Use Data Broker
- ✅ Quick setup (1-3 days)
- ✅ Lower initial cost
- ✅ Test your business model
- ✅ Start generating revenue
- ✅ Learn the business

**Recommended:** Start with **AutoData Direct**
- Cost: ~$300/month
- Full Copart + IAAI access
- Bidding capabilities
- Good support

### Phase 2 (3-6 months): Get Dealer License
Once you have:
- 50+ active users
- Proven business model
- $10,000+ revenue/month
- Stable operations

**Transition to:** Official Copart dealer account
- Lower per-transaction costs
- More control
- Better margins
- Professional credibility

## Next Steps

1. **Decide on integration method** (I recommend data broker for now)
2. **Sign up with AutoData Direct** or similar
3. **Get API credentials** (same day)
4. **Implement vehicle sync** (use `src/lib/copart-api.ts` as template)
5. **Test with sample data** (1-2 days)
6. **Go live with real bidding** (after testing)

## Legal Considerations

### Must Have:
- ✅ Terms of Service stating you're a bidding broker
- ✅ Client agreements for proxy bidding
- ✅ KYC verification (already implemented)
- ✅ Payment processing (already planned)
- ✅ Insurance for high-value transactions
- ✅ Nigerian business registration

### Compliance:
- Follow Copart/IAAI terms strictly
- Maintain client funds in escrow
- Document all transactions
- Tax reporting for international transactions
- GDPR/data protection compliance

## Support Resources

**Copart:**
- Dealer support: +1-972-391-5000
- Website: https://www.copart.com/becomeAMember/

**AutoData Direct:**
- Sales: info@autodatadirect.com
- Support: support@autodatadirect.com

**DataOne Software:**
- Sales: +1-877-780-4660
- Website: https://www.dataone.com

## Questions?

If you need help with implementation:
1. Review the example code in `src/lib/copart-api.ts`
2. Check Copart's official documentation
3. Contact your chosen data provider's support
4. Consider hiring a developer with auction API experience

---

**Last Updated:** January 2025
**Status:** Ready for implementation
**Next Milestone:** Choose integration method and get API credentials
