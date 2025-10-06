import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles, costEstimates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateCost } from '@/lib/cost-calculator';
import { getUserFromToken } from '@/lib/auth';
import { z } from 'zod';

const estimateSchema = z.object({
  destinationPort: z.enum(['Lagos', 'Port Harcourt']).default('Lagos'),
  destinationCity: z.string().default('Lagos'),
  shippingMethod: z.enum(['roro', 'container_shared', 'container_exclusive']).default('roro'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get vehicle
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
    
    // Parse request body
    const body = await request.json();
    const validated = estimateSchema.parse(body);
    
    // Get user (optional - can estimate without login)
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await getUserFromToken(token);
      userId = user?.id;
    }
    
    // Calculate cost
    const vehicleCondition: 'running' | 'non_running' = 
      vehicle.condition === 'non_running' ? 'non_running' : 'running';
    
    const estimate = await calculateCost({
      vehiclePrice: parseFloat(vehicle.currentBid || '0'),
      auctionSource: vehicle.auctionSource,
      auctionLocationState: vehicle.auctionLocationState || 'CA',
      destinationPort: validated.destinationPort,
      destinationCity: validated.destinationCity,
      shippingMethod: validated.shippingMethod,
      vehicleCondition,
      vehicleYear: vehicle.year,
      hasKeys: vehicle.hasKeys || false,
    });
    
    // Save estimate to database
    const [savedEstimate] = await db
      .insert(costEstimates)
      .values({
        ...(userId ? { userId } : {}),
        vehicleId: vehicle.id,
        vehiclePrice: vehicle.currentBid || '0',
        auctionLocation: vehicle.auctionLocation,
        destinationPort: validated.destinationPort,
        shippingMethod: validated.shippingMethod,
        vehicleCondition: vehicleCondition,
        auctionBuyerFee: estimate.auctionBuyerFee.toString(),
        usTowing: estimate.usTowing.toString(),
        usStorage: estimate.usStorage.toString(),
        shippingCost: estimate.shippingCost.toString(),
        insurance: estimate.insurance.toString(),
        nigerianCustomsDuty: estimate.nigerianCustomsDuty.toString(),
        nigerianPort: estimate.nigerianPortCharges.toString(),
        clearingAgent: estimate.clearingAgentFee.toString(),
        localTransport: estimate.localTransport.toString(),
        platformFee: estimate.platformFee.toString(),
        totalCostUSD: estimate.totalUSD.toString(),
        totalCostNGN: estimate.totalNGN.toString(),
        exchangeRate: estimate.exchangeRate.toString(),
        estimatedNigerianResaleValue: estimate.estimatedNigerianResaleValue.toString(),
        estimatedProfitMargin: estimate.estimatedProfitMargin.toString(),
        estimatedDaysToDelivery: estimate.estimatedDaysToDelivery,
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      data: estimate,
      estimateId: savedEstimate.id,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Cost estimation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
