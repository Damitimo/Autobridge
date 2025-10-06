/**
 * AI-Powered Cost Calculator for Vehicle Importation
 * Calculates total landed cost from U.S. auction to Nigeria delivery
 */

export interface CostCalculatorInput {
  vehiclePrice: number; // USD
  auctionSource: 'copart' | 'iaai';
  auctionLocationState: string;
  destinationPort: 'Lagos' | 'Port Harcourt';
  destinationCity: string;
  shippingMethod: 'roro' | 'container_shared' | 'container_exclusive';
  vehicleCondition: 'running' | 'non_running';
  vehicleYear: number;
  vehicleWeight?: number; // lbs
  hasKeys: boolean;
}

export interface CostBreakdown {
  // U.S. Costs
  vehiclePrice: number;
  auctionBuyerFee: number;
  usTowing: number;
  usStorage: number;
  
  // Shipping
  shippingCost: number;
  insurance: number;
  
  // Nigeria Costs
  nigerianCustomsDuty: number;
  nigerianPortCharges: number;
  clearingAgentFee: number;
  localTransport: number;
  estimatedRepairCosts: number;
  
  // Platform
  platformFee: number;
  
  // Totals
  totalUSD: number;
  totalNGN: number;
  exchangeRate: number;
}

export interface CostEstimateResult extends CostBreakdown {
  estimatedNigerianResaleValue: number;
  estimatedProfitMargin: number;
  estimatedDaysToDelivery: number;
  breakdown: {
    category: string;
    amount: number;
    currency: 'USD' | 'NGN';
  }[];
}

// Auction buyer fee calculation (varies by price)
function calculateAuctionBuyerFee(price: number, source: 'copart' | 'iaai'): number {
  if (source === 'copart') {
    // Copart fee structure
    if (price <= 99.99) return 25;
    if (price <= 499.99) return 60;
    if (price <= 999.99) return 100;
    if (price <= 1499.99) return 125;
    if (price <= 1999.99) return 150;
    if (price <= 3999.99) return 200;
    if (price <= 5999.99) return 250;
    if (price <= 7999.99) return 300;
    return 400;
  } else {
    // IAAI fee structure (approximate)
    if (price <= 100) return 30;
    if (price <= 500) return 70;
    if (price <= 1000) return 110;
    if (price <= 1500) return 140;
    if (price <= 2000) return 170;
    if (price <= 4000) return 220;
    if (price <= 6000) return 280;
    if (price <= 8000) return 330;
    return 450;
  }
}

// Towing cost based on location and distance
function calculateTowingCost(state: string, condition: 'running' | 'non_running'): number {
  const baseCost: Record<string, number> = {
    'CA': 200, 'TX': 180, 'FL': 190, 'NY': 220, 'NJ': 210,
    'PA': 200, 'OH': 180, 'IL': 190, 'GA': 180, 'NC': 190,
  };
  
  const cost = baseCost[state] || 200;
  const nonRunningFee = condition === 'non_running' ? 50 : 0;
  const noKeysFee = 0; // Will add if hasKeys is false
  
  return cost + nonRunningFee + noKeysFee;
}

// Shipping cost calculation
function calculateShippingCost(
  method: 'roro' | 'container_shared' | 'container_exclusive',
  departureState: string,
  destinationPort: string
): number {
  const baseRates = {
    roro: 1200,
    container_shared: 1500,
    container_exclusive: 3500,
  };
  
  // East coast is cheaper than west coast
  const locationMultiplier = ['CA', 'WA', 'OR'].includes(departureState) ? 1.2 : 1.0;
  
  // Port Harcourt is slightly more expensive
  const portMultiplier = destinationPort === 'Port Harcourt' ? 1.1 : 1.0;
  
  return baseRates[method] * locationMultiplier * portMultiplier;
}

// Nigerian customs duty calculation
function calculateCustomsDuty(vehiclePrice: number, vehicleYear: number): number {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicleYear;
  
  // Nigeria customs duty rates (approximate)
  // Duty = 35% levy + 35% duty + other charges
  const baseValue = vehiclePrice;
  
  if (vehicleAge <= 5) {
    return baseValue * 0.70; // 70% of vehicle value
  } else if (vehicleAge <= 10) {
    return baseValue * 0.55; // 55% of vehicle value
  } else {
    return baseValue * 0.45; // 45% of vehicle value (older vehicles)
  }
}

// Estimate repair costs in Nigeria based on damage
function estimateRepairCosts(vehiclePrice: number, condition: 'running' | 'non_running'): number {
  // Base estimate on vehicle value and condition
  // This would be more sophisticated in production with damage assessment
  if (condition === 'non_running') {
    // Non-running vehicles typically need 15-25% of value for repairs
    return vehiclePrice * 0.20;
  } else {
    // Running vehicles might need minor repairs (5-10% of value)
    return vehiclePrice * 0.08;
  }
}

// Get current exchange rate (in production, fetch from API)
async function getExchangeRate(): Promise<number> {
  // In production, fetch from CBN API or reliable FX provider
  // For now, return approximate rate
  return 1550; // 1 USD = 1550 NGN (approximate)
}

// Estimate Nigerian resale value based on historical data
function estimateResaleValue(
  vehiclePrice: number,
  year: number,
  make: string,
  model: string
): number {
  // This would use ML model in production
  // For now, use simple heuristics
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  // Popular brands have higher resale
  const popularBrands = ['TOYOTA', 'HONDA', 'LEXUS', 'MERCEDES', 'BMW'];
  const brandMultiplier = popularBrands.includes(make.toUpperCase()) ? 1.3 : 1.1;
  
  // Age depreciation
  const ageMultiplier = Math.max(0.5, 1 - (age * 0.05));
  
  return vehiclePrice * brandMultiplier * ageMultiplier * 1550; // Convert to NGN
}

export async function calculateCost(input: CostCalculatorInput): Promise<CostEstimateResult> {
  const exchangeRate = await getExchangeRate();
  
  // Calculate all cost components
  const vehiclePrice = input.vehiclePrice;
  const auctionBuyerFee = calculateAuctionBuyerFee(vehiclePrice, input.auctionSource);
  
  const usTowing = calculateTowingCost(
    input.auctionLocationState,
    input.vehicleCondition
  ) + (input.hasKeys ? 0 : 75); // Rekey fee
  
  const usStorage = 0; // Assuming no storage if picked up within free period
  
  const shippingCost = calculateShippingCost(
    input.shippingMethod,
    input.auctionLocationState,
    input.destinationPort
  );
  
  const insurance = vehiclePrice * 0.02; // 2% of vehicle value
  
  const nigerianCustomsDuty = calculateCustomsDuty(vehiclePrice, input.vehicleYear);
  const nigerianPortCharges = 150; // Fixed port charges
  const clearingAgentFee = 200; // Agent fee
  
  // Local transport from port to destination
  const localTransport = input.destinationCity === 'Lagos' ? 50 : 150;
  
  // Estimated repair costs in Nigeria
  const estimatedRepairCosts = estimateRepairCosts(vehiclePrice, input.vehicleCondition);
  
  // Platform fee (5% of vehicle price, min $50, max $200)
  const platformFee = Math.min(Math.max(vehiclePrice * 0.05, 50), 200);
  
  // Calculate totals
  const totalUSD = 
    vehiclePrice +
    auctionBuyerFee +
    usTowing +
    usStorage +
    shippingCost +
    insurance +
    nigerianCustomsDuty +
    nigerianPortCharges +
    clearingAgentFee +
    localTransport +
    estimatedRepairCosts +
    platformFee;
  
  const totalNGN = totalUSD * exchangeRate;
  
  // Estimate resale value and profit
  const estimatedNigerianResaleValue = estimateResaleValue(
    vehiclePrice,
    input.vehicleYear,
    '', // Would pass make/model in real implementation
    ''
  );
  
  const estimatedProfitMargin = estimatedNigerianResaleValue - totalNGN;
  
  // Estimate delivery timeline
  const estimatedDaysToDelivery = 
    3 + // Pickup
    7 + // Transport to port
    21 + // Ocean freight
    7 + // Customs clearance
    2; // Local delivery
  
  const breakdown = [
    { category: 'Auction Price', amount: vehiclePrice, currency: 'USD' as const },
    { category: 'Auction Fees', amount: auctionBuyerFee, currency: 'USD' as const },
    { category: 'Towing (Yard to Port)', amount: usTowing, currency: 'USD' as const },
    { category: `Shipping (${input.shippingMethod.toUpperCase()})`, amount: shippingCost, currency: 'USD' as const },
    { category: 'Insurance', amount: insurance, currency: 'USD' as const },
    { category: 'Customs Clearance Fees', amount: nigerianCustomsDuty + nigerianPortCharges + clearingAgentFee, currency: 'USD' as const },
    { category: 'Local Transport in Nigeria', amount: localTransport, currency: 'USD' as const },
    { category: 'Estimated Repair Costs (Nigeria)', amount: estimatedRepairCosts, currency: 'USD' as const },
    { category: 'Platform Service Fee', amount: platformFee, currency: 'USD' as const },
  ];
  
  return {
    vehiclePrice,
    auctionBuyerFee,
    usTowing,
    usStorage,
    shippingCost,
    insurance,
    nigerianCustomsDuty,
    nigerianPortCharges,
    clearingAgentFee,
    localTransport,
    estimatedRepairCosts,
    platformFee,
    totalUSD,
    totalNGN,
    exchangeRate,
    estimatedNigerianResaleValue,
    estimatedProfitMargin,
    estimatedDaysToDelivery,
    breakdown,
  };
}
