/**
 * Transport Cost Methodology & Assumptions (2025/26)
 * Source: Copart_IAA_Tow_Estimated_Towing_CostsV1.xlsx
 *
 * Based on industry data from:
 * - RoadRunner, A1, Onyx 2025
 * - Sherpa, KBB, ConsumerAffairs 2025
 * - Safemile, Nexus, Move.org 2025
 */

export interface TowingRateBand {
  minMiles: number;
  maxMiles: number | null; // null = unlimited
  ratePerMile: number;
  basis: string;
  sources: string;
}

export const TOWING_RATE_BANDS: TowingRateBand[] = [
  {
    minMiles: 0,
    maxMiles: 100,
    ratePerMile: 1.50,
    basis: 'Short-haul; base costs dominate',
    sources: 'RoadRunner, A1, Onyx 2025',
  },
  {
    minMiles: 101,
    maxMiles: 500,
    ratePerMile: 1.20,
    basis: 'Regional open-carrier',
    sources: 'Sherpa, KBB, ConsumerAffairs 2025',
  },
  {
    minMiles: 501,
    maxMiles: 1000,
    ratePerMile: 0.95,
    basis: 'Mid-distance; median $1.23 @ 987 mi',
    sources: 'RoadRunner national median 2025',
  },
  {
    minMiles: 1001,
    maxMiles: 1500,
    ratePerMile: 0.80,
    basis: 'Long-haul discount begins',
    sources: 'A1, Safemile tiered 2025',
  },
  {
    minMiles: 1501,
    maxMiles: 2000,
    ratePerMile: 0.70,
    basis: 'Cross-country corridor',
    sources: 'Onyx, Nexus market avg 2025',
  },
  {
    minMiles: 2001,
    maxMiles: null,
    ratePerMile: 0.60,
    basis: 'Max distance discount',
    sources: 'ConsumerAffairs, Move.org 2025',
  },
];

// Minimum charge for any single vehicle transport
export const MINIMUM_TOWING_CHARGE = 150;

// Additional fees
export const TOWING_FEES = {
  nonRunning: 75,  // Vehicle cannot drive onto truck
  noKeys: 50,      // No keys available
};

// Road distance adjustment factor
// Haversine gives straight-line distance; actual road distance is ~15-25% longer
export const ROAD_DISTANCE_FACTOR = 1.20;

// Cost estimate range (for displaying min/max estimates)
export const COST_RANGE = {
  lowMultiplier: 0.85,   // -15% for low estimate
  highMultiplier: 1.20,  // +20% for high estimate
};

/**
 * NOTE from source data:
 * - Distances are straight-line (Haversine)
 * - Actual road distance is ~15-25% longer
 * - Add ~20% for real-world estimates
 * - Rates are for standard open-carrier transport of a single vehicle
 * - Alaska/Hawaii flagged separately — require ocean freight
 * - Cost range in main table = ±15%/+20% of midpoint estimate
 */

/**
 * Calculate towing cost using tiered rate structure
 */
export function calculateTieredTowingCost(distanceMiles: number): number {
  let cost = 0;
  let remainingDistance = distanceMiles;

  for (const band of TOWING_RATE_BANDS) {
    if (remainingDistance <= 0) break;

    const bandStart = band.minMiles;
    const bandEnd = band.maxMiles ?? Infinity;
    const bandWidth = bandEnd - bandStart + 1;

    const milesInBand = Math.min(remainingDistance, bandWidth);
    cost += milesInBand * band.ratePerMile;
    remainingDistance -= milesInBand;
  }

  return Math.max(cost, MINIMUM_TOWING_CHARGE);
}

/**
 * Get the rate per mile for a given distance
 */
export function getRateForDistance(distanceMiles: number): number {
  for (const band of TOWING_RATE_BANDS) {
    const maxMiles = band.maxMiles ?? Infinity;
    if (distanceMiles >= band.minMiles && distanceMiles <= maxMiles) {
      return band.ratePerMile;
    }
  }
  return TOWING_RATE_BANDS[TOWING_RATE_BANDS.length - 1].ratePerMile;
}

/**
 * Get cost estimate range (low, mid, high)
 */
export function getTowingCostRange(distanceMiles: number): {
  low: number;
  mid: number;
  high: number;
} {
  const mid = calculateTieredTowingCost(distanceMiles);
  return {
    low: Math.round(mid * COST_RANGE.lowMultiplier),
    mid: Math.round(mid),
    high: Math.round(mid * COST_RANGE.highMultiplier),
  };
}
