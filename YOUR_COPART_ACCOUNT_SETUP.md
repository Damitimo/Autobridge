# Setting Up with Your Existing Copart Account

## You Already Have Copart Login - Great! 🎉

Since you have an existing Copart account with login credentials, you're ahead of the game. Here's how to set up AutoBridge with your account.

---

## Step 1: Determine Your Account Type

### Check Your Account Level:

1. **Log into:** https://www.copart.com
2. **Go to:** Account Settings / Profile
3. **Look for:**
   - Account Type (Member, Dealer, Broker)
   - Dealer Number (if applicable)
   - API Access Status

---

## Account Type Scenarios:

### Scenario A: You Have a Dealer/Broker Account ✅ **BEST CASE**

**What This Means:**
- ✅ You can bid on behalf of clients
- ✅ You have a dealer number
- ✅ You can request API access
- ✅ You're authorized for proxy bidding
- ✅ **Perfect for AutoBridge!**

**Next Steps:**
1. Request API credentials from Copart
2. Get your API key and dealer number
3. Use credentials directly in AutoBridge
4. Skip data broker entirely (save $300/month!)

**Contact for API Access:**
- Call your account manager
- Or call: +1-972-391-5000
- Email: membersupport@copart.com
- Say: "I need API access for my dealer account to integrate with my platform"

---

### Scenario B: You Have a Member Account ⚠️ **NEEDS UPGRADE**

**What This Means:**
- ⚠️ Personal bidding only (can't bid for clients)
- ⚠️ No dealer number
- ⚠️ Limited API access
- ⚠️ Not authorized for proxy bidding

**Options:**
1. **Upgrade to Dealer Account** (Recommended)
   - Apply at: https://www.copart.com/becomeAMember/
   - Costs: $200-500 registration + $5,000 deposit
   - Takes: 2-4 weeks
   
2. **Partner with Licensed Broker** (Faster)
   - Find a licensed broker who will let you use their API
   - Cost: Revenue sharing agreement
   - Takes: 1-2 weeks to set up

3. **Use Data Broker** (Easiest)
   - AutoData Direct or similar
   - Cost: $300/month
   - Takes: 1-3 days

---

### Scenario C: You Have Basic/Browse Account ❌ **CANNOT BID**

**What This Means:**
- ❌ Cannot place bids at all
- ❌ View-only access
- ❌ No API access possible

**You Must:**
- Upgrade to Member or Dealer account
- Or use data broker service

---

## Step 2: Request API Access (For Dealer Accounts)

### How to Get API Credentials:

#### Method 1: Contact Your Account Manager
```
Email Template:
---
Subject: API Access Request for AutoBridge Integration

Hi [Account Manager Name],

I have a dealer account with Copart (Dealer #: [YOUR_NUMBER]) and I'm 
building an integration platform for my clients in Nigeria called AutoBridge.

I need API access to:
1. Pull vehicle inventory data
2. Place proxy bids on behalf of verified clients
3. Monitor bid status and results

Please provide:
- API Key
- API Endpoint URLs
- API Documentation
- Rate limits and usage guidelines

My account details:
- Username: [YOUR_USERNAME]
- Dealer Number: [YOUR_DEALER_NUMBER]
- Email: [YOUR_EMAIL]
- Phone: [YOUR_PHONE]

Thank you!
```

#### Method 2: Call Copart Support
- Phone: +1-972-391-5000
- Ask for: "API Access for Dealer Account"
- Have ready: Dealer number, business info
- Timeline: Usually 1-5 business days

---

## Step 3: Get Your API Credentials

### What You'll Receive:

```
COPART_API_KEY=abc123xyz789...
COPART_API_URL=https://api.copart.com/v1
COPART_DEALER_NUMBER=12345
COPART_USERNAME=your_username
COPART_PASSWORD=your_password
```

### Add to Your .env File:

```bash
# Your Existing Copart Credentials
COPART_API_KEY=your_actual_api_key_here
COPART_API_URL=https://api.copart.com/v1
COPART_DEALER_NUMBER=your_dealer_number
COPART_USERNAME=your_copart_username
COPART_PASSWORD=your_copart_password

# Authentication Method (check with Copart)
COPART_AUTH_TYPE=oauth2  # or 'basic' or 'token'
```

---

## Step 4: Understand Copart's API Structure

### Common API Patterns:

Copart's API typically follows one of these patterns:

#### Pattern A: OAuth 2.0 (Most Common)
```typescript
// Step 1: Get access token
POST https://api.copart.com/oauth/token
Body: {
  grant_type: "password",
  username: "your_username",
  password: "your_password",
  client_id: "your_dealer_number"
}

Response: {
  access_token: "eyJhbGc...",
  expires_in: 3600
}

// Step 2: Use token for requests
GET https://api.copart.com/v1/vehicles
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
```

#### Pattern B: API Key + Basic Auth
```typescript
GET https://api.copart.com/v1/vehicles
Headers: {
  X-API-Key: "your_api_key",
  Authorization: "Basic base64(username:password)"
}
```

---

## Step 5: Customize the API Client

### Update `src/lib/copart-api.ts` with Your Credentials:

The file I created is a template. Here's how to customize it:

```typescript
// src/lib/copart-api.ts

export function createCopartClient(): CopartAPIClient {
  const credentials: CopartCredentials = {
    // Use your actual API details from Copart
    apiKey: process.env.COPART_API_KEY || '',
    username: process.env.COPART_USERNAME || '',
    password: process.env.COPART_PASSWORD || '',
    dealerNumber: process.env.COPART_DEALER_NUMBER || '',
  };

  // Update baseUrl with the actual URL from Copart
  // They'll give you this when you get API access
  const apiUrl = process.env.COPART_API_URL || 'https://api.copart.com/v1';

  return new CopartAPIClient(credentials, apiUrl);
}
```

---

## Step 6: Test Your Connection

### Create a Test Script:

```typescript
// scripts/test-copart-connection.ts

import { createCopartClient } from '@/lib/copart-api';

async function testConnection() {
  console.log('Testing Copart API connection...');
  
  try {
    const client = createCopartClient();
    
    // Test 1: Authentication
    console.log('1. Testing authentication...');
    await client.authenticate();
    console.log('✅ Authentication successful!');
    
    // Test 2: Search vehicles
    console.log('2. Testing vehicle search...');
    const results = await client.searchVehicles({
      make: 'Toyota',
      limit: 5
    });
    console.log(`✅ Found ${results.vehicles.length} vehicles`);
    
    // Test 3: Get vehicle details
    if (results.vehicles.length > 0) {
      console.log('3. Testing vehicle details...');
      const vehicle = await client.getVehicleDetails(
        results.vehicles[0].lotNumber
      );
      console.log(`✅ Got details for ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    }
    
    console.log('\n🎉 All tests passed! Your API is working.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check your .env file has correct credentials');
    console.log('2. Verify API key is activated');
    console.log('3. Check if your IP is whitelisted');
    console.log('4. Contact Copart support if issues persist');
  }
}

testConnection();
```

### Run Test:
```bash
npx tsx scripts/test-copart-connection.ts
```

---

## Step 7: Verify Your Account Permissions

### What You Need Enabled:

✅ **Required Permissions:**
- Read vehicle inventory
- Search and filter vehicles
- View vehicle details and images
- Place bids (proxy bidding)
- Check bid status
- Get auction results

⚠️ **Check with Copart:**
- Are there rate limits? (typical: 100-1000 requests/hour)
- Can you bid internationally for clients?
- What are transaction fees?
- Do you need separate approval for each client?

---

## Step 8: Implement Proxy Bidding

### Key Question: Does Copart Require Client Registration?

**Check if Copart needs:**
- Client information before bidding
- Separate approval for each client
- Client deposit accounts
- KYC documentation per client

### Two Approaches:

#### Approach A: You Bid Under Your Account (Simpler)
```typescript
// You place all bids using YOUR dealer account
// Clients pay you, you pay Copart
// You handle all the paperwork

await copartClient.placeBid({
  lotNumber: vehicle.lotNumber,
  bidAmount: clientMaxBid,
  // Internal reference for your records
  internalReference: `CLIENT-${user.id}`,
  dealerNote: `Bidding for AutoBridge client`,
});
```

#### Approach B: Register Clients with Copart (More Complex)
```typescript
// Register each client first
await copartClient.registerSubAccount({
  dealerNumber: yourDealerNumber,
  clientInfo: {
    name: user.fullName,
    email: user.email,
    country: 'Nigeria',
    // ... KYC details
  }
});

// Then bid under their sub-account
await copartClient.placeBid({
  lotNumber: vehicle.lotNumber,
  bidAmount: clientMaxBid,
  subAccountId: client.copartSubAccountId,
});
```

**Ask your Copart account manager which approach they support.**

---

## Step 9: Handle Common Issues

### Issue 1: "API Key Invalid"
**Solutions:**
- Key might not be activated yet (wait 24-48 hours)
- Check for typos in .env file
- Verify key hasn't expired
- Contact Copart to reissue

### Issue 2: "Unauthorized to Bid"
**Solutions:**
- Verify dealer account is active
- Check deposit balance is sufficient
- Ensure account standing is good
- May need additional paperwork for international clients

### Issue 3: "Rate Limit Exceeded"
**Solutions:**
- Implement caching for vehicle data
- Batch requests instead of individual calls
- Request higher rate limits from Copart
- Use webhooks instead of polling

### Issue 4: "Geo-restricted Access"
**Solutions:**
- Your server IP may need whitelisting
- Copart may block certain countries
- Use VPN or proxy if needed
- Contact Copart for IP whitelist approval

---

## Cost Savings with Your Account

### With Your Dealer Account (vs Data Broker):

| Item | Data Broker | Your Account | Savings |
|------|-------------|--------------|---------|
| Monthly Fee | $300 | $0 | $300/month |
| API Access | Included | $0-100 | $0-200/month |
| Transaction Fee | 2-3% | 0-1% | 1-2% per sale |
| **Annual Savings** | **$3,600+** | **-** | **$3,600-5,000** |

**With 100 transactions/year at $5,000 average:**
- Broker total: $3,600 + $10,000 (2%) = $13,600
- Your account: $0 + $5,000 (1%) = $5,000
- **SAVINGS: $8,600/year!** 💰

---

## Next Steps for YOU

### Immediate Actions (Today):

1. **Check Your Account Type**
   - Log into Copart
   - Find your dealer number (if any)
   - Check account permissions

2. **Request API Access**
   - Contact account manager or call +1-972-391-5000
   - Use email template above
   - Ask about proxy bidding for Nigerian clients

3. **While Waiting for API Access**
   - Review `src/lib/copart-api.ts`
   - Set up payment processing (Paystack)
   - Complete KYC verification system
   - Test other parts of AutoBridge

### When You Get API Credentials (1-5 days):

4. **Add credentials to `.env`**
5. **Run connection test**
6. **Fetch first 100 vehicles**
7. **Test placing a small bid ($100)**
8. **Monitor bid result**
9. **Launch to first clients** 🚀

---

## Questions to Ask Copart Support

When you contact them, ask:

1. **API Access:**
   - "How do I get API credentials for my dealer account?"
   - "What's the API documentation URL?"
   - "What are the rate limits?"

2. **Proxy Bidding:**
   - "Can I place bids on behalf of international clients?"
   - "Do I need to register each client with Copart?"
   - "What KYC documents do you need for Nigerian clients?"

3. **Technical:**
   - "What authentication method does the API use?"
   - "Do you provide webhooks for bid results?"
   - "Can I get real-time updates or do I need to poll?"

4. **Fees:**
   - "What are transaction fees for my dealer level?"
   - "Are there additional fees for API usage?"
   - "Any fees for international client bidding?"

---

## Support Contacts

**Copart Main:**
- Phone: +1-972-391-5000
- Email: membersupport@copart.com
- Hours: Monday-Friday, 8am-5pm CST

**Copart API Support:**
- Email: apisupport@copart.com (if available)
- Or ask for technical support through main line

**Your Account Manager:**
- Check your Copart account for assigned manager
- Usually listed in account settings
- Direct line is fastest for API requests

---

## Timeline Estimate

With your existing account:

- **Today:** Contact Copart for API access
- **Day 1-5:** Wait for API credentials
- **Day 6:** Test connection and pull data
- **Day 7-10:** Implement bidding integration
- **Day 11-14:** Test with real bids (small amounts)
- **Day 15-21:** Launch to first 10 users
- **Week 4+:** Scale up!

**Total: 2-4 weeks to full production** 🚀

---

## You're In a Great Position! 

Having an existing Copart account means:
- ✅ Faster setup (no broker needed)
- ✅ Lower costs ($300+/month saved)
- ✅ Direct relationship with Copart
- ✅ Better control and margins
- ✅ Professional credibility

**Just need to get those API credentials and you're good to go!**

---

## Need Help?

If you run into issues:
1. Check this document first
2. Review `src/lib/copart-api.ts` code
3. Contact Copart support
4. Test with small amounts first
5. Document everything for debugging

**Good luck! You're very close to launching! 🎉**
