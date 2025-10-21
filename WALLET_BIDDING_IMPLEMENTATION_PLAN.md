# Wallet & Bidding System - Implementation Plan

## Overview
Comprehensive wallet-based bidding system with deposit management, multi-currency support, and automated payment flows.

---

## Phase 1: Database Schema Updates (Week 1)

### New Tables Needed:

#### 1. `wallets` Table
```typescript
export const wallets = pgTable('wallets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  
  // Balances (stored in USD)
  totalBalance: decimal('total_balance', { precision: 12, scale: 2 }).default('0').notNull(),
  availableBalance: decimal('available_balance', { precision: 12, scale: 2 }).default('0').notNull(),
  lockedBalance: decimal('locked_balance', { precision: 12, scale: 2 }).default('0').notNull(),
  
  // Metadata
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### 2. `wallet_transactions` Table
```typescript
export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  walletId: text('wallet_id').notNull().references(() => wallets.id),
  userId: text('user_id').notNull().references(() => users.id),
  
  type: pgEnum('wallet_transaction_type', [
    'deposit',           // User adds funds
    'withdrawal',        // User withdraws
    'bid_lock',         // Deposit locked for bid (10%)
    'bid_unlock',       // Deposit released (lost bid)
    'bid_forfeit',      // Deposit forfeited (didn't pay)
    'payment',          // Payment for won car
    'towing_payment',   // Towing invoice payment
    'shipping_payment', // Shipping invoice payment
    'signup_fee',       // ₦100,000 registration
    'refund',          // Refunds
  ]),
  
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  usdAmount: decimal('usd_amount', { precision: 12, scale: 2 }).notNull(), // Always store USD equivalent
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }),
  
  // Balances after transaction
  balanceBefore: decimal('balance_before', { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }).notNull(),
  
  // References
  bidId: text('bid_id').references(() => bids.id),
  invoiceId: text('invoice_id').references(() => invoices.id),
  
  status: pgEnum('transaction_status', ['pending', 'completed', 'failed', 'reversed']),
  description: text('description'),
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### 3. `invoices` Table
```typescript
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  bidId: text('bid_id').references(() => bids.id),
  shipmentId: text('shipment_id').references(() => shipments.id),
  
  type: pgEnum('invoice_type', [
    'signup_fee',
    'car_purchase',
    'towing',
    'shipping',
    'relisting_fee',
  ]),
  
  // Amounts
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  ngnEquivalent: decimal('ngn_equivalent', { precision: 12, scale: 2 }),
  
  // Payment
  status: pgEnum('invoice_status', ['pending', 'paid', 'overdue', 'cancelled']),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  
  // Line items
  lineItems: jsonb('line_items').$type<{
    description: string;
    amount: number;
    currency: string;
  }[]>(),
  
  description: text('description'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### 4. Update `bids` Table
```typescript
// Add to existing bids table:
depositAmount: decimal('deposit_amount', { precision: 10, scale: 2 }),
depositLocked: boolean('deposit_locked').default(false),
depositForfeitedAt: timestamp('deposit_forfeited_at'),
```

#### 5. Update `users` Table
```typescript
// Add to existing users table:
signupFeePaid: boolean('signup_fee_paid').default(false),
signupFeePaidAt: timestamp('signup_fee_paid_at'),
```

---

## Phase 2: Core Wallet System (Week 1-2)

### 1. Wallet Creation (Auto on Signup)

**File:** `src/lib/wallet.ts`

```typescript
export async function createWallet(userId: string) {
  const [wallet] = await db.insert(wallets).values({
    userId,
    totalBalance: '0',
    availableBalance: '0',
    lockedBalance: '0',
    currency: 'USD',
  }).returning();
  
  return wallet;
}

export async function getWallet(userId: string) {
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);
  
  return wallet;
}

export async function checkBidEligibility(userId: string, bidAmountUSD: number) {
  const wallet = await getWallet(userId);
  const requiredDeposit = bidAmountUSD * 0.10; // 10%
  
  return {
    eligible: wallet.availableBalance >= requiredDeposit,
    availableBalance: wallet.availableBalance,
    requiredDeposit,
    shortfall: Math.max(0, requiredDeposit - wallet.availableBalance),
  };
}
```

### 2. Wallet Funding

**File:** `src/app/api/wallet/fund/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(token);
  const { amount, currency } = await request.json(); // 'NGN' or 'USD'
  
  if (currency === 'NGN') {
    // Paystack integration
    const paystackResponse = await initializePaystackPayment({
      email: user.email,
      amount: amount * 100, // Kobo
      reference: generateReference(),
      callback_url: '/api/wallet/verify-payment',
    });
    
    return NextResponse.json({
      success: true,
      authorizationUrl: paystackResponse.data.authorization_url,
    });
  }
  
  if (currency === 'USD') {
    // Generate wire transfer instructions
    return NextResponse.json({
      success: true,
      instructions: {
        bankName: 'Your US Bank',
        accountNumber: 'XXXX',
        routingNumber: 'XXXX',
        reference: `AUTOBRIDGE-${user.id}-${Date.now()}`,
        amount: amount,
      },
      message: 'Transfer pending manual verification',
    });
  }
}
```

### 3. Deposit Locking/Unlocking

**File:** `src/lib/wallet-operations.ts`

```typescript
export async function lockDepositForBid(
  userId: string, 
  bidId: string, 
  bidAmount: number
) {
  const wallet = await getWallet(userId);
  const depositAmount = bidAmount * 0.10;
  
  if (wallet.availableBalance < depositAmount) {
    throw new Error('Insufficient balance');
  }
  
  // Update wallet
  await db.update(wallets)
    .set({
      availableBalance: sql`${wallets.availableBalance} - ${depositAmount}`,
      lockedBalance: sql`${wallets.lockedBalance} + ${depositAmount}`,
    })
    .where(eq(wallets.id, wallet.id));
  
  // Record transaction
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    userId,
    type: 'bid_lock',
    amount: depositAmount.toString(),
    currency: 'USD',
    usdAmount: depositAmount.toString(),
    bidId,
    status: 'completed',
    description: `Deposit locked for bid on vehicle`,
  });
  
  // Update bid
  await db.update(bids)
    .set({
      depositAmount: depositAmount.toString(),
      depositLocked: true,
    })
    .where(eq(bids.id, bidId));
}

export async function unlockDepositForLostBid(bidId: string) {
  const bid = await getBid(bidId);
  const wallet = await getWallet(bid.userId);
  
  // Release locked deposit
  await db.update(wallets)
    .set({
      availableBalance: sql`${wallets.availableBalance} + ${bid.depositAmount}`,
      lockedBalance: sql`${wallets.lockedBalance} - ${bid.depositAmount}`,
    })
    .where(eq(wallets.id, wallet.id));
  
  // Record transaction
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    userId: bid.userId,
    type: 'bid_unlock',
    amount: bid.depositAmount,
    currency: 'USD',
    usdAmount: bid.depositAmount,
    bidId,
    status: 'completed',
    description: `Deposit released - bid not won`,
  });
}

export async function forfeitDeposit(bidId: string) {
  const bid = await getBid(bidId);
  const wallet = await getWallet(bid.userId);
  
  // Deduct locked deposit permanently
  await db.update(wallets)
    .set({
      totalBalance: sql`${wallets.totalBalance} - ${bid.depositAmount}`,
      lockedBalance: sql`${wallets.lockedBalance} - ${bid.depositAmount}`,
    })
    .where(eq(wallets.id, wallet.id));
  
  // Record transaction
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    userId: bid.userId,
    type: 'bid_forfeit',
    amount: bid.depositAmount,
    currency: 'USD',
    usdAmount: bid.depositAmount,
    bidId,
    status: 'completed',
    description: `Deposit forfeited - payment not completed`,
  });
  
  // Create relisting fee invoice
  await createRelistingFeeInvoice(bid.userId, bidId, parseFloat(bid.depositAmount));
}
```

---

## Phase 3: Enhanced Bidding Flow (Week 2-3)

### Updated Bid API

**File:** `src/app/api/bids/route.ts` (Enhanced)

```typescript
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(token);
  const { vehicleId, maxBidAmount } = await request.json();
  
  // 1. Check signup fee
  if (!user.signupFeePaid) {
    return NextResponse.json({
      error: 'Please pay ₦100,000 signup fee first',
      redirectTo: '/signup-fee',
    }, { status: 403 });
  }
  
  // 2. Check KYC
  if (user.kycStatus !== 'verified') {
    return NextResponse.json({
      error: 'KYC verification required',
    }, { status: 403 });
  }
  
  // 3. Check wallet eligibility
  const eligibility = await checkBidEligibility(user.id, maxBidAmount);
  if (!eligibility.eligible) {
    return NextResponse.json({
      error: 'Insufficient wallet balance',
      required: eligibility.requiredDeposit,
      available: eligibility.availableBalance,
      shortfall: eligibility.shortfall,
      message: `Please fund wallet with at least $${eligibility.shortfall}`,
    }, { status: 400 });
  }
  
  // 4. Create bid
  const [bid] = await db.insert(bids).values({
    userId: user.id,
    vehicleId,
    maxBidAmount: maxBidAmount.toString(),
    status: 'pending',
  }).returning();
  
  // 5. Lock deposit
  await lockDepositForBid(user.id, bid.id, maxBidAmount);
  
  // 6. Notify user
  await sendNotification({
    userId: user.id,
    type: 'bid_placed',
    title: 'Bid Placed Successfully',
    message: `Deposit of $${maxBidAmount * 0.10} locked in wallet`,
  });
  
  return NextResponse.json({
    success: true,
    bid,
    depositLocked: maxBidAmount * 0.10,
  });
}
```

---

## Phase 4: Payment & Invoice System (Week 3-4)

### 1. Signup Fee Payment

**File:** `src/app/api/payment/signup-fee/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(token);
  
  if (user.signupFeePaid) {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 });
  }
  
  // Initialize Paystack payment for ₦100,000
  const payment = await initializePaystackPayment({
    email: user.email,
    amount: 100000 * 100, // ₦100,000 in kobo
    reference: `SIGNUP-${user.id}-${Date.now()}`,
    callback_url: '/api/payment/verify-signup-fee',
  });
  
  return NextResponse.json({
    success: true,
    authorizationUrl: payment.data.authorization_url,
  });
}
```

### 2. Car Purchase Invoice Generation

**File:** `src/lib/invoice-generator.ts`

```typescript
export async function generateCarPurchaseInvoice(bidId: string) {
  const bid = await getBid(bidId);
  const vehicle = await getVehicle(bid.vehicleId);
  const wallet = await getWallet(bid.userId);
  
  const carPrice = parseFloat(bid.finalBidAmount);
  const depositApplied = parseFloat(bid.depositAmount);
  const remainingAmount = carPrice - depositApplied;
  
  const [invoice] = await db.insert(invoices).values({
    userId: bid.userId,
    bidId: bid.id,
    type: 'car_purchase',
    amount: remainingAmount.toString(),
    currency: 'USD',
    status: 'pending',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    lineItems: [
      { description: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, amount: carPrice, currency: 'USD' },
      { description: 'Deposit Applied', amount: -depositApplied, currency: 'USD' },
    ],
    description: `Payment for won auction - Lot ${vehicle.lotNumber}`,
  }).returning();
  
  // Notify user
  await sendNotification({
    userId: bid.userId,
    type: 'payment_due',
    title: 'Payment Required',
    message: `Pay $${remainingAmount} for your won vehicle within 7 days`,
  });
  
  return invoice;
}
```

### 3. Towing Invoice Generation

```typescript
export async function generateTowingInvoice(bidId: string) {
  const bid = await getBid(bidId);
  const vehicle = await getVehicle(bid.vehicleId);
  
  // Calculate towing cost based on distance
  const towingCost = calculateTowingCost(vehicle.auctionLocationState);
  
  const [invoice] = await db.insert(invoices).values({
    userId: bid.userId,
    bidId: bid.id,
    type: 'towing',
    amount: towingCost.toString(),
    currency: 'USD',
    status: 'pending',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    description: `Towing from ${vehicle.auctionLocation} to port`,
  }).returning();
  
  return invoice;
}
```

---

## Phase 5: UI Components (Week 4-5)

### 1. Wallet Dashboard

**File:** `src/app/dashboard/wallet/page.tsx`

```typescript
export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold">${wallet.totalBalance}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">${wallet.availableBalance}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Locked (Deposits)</p>
              <p className="text-2xl font-bold text-orange-600">${wallet.lockedBalance}</p>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <Button onClick={() => setShowFundModal(true)}>
              Fund Wallet
            </Button>
            <Button variant="outline">
              Transaction History
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            {/* ... transaction list */}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Fund Wallet Modal

```typescript
function FundWalletModal() {
  const [currency, setCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
              <SelectItem value="USD">US Dollar ($)</SelectItem>
            </Select>
          </div>
          
          <div>
            <Label>Amount</Label>
            <Input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={currency === 'NGN' ? '₦50,000' : '$100'}
            />
          </div>
          
          {currency === 'NGN' && (
            <p className="text-sm text-gray-600">
              ≈ ${(parseFloat(amount) / 1550).toFixed(2)} USD
            </p>
          )}
          
          <Button onClick={handleFund} className="w-full">
            {currency === 'NGN' ? 'Pay with Card' : 'Get Transfer Instructions'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Enhanced Bid Button

```typescript
function BidButton({ vehicle, user }) {
  const [wallet, setWallet] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  
  useEffect(() => {
    checkEligibility();
  }, []);
  
  const checkEligibility = async () => {
    const response = await fetch(`/api/wallet/check-eligibility?amount=${bidAmount}`);
    const data = await response.json();
    setEligibility(data);
  };
  
  if (!user.signupFeePaid) {
    return (
      <Button onClick={() => router.push('/signup-fee')}>
        Pay Signup Fee (₦100,000)
      </Button>
    );
  }
  
  if (!eligibility?.eligible) {
    return (
      <div>
        <Alert>
          <AlertTitle>Insufficient Balance</AlertTitle>
          <AlertDescription>
            Need ${eligibility?.requiredDeposit} deposit. You have ${eligibility?.availableBalance}.
            Fund wallet with at least ${eligibility?.shortfall}.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard/wallet')} className="mt-4">
          Fund Wallet
        </Button>
      </div>
    );
  }
  
  return (
    <Button onClick={handlePlaceBid}>
      Place Bid (${bidAmount})
      <span className="text-sm ml-2">
        (${(bidAmount * 0.10).toFixed(2)} deposit will be locked)
      </span>
    </Button>
  );
}
```

---

## Phase 6: Background Jobs (Week 5)

### 1. Auto-forfeit deposits for unpaid invoices

**File:** `src/jobs/forfeit-checker.ts`

```typescript
export async function checkOverdueInvoices() {
  const overdueInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.type, 'car_purchase'),
        eq(invoices.status, 'pending'),
        lt(invoices.dueDate, new Date())
      )
    );
  
  for (const invoice of overdueInvoices) {
    // Forfeit deposit
    await forfeitDeposit(invoice.bidId);
    
    // Mark invoice as cancelled
    await db.update(invoices)
      .set({ status: 'cancelled' })
      .where(eq(invoices.id, invoice.id));
    
    // Notify user
    await sendNotification({
      userId: invoice.userId,
      type: 'deposit_forfeited',
      title: 'Deposit Forfeited',
      message: 'Your deposit was forfeited due to non-payment',
    });
  }
}

// Run every hour
setInterval(checkOverdueInvoices, 60 * 60 * 1000);
```

---

## Implementation Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Database schema + Core wallet | Tables created, wallet CRUD, basic funding |
| **Week 2** | Deposit locking + Bidding | Lock/unlock logic, enhanced bid API |
| **Week 3** | Payment integration | Paystack integration, invoice generation |
| **Week 4** | Invoice system | Towing/shipping invoices, forfeit logic |
| **Week 5** | UI + Background jobs | Wallet dashboard, auto-forfeit, notifications |
| **Week 6** | Testing + Polish | End-to-end testing, edge cases |

---

## Next Immediate Steps

1. ✅ **Review this plan** - Make sure it matches your vision
2. 🔧 **Update database schema** - Add wallet, transactions, invoices tables
3. 💳 **Integrate Paystack** - Get API keys, test sandbox
4. 🎨 **Build wallet UI** - Dashboard, fund modal, transaction history
5. 🔄 **Connect to bidding** - Add eligibility checks, deposit locking

**Ready to start implementing?** Let me know which phase you want to tackle first!
