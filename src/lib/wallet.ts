/**
 * Wallet Management Functions
 * 
 * Handles wallet creation, balance checking, deposit locking/unlocking,
 * and transaction recording for the 10% bid deposit system.
 */

import { db } from '@/db';
import { wallets, walletTransactions, bids, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface BidEligibility {
  eligible: boolean;
  availableBalance: number;
  requiredDeposit: number;
  shortfall: number;
}

/**
 * Create wallet for new user (auto-called on signup)
 */
export async function createWallet(userId: string) {
  const [wallet] = await db.insert(wallets).values({
    userId,
    totalBalance: '0',
    availableBalance: '0',
    lockedBalance: '0',
    currency: 'USD',
  }).returning();
  
  console.log(`✅ Wallet created for user ${userId}`);
  return wallet;
}

/**
 * Get user's wallet
 */
export async function getWallet(userId: string) {
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);
  
  return wallet;
}

/**
 * Check if user can place a bid (10% rule)
 */
export async function checkBidEligibility(
  userId: string, 
  bidAmountUSD: number
): Promise<BidEligibility> {
  const wallet = await getWallet(userId);
  
  if (!wallet) {
    return {
      eligible: false,
      availableBalance: 0,
      requiredDeposit: bidAmountUSD * 0.10,
      shortfall: bidAmountUSD * 0.10,
    };
  }
  
  const requiredDeposit = bidAmountUSD * 0.10; // 10%
  const available = parseFloat(wallet.availableBalance);
  
  return {
    eligible: available >= requiredDeposit,
    availableBalance: available,
    requiredDeposit,
    shortfall: Math.max(0, requiredDeposit - available),
  };
}

/**
 * Add funds to wallet
 */
export async function addFunds(
  userId: string,
  amountUSD: number,
  currency: 'USD' | 'NGN',
  amountOriginal: number,
  exchangeRate?: number,
  reference?: string
) {
  const wallet = await getWallet(userId);
  if (!wallet) throw new Error('Wallet not found');
  
  const balanceBefore = parseFloat(wallet.totalBalance);
  const balanceAfter = balanceBefore + amountUSD;
  
  // Update wallet
  await db.update(wallets)
    .set({
      totalBalance: balanceAfter.toString(),
      availableBalance: sql`${wallets.availableBalance} + ${amountUSD}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.id, wallet.id));
  
  // Record transaction
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    userId,
    type: 'deposit',
    amount: amountOriginal.toString(),
    currency,
    usdAmount: amountUSD.toString(),
    exchangeRate: exchangeRate?.toString(),
    balanceBefore: balanceBefore.toString(),
    balanceAfter: balanceAfter.toString(),
    status: 'completed',
    description: `Wallet funding via ${currency}`,
    metadata: { reference },
  });
  
  console.log(`💰 Added $${amountUSD} to wallet for user ${userId}`);
}

/**
 * Lock deposit for bid (10%)
 */
export async function lockDepositForBid(
  userId: string,
  bidId: string,
  bidAmount: number
) {
  const wallet = await getWallet(userId);
  if (!wallet) throw new Error('Wallet not found');
  
  const depositAmount = bidAmount * 0.10;
  const available = parseFloat(wallet.availableBalance);
  
  if (available < depositAmount) {
    throw new Error(`Insufficient balance. Need $${depositAmount}, have $${available}`);
  }
  
  // Update wallet
  await db.update(wallets)
    .set({
      availableBalance: sql`${wallets.availableBalance} - ${depositAmount}`,
      lockedBalance: sql`${wallets.lockedBalance} + ${depositAmount}`,
      updatedAt: new Date(),
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
    balanceBefore: available.toString(),
    balanceAfter: (available - depositAmount).toString(),
    bidId,
    status: 'completed',
    description: `Deposit locked for bid (10% of $${bidAmount})`,
  });
  
  // Update bid
  await db.update(bids)
    .set({
      depositAmount: depositAmount.toString(),
      depositLocked: true,
    })
    .where(eq(bids.id, bidId));
  
  console.log(`🔒 Locked $${depositAmount} deposit for bid ${bidId}`);
}

/**
 * Unlock deposit (bid lost)
 */
export async function unlockDepositForLostBid(bidId: string) {
  const [bid] = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);
  if (!bid || !bid.depositAmount) return;
  
  const wallet = await getWallet(bid.userId);
  if (!wallet) return;
  
  const depositAmount = parseFloat(bid.depositAmount);
  
  // Release locked deposit
  await db.update(wallets)
    .set({
      availableBalance: sql`${wallets.availableBalance} + ${depositAmount}`,
      lockedBalance: sql`${wallets.lockedBalance} - ${depositAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.id, wallet.id));
  
  // Record transaction
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    userId: bid.userId,
    type: 'bid_unlock',
    amount: depositAmount.toString(),
    currency: 'USD',
    usdAmount: depositAmount.toString(),
    balanceBefore: wallet.availableBalance,
    balanceAfter: (parseFloat(wallet.availableBalance) + depositAmount).toString(),
    bidId,
    status: 'completed',
    description: 'Deposit released - bid not won',
  });
  
  // Update bid
  await db.update(bids)
    .set({ depositLocked: false })
    .where(eq(bids.id, bidId));
  
  console.log(`🔓 Unlocked $${depositAmount} deposit for lost bid ${bidId}`);
}

/**
 * Forfeit deposit (didn't pay for won car)
 */
export async function forfeitDeposit(bidId: string) {
  const [bid] = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);
  if (!bid || !bid.depositAmount) return;
  
  const wallet = await getWallet(bid.userId);
  if (!wallet) return;
  
  const depositAmount = parseFloat(bid.depositAmount);
  
  // Deduct locked deposit permanently
  await db.update(wallets)
    .set({
      totalBalance: sql`${wallets.totalBalance} - ${depositAmount}`,
      lockedBalance: sql`${wallets.lockedBalance} - ${depositAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.id, wallet.id));
  
  // Record transaction
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    userId: bid.userId,
    type: 'bid_forfeit',
    amount: depositAmount.toString(),
    currency: 'USD',
    usdAmount: depositAmount.toString(),
    balanceBefore: wallet.totalBalance,
    balanceAfter: (parseFloat(wallet.totalBalance) - depositAmount).toString(),
    bidId,
    status: 'completed',
    description: 'Deposit forfeited - payment not completed',
  });
  
  // Update bid
  await db.update(bids)
    .set({
      depositLocked: false,
      depositForfeitedAt: new Date(),
    })
    .where(eq(bids.id, bidId));
  
  console.log(`❌ Forfeited $${depositAmount} deposit for bid ${bidId}`);
}

/**
 * Get wallet balance summary
 */
export async function getWalletBalance(userId: string) {
  const wallet = await getWallet(userId);
  if (!wallet) {
    return {
      total: 0,
      available: 0,
      locked: 0,
    };
  }
  
  return {
    total: parseFloat(wallet.totalBalance),
    available: parseFloat(wallet.availableBalance),
    locked: parseFloat(wallet.lockedBalance),
  };
}

/**
 * Get recent wallet transactions
 */
export async function getWalletTransactions(userId: string, limit = 20) {
  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(sql`${walletTransactions.createdAt} DESC`)
    .limit(limit);
  
  return transactions;
}
