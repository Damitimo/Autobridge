import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, params.id))
      .limit(1);
    
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: vehicle,
    });
    
  } catch (error) {
    console.error('Vehicle fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
