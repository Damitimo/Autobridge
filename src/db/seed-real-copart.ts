/**
 * Seed Real Copart Vehicles
 * 
 * Instructions:
 * 1. Go to https://www.copart.com
 * 2. Search for vehicles (Toyota, Honda, etc.)
 * 3. Copy lot numbers, VINs, prices from the site
 * 4. Update the vehicles array below
 * 5. Run: npm run db:seed-real
 */

import { db } from './index';
import { vehicles } from './schema';

const realCopartVehicles = [
  // Example - Replace with actual current listings from Copart
  {
    auctionSource: 'copart' as const,
    lotNumber: '75704873', // Real Copart lot number
    vin: '4T1B11HK1KU704873',
    year: 2019,
    make: 'Toyota',
    model: 'Camry',
    trim: 'LE',
    bodyStyle: 'Sedan',
    color: 'Silver',
    condition: 'running' as const,
    titleStatus: 'salvage' as const,
    primaryDamage: 'Front End',
    odometer: 45230,
    odometerUnit: 'miles',
    currentBid: '8500',
    estimatedValue: '15000',
    auctionLocation: 'Dallas, TX',
    auctionLocationState: 'TX',
    auctionDate: new Date('2025-10-28'),
    saleStatus: 'upcoming',
    engineType: '2.5L I4',
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    hasKeys: true,
    images: [
      'https://cs.copart.com/v1/AUTH_svc.pdoc00001/LPP/75704873/1.jpg', // Placeholder
    ],
  },
  // Add more real vehicles here...
  // Go to copart.com and copy 10-20 current listings
];

async function seedRealVehicles() {
  console.log('🚗 Adding real Copart vehicles...');
  
  try {
    // Clear existing seed data (optional)
    // await db.delete(vehicles);
    
    for (const vehicle of realCopartVehicles) {
      await db.insert(vehicles).values(vehicle);
      console.log(`✅ Added: ${vehicle.year} ${vehicle.make} ${vehicle.model} (Lot ${vehicle.lotNumber})`);
    }
    
    console.log(`\n✨ Successfully added ${realCopartVehicles.length} real vehicles!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
    process.exit(1);
  }
}

seedRealVehicles();
