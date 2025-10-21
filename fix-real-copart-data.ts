import { db } from './src/db/index';
import { vehicles } from './src/db/schema';
import { eq } from 'drizzle-orm';

const correctData = [
  {
    lotNumber: '83780695',
    year: 2016,
    make: 'Mercedes-Benz',
    model: 'CLA',
    trim: '250',
    titleStatus: 'clean' as const,
    auctionLocation: 'San Antonio, TX',
    auctionLocationState: 'TX',
    bodyStyle: 'Sedan',
    condition: 'running' as const,
  },
  {
    lotNumber: '82140875',
    year: 2017,
    make: 'Mercedes-Benz',
    model: 'CLA',
    trim: '250',
    titleStatus: 'clean' as const,
    auctionLocation: 'Van Nuys, CA',
    auctionLocationState: 'CA',
    bodyStyle: 'Sedan',
    condition: 'running' as const,
  },
  {
    lotNumber: '89578735',
    year: 2019,
    make: 'Mercedes-Benz',
    model: 'G-Class',
    trim: '63 AMG',
    titleStatus: 'salvage' as const,
    auctionLocation: 'Mocksville, NC',
    auctionLocationState: 'NC',
    bodyStyle: 'SUV',
    condition: 'unknown' as const,
  },
  {
    lotNumber: '89572965',
    year: 2017,
    make: 'Mercedes-Benz',
    model: 'GLE Coupe',
    trim: '43 AMG',
    titleStatus: 'clean' as const,
    auctionLocation: 'Orlando South, FL',
    auctionLocationState: 'FL',
    bodyStyle: 'SUV',
    condition: 'running' as const,
  },
  {
    lotNumber: '89510735',
    year: 2009,
    make: 'Mercedes-Benz',
    model: 'C-Class',
    trim: '300 4MATIC',
    titleStatus: 'salvage' as const,
    auctionLocation: 'Charleston, WV',
    auctionLocationState: 'WV',
    bodyStyle: 'Sedan',
    condition: 'unknown' as const,
  },
];

async function fixData() {
  console.log('🔧 Updating vehicles with correct Copart data...\n');
  
  for (const data of correctData) {
    await db.update(vehicles)
      .set({
        year: data.year,
        make: data.make,
        model: data.model,
        trim: data.trim,
        titleStatus: data.titleStatus,
        auctionLocation: data.auctionLocation,
        auctionLocationState: data.auctionLocationState,
        bodyStyle: data.bodyStyle,
        condition: data.condition,
      })
      .where(eq(vehicles.lotNumber, data.lotNumber));
    
    console.log(`✅ Fixed: ${data.year} ${data.make} ${data.model} ${data.trim}`);
    console.log(`   Lot: ${data.lotNumber} | ${data.titleStatus.toUpperCase()} Title | ${data.auctionLocation}`);
    console.log('');
  }
  
  console.log('✨ All vehicles updated with correct real data from Copart!');
  console.log('📍 Refresh your browser to see the changes\n');
  process.exit(0);
}

fixData().catch(console.error);
