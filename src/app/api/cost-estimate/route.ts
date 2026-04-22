import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Exchange rate (in production, fetch from API)
const NGN_RATE = 1550;

// Auction buyer fee calculation (varies by price)
function calculateAuctionBuyerFee(price: number, source: 'copart' | 'iaai'): number {
  if (source === 'copart') {
    if (price <= 99.99) return 25;
    if (price <= 499.99) return 60;
    if (price <= 999.99) return 100;
    if (price <= 1499.99) return 125;
    if (price <= 1999.99) return 150;
    if (price <= 3999.99) return 200;
    if (price <= 5999.99) return 250;
    if (price <= 7999.99) return 300;
    if (price <= 9999.99) return 400;
    if (price <= 14999.99) return 525;
    if (price <= 19999.99) return 650;
    if (price <= 24999.99) return 750;
    return Math.round(price * 0.03); // 3% for higher values
  } else {
    if (price <= 100) return 30;
    if (price <= 500) return 70;
    if (price <= 1000) return 110;
    if (price <= 1500) return 140;
    if (price <= 2000) return 170;
    if (price <= 4000) return 220;
    if (price <= 6000) return 280;
    if (price <= 8000) return 330;
    if (price <= 10000) return 450;
    if (price <= 15000) return 575;
    if (price <= 20000) return 700;
    return Math.round(price * 0.035); // 3.5% for higher values
  }
}

// Towing cost based on state
function calculateTowingCost(state: string, isRunning: boolean, hasKeys: boolean): number {
  const baseCost: Record<string, number> = {
    'CA': 350, 'TX': 280, 'FL': 300, 'NY': 380, 'NJ': 350,
    'PA': 320, 'OH': 280, 'IL': 300, 'GA': 290, 'NC': 300,
    'MI': 290, 'AZ': 320, 'WA': 340, 'OR': 330, 'NV': 310,
    'CO': 300, 'TN': 280, 'IN': 280, 'MO': 290, 'MD': 340,
    'VA': 320, 'SC': 290, 'AL': 280, 'LA': 290, 'KY': 280,
  };

  let cost = baseCost[state] || 300;
  if (!isRunning) cost += 75;
  if (!hasKeys) cost += 50;

  return cost;
}

// Shipping cost calculation
function calculateShippingCost(
  method: 'roro' | 'container_shared' | 'container_exclusive',
  departureState: string,
): number {
  const baseRates = {
    roro: 1400,
    container_shared: 1800,
    container_exclusive: 4200,
  };

  // West coast is more expensive
  const westCoastStates = ['CA', 'WA', 'OR', 'NV', 'AZ'];
  const locationMultiplier = westCoastStates.includes(departureState) ? 1.25 : 1.0;

  return Math.round(baseRates[method] * locationMultiplier);
}

// Nigerian customs duty calculation
function calculateCustomsDuty(vehiclePrice: number, vehicleYear: number): number {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicleYear;

  // Nigeria customs: CIF value based duty
  // Levy (35%) + Duty (35%) + Surcharge (7%) + CISS (1%) + ETLS (0.5%)
  // Total effective rate varies by vehicle age
  const baseValue = vehiclePrice;

  if (vehicleAge <= 3) {
    return Math.round(baseValue * 0.70); // 70% for new vehicles
  } else if (vehicleAge <= 7) {
    return Math.round(baseValue * 0.60); // 60% for 4-7 year old
  } else if (vehicleAge <= 12) {
    return Math.round(baseValue * 0.50); // 50% for 8-12 year old
  } else {
    return Math.round(baseValue * 0.45); // 45% for older vehicles
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vehiclePrice,
      auctionSource = 'copart',
      auctionLocationState,
      vehicleYear,
      hasKeys = true,
      isRunning = true,
      shippingMethod = 'roro',
    } = body;

    if (!vehiclePrice || vehiclePrice <= 0) {
      return NextResponse.json({ error: 'Vehicle price is required' }, { status: 400 });
    }

    // Extract state code from location string
    let stateCode = 'TX'; // Default
    if (auctionLocationState) {
      // Handle formats like "TX - DALLAS" or "DALLAS, TX" or just "TX"
      const stateMatch = auctionLocationState.match(/\b([A-Z]{2})\b/);
      if (stateMatch) {
        stateCode = stateMatch[1];
      }
    }

    const year = vehicleYear || new Date().getFullYear() - 5; // Default to 5 year old vehicle

    // Calculate all cost components
    const auctionFee = calculateAuctionBuyerFee(vehiclePrice, auctionSource);
    const towingCost = calculateTowingCost(stateCode, isRunning, hasKeys);
    const shippingCost = calculateShippingCost(shippingMethod, stateCode);
    const marineCargo = Math.round(vehiclePrice * 0.015); // 1.5% marine insurance
    const customsDuty = calculateCustomsDuty(vehiclePrice, year);
    const portCharges = 250; // Terminal handling, demurrage buffer
    const clearingFee = 350; // Clearing agent fee
    const autobridgeFee = 200; // Our service fee
    const localTransport = 100; // Default Lagos delivery

    // Calculate totals
    const totalUSD = vehiclePrice + auctionFee + towingCost + shippingCost + marineCargo +
                     customsDuty + portCharges + clearingFee + autobridgeFee + localTransport;
    const totalNGN = Math.round(totalUSD * NGN_RATE);

    // Estimate delivery timeline
    const estimatedDays = 35 + (stateCode === 'CA' || stateCode === 'WA' ? 5 : 0);

    const breakdown = [
      {
        category: 'Vehicle Price',
        amount: vehiclePrice,
        description: 'Your maximum bid amount'
      },
      {
        category: 'Auction Buyer Fee',
        amount: auctionFee,
        description: `${auctionSource === 'copart' ? 'Copart' : 'IAAI'} transaction fee`
      },
      {
        category: 'Towing to US Port',
        amount: towingCost,
        description: `Ground transport from ${stateCode} to shipping port`
      },
      {
        category: 'Ocean Shipping',
        amount: shippingCost,
        description: `${shippingMethod === 'roro' ? 'Roll-on/Roll-off' : shippingMethod === 'container_shared' ? 'Shared Container' : 'Exclusive Container'} to Lagos`
      },
      {
        category: 'Marine Insurance',
        amount: marineCargo,
        description: 'Cargo insurance during transit'
      },
      {
        category: 'Nigerian Customs Duty',
        amount: customsDuty,
        description: `Import duty & levies (${year} model year)`
      },
      {
        category: 'Port Charges',
        amount: portCharges,
        description: 'Terminal handling & demurrage'
      },
      {
        category: 'Clearing Agent Fee',
        amount: clearingFee,
        description: 'Customs clearance services'
      },
      {
        category: 'AutoBridge Service Fee',
        amount: autobridgeFee,
        description: 'Bidding & coordination fee'
      },
      {
        category: 'Local Delivery (Lagos)',
        amount: localTransport,
        description: 'Port to your location'
      },
    ];

    return NextResponse.json({
      success: true,
      estimate: {
        breakdown,
        totalUSD,
        totalNGN,
        exchangeRate: NGN_RATE,
        estimatedDeliveryDays: estimatedDays,
        shippingMethod,
        disclaimer: 'This is an estimate. Final costs may vary based on actual auction price, exchange rates, and customs valuation.',
      },
    });

  } catch (error) {
    console.error('Cost estimate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
