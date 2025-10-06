import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles } from '@/db/schema';
import { and, eq, gte, lte, ilike, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

const searchSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  yearMin: z.number().optional(),
  yearMax: z.number().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  condition: z.array(z.string()).optional(),
  titleStatus: z.array(z.string()).optional(),
  auctionSource: z.enum(['copart', 'iaai']).optional(),
  state: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
  sortBy: z.enum(['price', 'year', 'auction_date']).default('auction_date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      make: searchParams.get('make') || undefined,
      model: searchParams.get('model') || undefined,
      yearMin: searchParams.get('yearMin') ? parseInt(searchParams.get('yearMin')!) : undefined,
      yearMax: searchParams.get('yearMax') ? parseInt(searchParams.get('yearMax')!) : undefined,
      priceMin: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined,
      condition: searchParams.get('condition')?.split(','),
      titleStatus: searchParams.get('titleStatus')?.split(','),
      auctionSource: searchParams.get('auctionSource') as 'copart' | 'iaai' | undefined,
      state: searchParams.get('state') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') || 'auction_date') as 'price' | 'year' | 'auction_date',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };
    
    const validated = searchSchema.parse(params);
    
    // Build where conditions
    const conditions = [];
    
    if (validated.make) {
      conditions.push(ilike(vehicles.make, `%${validated.make}%`));
    }
    
    if (validated.model) {
      conditions.push(ilike(vehicles.model, `%${validated.model}%`));
    }
    
    if (validated.yearMin) {
      conditions.push(gte(vehicles.year, validated.yearMin));
    }
    
    if (validated.yearMax) {
      conditions.push(lte(vehicles.year, validated.yearMax));
    }
    
    if (validated.priceMin) {
      conditions.push(gte(vehicles.currentBid, validated.priceMin.toString()));
    }
    
    if (validated.priceMax) {
      conditions.push(lte(vehicles.currentBid, validated.priceMax.toString()));
    }
    
    if (validated.auctionSource) {
      conditions.push(eq(vehicles.auctionSource, validated.auctionSource));
    }
    
    if (validated.state) {
      conditions.push(eq(vehicles.auctionLocationState, validated.state));
    }
    
    // Calculate offset
    const offset = (validated.page - 1) * validated.limit;
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    // Get vehicles
    const results = await db
      .select()
      .from(vehicles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(validated.limit)
      .offset(offset)
      .orderBy(
        validated.sortOrder === 'desc'
          ? sql`${vehicles[validated.sortBy === 'price' ? 'currentBid' : validated.sortBy === 'auction_date' ? 'auctionDate' : 'year']} DESC`
          : sql`${vehicles[validated.sortBy === 'price' ? 'currentBid' : validated.sortBy === 'auction_date' ? 'auctionDate' : 'year']} ASC`
      );
    
    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total: count,
        totalPages: Math.ceil(count / validated.limit),
      },
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Vehicle search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
