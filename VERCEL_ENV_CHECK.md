# ✅ Vercel Environment Variables Checklist

## Required Environment Variables for Production

Go to: https://vercel.com/damitimo/autobridge/settings/environment-variables

Make sure ALL of these are set:

### 1. DATABASE_URL
```
postgresql://postgres.gzjdjdjwevpzbvqrbjxw:eww1d7UZztz89idS@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```
- ✅ Apply to: **Production, Preview, Development**

### 2. JWT_SECRET
```
your-super-secret-jwt-key-change-in-production-12345
```
- ✅ Apply to: **Production, Preview, Development**

### 3. JWT_EXPIRES_IN
```
7d
```
- ✅ Apply to: **Production, Preview, Development**

### 4. NEXT_PUBLIC_APP_URL
```
https://autobridge-xi.vercel.app
```
- ✅ Apply to: **Production, Preview, Development**

### 5. PAYSTACK_SECRET_KEY
```
sk_test_6235114bab6dd589fad722ed54ac0b9aab791b0c
```
- ✅ Apply to: **Production, Preview, Development**

### 6. NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
```
pk_test_571df9af1045d520165e00cae39a5f09d27ef08f
```
- ✅ Apply to: **Production, Preview, Development**

---

## After Adding Variables

1. Click **"Save"** on each variable
2. Go to: https://vercel.com/damitimo/autobridge
3. Click **"Deployments"** tab
4. Find the latest deployment
5. Click the **"..."** menu → **"Redeploy"**
6. Check the box: **"Use existing Build Cache"** is UNCHECKED
7. Click **"Redeploy"**

---

## Test After Redeployment

1. Go to: https://autobridge-xi.vercel.app/auth/register
2. Try creating a new account
3. Should work without "Internal Server Error" ✅

---

## Your Supabase Database Status

✅ **Active and Working**
- Migrations: ✅ Already applied
- Seed data: ✅ Already exists (test user: emeka@example.com)
- Vehicles: ✅ Already seeded

You can login with:
- Email: emeka@example.com
- Password: password123
