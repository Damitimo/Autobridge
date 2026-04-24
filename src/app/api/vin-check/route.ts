import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicleHistoryReports, wallets, walletTransactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// VIN Check pricing (in USD)
const VIN_CHECK_PRICE = 15; // What we charge the user
const VIN_CHECK_COST = 8;   // Our cost from provider (for reference)

// VIN Check provider configuration
const VIN_PROVIDER = process.env.VIN_CHECK_PROVIDER || 'vinaudit';
const VIN_API_KEY = process.env.VIN_CHECK_API_KEY || '';

interface VinReportData {
  vin: string;
  year?: number;
  make?: string;
  model?: string;
  titleBrands?: string[];
  totalLoss?: boolean;
  odometer?: number;
  odometerRollback?: boolean;
  accidentCount?: number;
  ownerCount?: number;
  theftRecords?: number;
  recallCount?: number;
  serviceHistory?: { date: string; description: string; odometer?: number }[];
  titleHistory?: { date: string; state: string; title: string }[];
  saleHistory?: { date: string; price?: number; location?: string }[];
  reportUrl?: string;
  reportPdf?: string;
}

// Fetch VIN report from provider
async function fetchVinReport(vin: string): Promise<VinReportData | null> {
  // TODO: Replace with actual API call to your chosen provider
  // For now, return mock data for testing

  if (!VIN_API_KEY) {
    console.log('VIN_CHECK_API_KEY not configured, returning mock data');
    // Return mock data for testing
    return {
      vin,
      year: 2020,
      make: 'Toyota',
      model: 'Camry',
      titleBrands: [],
      totalLoss: false,
      odometer: 45000,
      odometerRollback: false,
      accidentCount: 0,
      ownerCount: 2,
      theftRecords: 0,
      recallCount: 1,
      titleHistory: [
        { date: '2020-03-15', state: 'CA', title: 'Clean Title' },
        { date: '2022-08-20', state: 'TX', title: 'Clean Title' },
      ],
      reportUrl: `https://example.com/report/${vin}`,
    };
  }

  // VinAudit API example
  if (VIN_PROVIDER === 'vinaudit') {
    try {
      const response = await fetch(
        `https://api.vinaudit.com/v1/report?key=${VIN_API_KEY}&vin=${vin}&format=json`,
        { method: 'GET' }
      );

      if (!response.ok) {
        console.error('VinAudit API error:', response.status);
        return null;
      }

      const data = await response.json();

      return {
        vin,
        year: data.attributes?.year,
        make: data.attributes?.make,
        model: data.attributes?.model,
        titleBrands: data.title_brands || [],
        totalLoss: data.salvage || false,
        odometer: data.odometer?.value,
        odometerRollback: data.odometer?.rollback || false,
        accidentCount: data.accidents?.count || 0,
        ownerCount: data.owners?.count,
        theftRecords: data.theft?.count || 0,
        recallCount: data.recalls?.count || 0,
        titleHistory: data.title_history || [],
        saleHistory: data.sale_history || [],
        reportUrl: data.report_url,
        reportPdf: data.report_pdf,
      };
    } catch (error) {
      console.error('VinAudit API error:', error);
      return null;
    }
  }

  return null;
}

// Check if user already has a report for this VIN
async function getExistingReport(userId: string, vin: string) {
  const [existing] = await db
    .select()
    .from(vehicleHistoryReports)
    .where(
      and(
        eq(vehicleHistoryReports.userId, userId),
        eq(vehicleHistoryReports.vin, vin.toUpperCase())
      )
    )
    .limit(1);

  return existing;
}

// POST - Purchase a VIN check
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { vin } = body;

    if (!vin || vin.length !== 17) {
      return NextResponse.json(
        { error: 'Valid 17-character VIN is required' },
        { status: 400 }
      );
    }

    const normalizedVin = vin.toUpperCase();

    // Check if user already has a report for this VIN
    const existingReport = await getExistingReport(user.id, normalizedVin);
    if (existingReport) {
      return NextResponse.json({
        success: true,
        report: existingReport,
        cached: true,
        message: 'You already purchased this report',
      });
    }

    // Get user's wallet
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id))
      .limit(1);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found. Please contact support.' },
        { status: 400 }
      );
    }

    const availableBalance = parseFloat(wallet.availableBalance);

    if (availableBalance < VIN_CHECK_PRICE) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          required: VIN_CHECK_PRICE,
          available: availableBalance,
          message: `You need $${VIN_CHECK_PRICE} for a VIN check. Your available balance is $${availableBalance.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    // Fetch VIN report from provider
    const reportData = await fetchVinReport(normalizedVin);

    if (!reportData) {
      return NextResponse.json(
        { error: 'Unable to fetch VIN report. Please try again.' },
        { status: 500 }
      );
    }

    // Deduct from wallet
    const newAvailableBalance = availableBalance - VIN_CHECK_PRICE;
    const newTotalBalance = parseFloat(wallet.totalBalance) - VIN_CHECK_PRICE;

    await db
      .update(wallets)
      .set({
        availableBalance: newAvailableBalance.toFixed(2),
        totalBalance: newTotalBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    // Create wallet transaction
    const [walletTx] = await db
      .insert(walletTransactions)
      .values({
        walletId: wallet.id,
        userId: user.id,
        type: 'vin_check',
        amount: VIN_CHECK_PRICE.toFixed(2),
        currency: 'USD',
        usdAmount: VIN_CHECK_PRICE.toFixed(2),
        balanceBefore: availableBalance.toFixed(2),
        balanceAfter: newAvailableBalance.toFixed(2),
        status: 'completed',
        description: `VIN Check for ${normalizedVin}`,
        metadata: { vin: normalizedVin, provider: VIN_PROVIDER },
      })
      .returning();

    // Save report to database
    const [report] = await db
      .insert(vehicleHistoryReports)
      .values({
        userId: user.id,
        vin: normalizedVin,
        provider: VIN_PROVIDER,
        reportData: reportData,
        reportUrl: reportData.reportUrl,
        reportPdf: reportData.reportPdf,
        costUsd: VIN_CHECK_COST.toFixed(2),
        chargedAmount: VIN_CHECK_PRICE.toFixed(2),
        titleBrands: reportData.titleBrands || [],
        totalLoss: reportData.totalLoss || false,
        odometer: reportData.odometer,
        odometerRollback: reportData.odometerRollback || false,
        accidentCount: reportData.accidentCount || 0,
        ownerCount: reportData.ownerCount,
        walletTransactionId: walletTx.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      report,
      charged: VIN_CHECK_PRICE,
      newBalance: newAvailableBalance,
      message: `VIN check completed. $${VIN_CHECK_PRICE} has been deducted from your wallet.`,
    });

  } catch (error) {
    console.error('VIN check error:', error);
    return NextResponse.json(
      { error: 'Failed to process VIN check' },
      { status: 500 }
    );
  }
}

// GET - Check price and if user already has report
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin');

    if (!vin) {
      return NextResponse.json({ price: VIN_CHECK_PRICE });
    }

    const normalizedVin = vin.toUpperCase();

    // Check if user already has this report
    const existingReport = await getExistingReport(user.id, normalizedVin);

    // Get wallet balance
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id))
      .limit(1);

    return NextResponse.json({
      price: VIN_CHECK_PRICE,
      hasReport: !!existingReport,
      report: existingReport || null,
      walletBalance: wallet ? parseFloat(wallet.availableBalance) : 0,
      canAfford: wallet ? parseFloat(wallet.availableBalance) >= VIN_CHECK_PRICE : false,
    });

  } catch (error) {
    console.error('VIN check status error:', error);
    return NextResponse.json(
      { error: 'Failed to check VIN status' },
      { status: 500 }
    );
  }
}
