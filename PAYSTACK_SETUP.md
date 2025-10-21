# 🎉 Paystack Integration Setup Guide

## ✅ Step 1: Add Environment Variables

Create a `.env` file in the root directory (if it doesn't exist) and add:

```bash
# Copy from .env.example and update these values:

# Paystack Test Keys
PAYSTACK_SECRET_KEY=sk_test_6235114bab6dd589fad722ed54ac0b9aab791b0c
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_571df9af1045d520165e00cae39a5f09d27ef08f

# App URL (for callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Other required variables (from .env.example)
DATABASE_URL=postgresql://localhost:5432/autobridge
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
```

## 🔧 Step 2: Configure Paystack Webhook

1. **Login to Paystack Dashboard**: https://dashboard.paystack.com
2. **Go to Settings → Webhooks**
3. **Add your webhook URL**:
   ```
   http://localhost:3000/api/webhooks/paystack
   ```
   (For production, use your live domain)

4. **Copy the Webhook URL** for testing with ngrok (see below)

## 🌐 Step 3: Test with ngrok (Local Development)

Since Paystack needs a public URL for webhooks, use ngrok:

### Install ngrok:
```bash
brew install ngrok
# OR download from: https://ngrok.com/download
```

### Start ngrok tunnel:
```bash
ngrok http 3000
```

This will give you a public URL like: `https://abc123.ngrok.io`

### Update Paystack Webhook:
1. Go back to Paystack Dashboard → Settings → Webhooks
2. Update webhook URL to:
   ```
   https://abc123.ngrok.io/api/webhooks/paystack
   ```

### Update .env:
```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### Restart your dev server:
```bash
npm run dev
```

## 🧪 Step 4: Test the Integration

### Test 1: Signup Fee Payment
1. **Create a new account**: http://localhost:3000/auth/register
2. **You'll be redirected to**: `/signup-fee`
3. **Option A - Use Coupon**:
   - Enter: `NOKINGS`
   - Click "Apply"
   - Account activated! ✅

4. **Option B - Test Payment**:
   - Click "Pay ₦100,000 Now"
   - Use Paystack test card:
     ```
     Card Number: 4084 0840 8408 4081
     Expiry: 01/99
     CVV: 408
     PIN: 0000
     OTP: 123456
     ```
   - Payment succeeds
   - Account activated! ✅

### Test 2: Fund Wallet
1. **Login** (with activated account)
2. **Go to**: http://localhost:3000/dashboard/wallet
3. **Click**: "Fund Wallet"
4. **Select**: Nigerian Naira (₦)
5. **Enter**: ₦77,500 (≈ $50)
6. **Click**: "Fund Wallet (NGN)"
7. **Use test card** (same as above)
8. **Success!** Wallet balance increases

### Test 3: Place Bid with Insufficient Funds
1. **Go to**: http://localhost:3000/vehicles
2. **Click** any Mercedes
3. **Enter bid**: $5,000
4. **See**: ⚠️ Insufficient Funds
5. **Click**: "Fund Wallet" button
6. **Modal opens** on same page
7. **Fund wallet** via Paystack
8. **Place bid** successfully! ✅

## 📝 Paystack Test Cards

### Success Card:
```
Card Number: 4084 0840 8408 4081
Expiry: 01/99
CVV: 408
PIN: 0000
OTP: 123456
```

### Insufficient Funds:
```
Card Number: 5060 6666 6666 6666 6666
```

### Declined:
```
Card Number: 4084 0840 8408 4081
PIN: 1111 (wrong PIN)
```

More test cards: https://paystack.com/docs/payments/test-payments

## 🔍 Step 5: Verify Webhook Events

### Check webhook logs in Paystack:
1. Go to: Settings → Webhooks
2. Click on your webhook URL
3. View "Recent Deliveries"

### Events to watch for:
- ✅ `charge.success` - Payment successful
- ❌ `charge.failed` - Payment failed

### Local webhook testing:
Watch your terminal for logs:
```
Signup fee paid: User xyz, Amount: ₦100,000
Wallet funded: User xyz, Amount: $50.00
```

## 🚀 Step 6: Go Live (Production)

When ready to go live:

### 1. Get Live Keys:
- Login to Paystack Dashboard
- Go to: Settings → API Keys & Webhooks
- Switch to "Live" mode
- Copy Live Secret Key and Live Public Key

### 2. Update Production .env:
```bash
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
NEXT_PUBLIC_APP_URL=https://autobridge.ng
```

### 3. Update Webhook URL:
```
https://autobridge.ng/api/webhooks/paystack
```

### 4. Complete Paystack Business Verification:
- Submit KYC documents
- Verify bank account
- Set settlement account

## 📊 Integration Features

### ✅ Implemented:
- [x] Signup fee payment (₦100,000)
- [x] Coupon code support (NOKINGS)
- [x] Wallet funding (NGN via Paystack)
- [x] USD wire transfer instructions
- [x] Webhook for payment verification
- [x] Automatic balance updates
- [x] Transaction history
- [x] Deposit locking for bids
- [x] Insufficient funds detection
- [x] In-page fund wallet modal

### 💰 Payment Flows:

#### Signup Fee:
```
User → Pay ₦100,000 → Paystack → Webhook → Account Activated
```

#### Wallet Funding (NGN):
```
User → Add ₦77,500 → Paystack → Webhook → Balance: $50
```

#### Wallet Funding (USD):
```
User → Request $100 → Wire Instructions → Manual Verification → Balance: $100
```

#### Place Bid:
```
User → Bid $5,000 → Check Balance → Lock $500 → Bid Active
```

## 🛠️ Troubleshooting

### Webhook not receiving events:
1. Check ngrok is running
2. Verify webhook URL in Paystack dashboard
3. Check signature verification in webhook handler

### Payment succeeds but balance doesn't update:
1. Check webhook logs in Paystack
2. Check terminal for error messages
3. Verify database connection

### Test card not working:
1. Use exact card numbers from Paystack docs
2. Make sure you're in test mode
3. Try different browsers

## 📞 Support

**Paystack Support**: support@paystack.com
**Paystack Docs**: https://paystack.com/docs

## 🎯 Quick Test Checklist

- [ ] Environment variables added to `.env`
- [ ] Dev server restarted
- [ ] ngrok tunnel running (for webhooks)
- [ ] Webhook URL configured in Paystack
- [ ] Test coupon code: NOKINGS ✅
- [ ] Test signup fee payment ✅
- [ ] Test wallet funding ✅
- [ ] Test place bid with modal ✅
- [ ] Webhook receiving events ✅

---

**You're all set!** 🎉 Your Paystack integration is ready to process payments!
