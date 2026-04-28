import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicleLookups } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId as string;

    // Fetch the lookup
    const [lookup] = await db
      .select()
      .from(vehicleLookups)
      .where(and(eq(vehicleLookups.id, id), eq(vehicleLookups.userId, userId)))
      .limit(1);

    if (!lookup) {
      return NextResponse.json({ success: false, error: 'Lookup not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lookup });
  } catch (error) {
    console.error('Error fetching lookup:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch lookup' }, { status: 500 });
  }
}
