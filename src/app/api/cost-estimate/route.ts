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

// Shipping ports coordinates (lat, lng)
const SHIPPING_PORTS = {
  houston: { lat: 29.7604, lng: -95.3698, name: 'Houston, TX' },
  newark: { lat: 40.7357, lng: -74.1724, name: 'Newark, NJ' },
  savannah: { lat: 32.0809, lng: -81.0912, name: 'Savannah, GA' },
  losAngeles: { lat: 33.7405, lng: -118.2608, name: 'Los Angeles, CA' },
};

// State coordinates (approximate center/major auction city)
const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'AL': { lat: 32.3792, lng: -86.3077 },  // Montgomery
  'AK': { lat: 61.2181, lng: -149.9003 }, // Anchorage
  'AZ': { lat: 33.4484, lng: -112.0740 }, // Phoenix
  'AR': { lat: 34.7465, lng: -92.2896 },  // Little Rock
  'CA': { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  'CO': { lat: 39.7392, lng: -104.9903 }, // Denver
  'CT': { lat: 41.7658, lng: -72.6734 },  // Hartford
  'DE': { lat: 39.1582, lng: -75.5244 },  // Dover
  'FL': { lat: 28.5383, lng: -81.3792 },  // Orlando
  'GA': { lat: 33.7490, lng: -84.3880 },  // Atlanta
  'HI': { lat: 21.3069, lng: -157.8583 }, // Honolulu
  'ID': { lat: 43.6150, lng: -116.2023 }, // Boise
  'IL': { lat: 41.8781, lng: -87.6298 },  // Chicago
  'IN': { lat: 39.7684, lng: -86.1581 },  // Indianapolis
  'IA': { lat: 41.5868, lng: -93.6250 },  // Des Moines
  'KS': { lat: 39.0473, lng: -95.6752 },  // Topeka
  'KY': { lat: 38.2009, lng: -84.8733 },  // Lexington
  'LA': { lat: 30.4515, lng: -91.1871 },  // Baton Rouge
  'ME': { lat: 44.3106, lng: -69.7795 },  // Augusta
  'MD': { lat: 39.2904, lng: -76.6122 },  // Baltimore
  'MA': { lat: 42.3601, lng: -71.0589 },  // Boston
  'MI': { lat: 42.3314, lng: -83.0458 },  // Detroit
  'MN': { lat: 44.9778, lng: -93.2650 },  // Minneapolis
  'MS': { lat: 32.2988, lng: -90.1848 },  // Jackson
  'MO': { lat: 38.6270, lng: -90.1994 },  // St. Louis
  'MT': { lat: 46.8797, lng: -110.3626 }, // Helena
  'NE': { lat: 41.2565, lng: -95.9345 },  // Omaha
  'NV': { lat: 36.1699, lng: -115.1398 }, // Las Vegas
  'NH': { lat: 43.2081, lng: -71.5376 },  // Concord
  'NJ': { lat: 40.0583, lng: -74.4057 },  // Trenton
  'NM': { lat: 35.0844, lng: -106.6504 }, // Albuquerque
  'NY': { lat: 40.7128, lng: -74.0060 },  // New York
  'NC': { lat: 35.7796, lng: -78.6382 },  // Raleigh
  'ND': { lat: 46.8083, lng: -100.7837 }, // Bismarck
  'OH': { lat: 39.9612, lng: -82.9988 },  // Columbus
  'OK': { lat: 35.4676, lng: -97.5164 },  // Oklahoma City
  'OR': { lat: 45.5152, lng: -122.6784 }, // Portland
  'PA': { lat: 39.9526, lng: -75.1652 },  // Philadelphia
  'RI': { lat: 41.8240, lng: -71.4128 },  // Providence
  'SC': { lat: 34.0007, lng: -81.0348 },  // Columbia
  'SD': { lat: 43.5460, lng: -96.7313 },  // Sioux Falls
  'TN': { lat: 36.1627, lng: -86.7816 },  // Nashville
  'TX': { lat: 29.7604, lng: -95.3698 },  // Houston
  'UT': { lat: 40.7608, lng: -111.8910 }, // Salt Lake City
  'VT': { lat: 44.2601, lng: -72.5754 },  // Montpelier
  'VA': { lat: 37.5407, lng: -77.4360 },  // Richmond
  'WA': { lat: 47.6062, lng: -122.3321 }, // Seattle
  'WV': { lat: 38.3498, lng: -81.6326 },  // Charleston
  'WI': { lat: 43.0389, lng: -87.9065 },  // Milwaukee
  'WY': { lat: 41.1400, lng: -104.8202 }, // Cheyenne
};

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest shipping port and return distance
function findNearestPort(state: string): { port: string; distance: number } {
  const stateCoords = STATE_COORDINATES[state] || STATE_COORDINATES['TX'];

  let nearestPort = 'houston';
  let minDistance = Infinity;

  for (const [portName, portCoords] of Object.entries(SHIPPING_PORTS)) {
    const distance = calculateDistance(
      stateCoords.lat, stateCoords.lng,
      portCoords.lat, portCoords.lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestPort = portName;
    }
  }

  // Add 20% for actual road distance vs straight-line (Haversine)
  const roadDistance = minDistance * 1.20;

  return { port: nearestPort, distance: roadDistance };
}

// Tiered towing rate structure (from Excel: 2025/26 rates)
function getTowingRatePerMile(distance: number): number {
  if (distance <= 100) return 1.50;
  if (distance <= 500) return 1.20;
  if (distance <= 1000) return 0.95;
  if (distance <= 1500) return 0.80;
  if (distance <= 2000) return 0.70;
  return 0.60; // 2000+ miles
}

// Calculate towing cost based on distance with tiered rates
function calculateTowingCost(state: string, isRunning: boolean, hasKeys: boolean): number {
  const { distance } = findNearestPort(state);

  // Calculate cost using tiered rates
  let cost = 0;
  let remainingDistance = distance;

  // 0-100 miles at $1.50/mi
  if (remainingDistance > 0) {
    const miles = Math.min(remainingDistance, 100);
    cost += miles * 1.50;
    remainingDistance -= miles;
  }

  // 101-500 miles at $1.20/mi
  if (remainingDistance > 0) {
    const miles = Math.min(remainingDistance, 400); // 500 - 100 = 400
    cost += miles * 1.20;
    remainingDistance -= miles;
  }

  // 501-1000 miles at $0.95/mi
  if (remainingDistance > 0) {
    const miles = Math.min(remainingDistance, 500); // 1000 - 500 = 500
    cost += miles * 0.95;
    remainingDistance -= miles;
  }

  // 1001-1500 miles at $0.80/mi
  if (remainingDistance > 0) {
    const miles = Math.min(remainingDistance, 500); // 1500 - 1000 = 500
    cost += miles * 0.80;
    remainingDistance -= miles;
  }

  // 1501-2000 miles at $0.70/mi
  if (remainingDistance > 0) {
    const miles = Math.min(remainingDistance, 500); // 2000 - 1500 = 500
    cost += miles * 0.70;
    remainingDistance -= miles;
  }

  // 2000+ miles at $0.60/mi
  if (remainingDistance > 0) {
    cost += remainingDistance * 0.60;
  }

  // Apply minimum charge of $150
  cost = Math.max(cost, 150);

  // Add fees for non-running vehicles and missing keys
  if (!isRunning) cost += 75;
  if (!hasKeys) cost += 50;

  return Math.round(cost);
}

// Get towing details for display
function getTowingDetails(state: string): { port: string; distance: number; portName: string } {
  const { port, distance } = findNearestPort(state);
  const portName = SHIPPING_PORTS[port as keyof typeof SHIPPING_PORTS]?.name || 'Houston, TX';
  return { port, distance: Math.round(distance), portName };
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
    const towingDetails = getTowingDetails(stateCode);
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
        description: `Ground transport from ${stateCode} to ${towingDetails.portName} (~${towingDetails.distance} mi)`
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
