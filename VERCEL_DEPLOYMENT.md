# 🚀 Deploy AutoBridge to Vercel

## Step 1: Push to GitHub (Already Done ✅)

Your code is already on GitHub at: https://github.com/Damitimo/Autobridge.git

---

## Step 2: Import to Vercel

1. **Go to:** https://vercel.com/new
2. **Import Git Repository**
3. **Select:** `Damitimo/Autobridge`
4. **Click:** Import

---

## Step 3: Configure Environment Variables

Before deploying, add these environment variables in Vercel:

### **In Vercel Dashboard → Settings → Environment Variables**

Add each of these:

```bash
# Database - Supabase
DATABASE_URL=postgresql://postgres.gzjdjdjwevpzbvqrbjxw:eww1d7UZztz89idS@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=7d

# Application
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app

# Payment Gateways - Paystack
PAYSTACK_SECRET_KEY=sk_test_6235114bab6dd589fad722ed54ac0b9aab791b0c
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_571df9af1045d520165e00cae39a5f09d27ef08f
```

**Important:**
- Add all variables to **Production**, **Preview**, and **Development** environments
- Update `NEXT_PUBLIC_APP_URL` after deployment with your actual Vercel URL

---

## Step 4: Deploy

1. **Click:** "Deploy" button
2. **Wait:** 2-3 minutes for build to complete
3. **Get your URL:** `https://your-app-name.vercel.app`

---

## Step 5: Update Webhook URLs

After deployment, update these:

### **1. Paystack Webhook:**
- Go to: https://dashboard.paystack.com/settings/webhooks
- Add webhook URL: `https://your-app-name.vercel.app/api/webhooks/paystack`

### **2. Environment Variable:**
- Go back to Vercel → Settings → Environment Variables
- Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
- Redeploy

---

## 🎯 Quick Deployment Checklist

- [ ] Code pushed to GitHub ✅
- [ ] Import repository to Vercel
- [ ] Add all environment variables
- [ ] Deploy
- [ ] Update `NEXT_PUBLIC_APP_URL` with actual URL
- [ ] Update Paystack webhook URL
- [ ] Test the live site

---

## 🔧 Troubleshooting

### **Build Fails:**
- Check environment variables are set correctly
- Verify DATABASE_URL is accessible from Vercel

### **Database Connection Fails:**
- Make sure you're using the Supabase **pooler** connection string
- Verify Supabase project is not paused

### **Paystack Not Working:**
- Update webhook URL in Paystack dashboard
- Check `NEXT_PUBLIC_APP_URL` matches your Vercel domain

---

## 📝 After Deployment

Your app will be live at: `https://your-app-name.vercel.app`

Test:
1. Register new user
2. Apply coupon code: `NOKINGS`
3. Browse vehicles
4. Fund wallet
5. Place bid

---

## 🎊 Production Ready!

Once deployed, your AutoBridge platform will be live and accessible worldwide!
