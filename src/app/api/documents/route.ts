import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicleHistoryReports } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch user's VIN reports (documents)
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

    // Fetch all VIN reports for this user, ordered by most recent first
    const reports = await db
      .select()
      .from(vehicleHistoryReports)
      .where(eq(vehicleHistoryReports.userId, user.id))
      .orderBy(desc(vehicleHistoryReports.createdAt));

    return NextResponse.json({
      success: true,
      documents: reports.map(report => ({
        id: report.id,
        type: 'vin_report',
        vin: report.vin,
        provider: report.provider,
        vehicleInfo: {
          year: report.reportData?.year,
          make: report.reportData?.make,
          model: report.reportData?.model,
        },
        summary: {
          totalLoss: report.totalLoss,
          odometerRollback: report.odometerRollback,
          accidentCount: report.accidentCount,
          ownerCount: report.ownerCount,
          odometer: report.odometer,
          titleBrands: report.titleBrands,
        },
        reportUrl: report.reportUrl,
        reportPdf: report.reportPdf,
        chargedAmount: report.chargedAmount,
        purchasedAt: report.createdAt,
      })),
    });

  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
