/**
 * Vehicle Sync Job using Web Scraping
 * 
 * This job runs periodically to scrape Copart for vehicle data
 * and populate your database.
 * 
 * ⚠️ LIMITATIONS:
 * - Can only get public vehicle data
 * - Cannot access authenticated features
 * - Will get rate limited if run too frequently
 * - Breaks when Copart updates their site
 * 
 * RECOMMENDED: Run every 30-60 minutes max
 */

import { createCopartScraper } from '@/lib/copart-scraper';
import { db } from '@/db';
import { vehicles } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Vehicle makes popular in Nigerian market
const POPULAR_MAKES = [
  'Toyota',
  'Honda',
  'Lexus',
  'Mercedes-Benz',
  'BMW',
  'Acura',
  'Nissan',
  'Ford',
  'Chevrolet',
];

export async function syncVehiclesFromCopart() {
  console.log('🔄 Starting vehicle sync from Copart...');
  
  const scraper = createCopartScraper();
  let totalSynced = 0;
  let totalErrors = 0;
  
  try {
    // Scrape popular makes
    for (const make of POPULAR_MAKES) {
      try {
        console.log(`\n📊 Scraping ${make} vehicles...`);
        
        const scrapedVehicles = await scraper.searchVehicles({
          make,
          minYear: 2015,
          maxYear: 2024,
          limit: 50, // Limit per make to avoid rate limiting
        });
        
        console.log(`Found ${scrapedVehicles.length} ${make} vehicles`);
        
        // Insert/update each vehicle
        for (const vehicle of scrapedVehicles) {
          try {
            // Check if vehicle already exists
            const existing = await db
              .select()
              .from(vehicles)
              .where(eq(vehicles.lotNumber, vehicle.lotNumber))
              .limit(1);
            
            if (existing.length > 0) {
              // Update existing vehicle
              await db
                .update(vehicles)
                .set({
                  currentBid: vehicle.currentBid?.toString(),
                  updatedAt: new Date(),
                })
                .where(eq(vehicles.lotNumber, vehicle.lotNumber));
              
              console.log(`  ↻ Updated: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
              
            } else {
              // Insert new vehicle
              await db.insert(vehicles).values({
                auctionSource: 'copart',
                lotNumber: vehicle.lotNumber,
                vin: vehicle.vin,
                year: vehicle.year,
                make: vehicle.make,
                model: vehicle.model,
                trim: vehicle.trim,
                bodyStyle: vehicle.bodyStyle,
                color: vehicle.color,
                condition: vehicle.runs ? 'running' : 'non_running',
                titleStatus: vehicle.titleStatus as any || 'unknown',
                primaryDamage: vehicle.primaryDamage,
                odometer: vehicle.odometer,
                odometerUnit: 'miles',
                currentBid: vehicle.currentBid?.toString(),
                estimatedValue: vehicle.estimatedValue?.toString(),
                auctionLocation: vehicle.location,
                auctionLocationState: vehicle.state,
                auctionDate: vehicle.auctionDate,
                engineType: vehicle.engineType,
                transmission: vehicle.transmission,
                driveType: vehicle.driveType,
                hasKeys: vehicle.hasKeys ?? false,
                images: vehicle.imageUrls,
                saleStatus: 'upcoming',
              });
              
              console.log(`  ✓ Added: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
              totalSynced++;
            }
            
          } catch (error) {
            console.error(`  ✗ Failed to save vehicle ${vehicle.lotNumber}:`, error);
            totalErrors++;
          }
        }
        
        // Delay between makes to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`Failed to scrape ${make}:`, error);
        totalErrors++;
      }
    }
    
    console.log('\n✅ Sync complete!');
    console.log(`  - New vehicles: ${totalSynced}`);
    console.log(`  - Errors: ${totalErrors}`);
    
    return {
      success: true,
      synced: totalSynced,
      errors: totalErrors,
    };
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return {
      success: false,
      synced: totalSynced,
      errors: totalErrors + 1,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get detailed information for specific vehicles
 * Run this separately for vehicles users are interested in
 */
export async function enrichVehicleDetails(lotNumber: string) {
  console.log(`📝 Enriching details for lot ${lotNumber}...`);
  
  const scraper = createCopartScraper();
  
  try {
    const details = await scraper.getVehicleDetails(lotNumber);
    
    if (!details) {
      console.log('❌ No details found');
      return false;
    }
    
    // Update with detailed information
    await db
      .update(vehicles)
      .set({
        trim: details.trim,
        bodyStyle: details.bodyStyle,
        color: details.color,
        primaryDamage: details.primaryDamage,
        odometer: details.odometer,
        titleStatus: details.titleStatus as any,
        engineType: details.engineType,
        transmission: details.transmission,
        driveType: details.driveType,
        hasKeys: details.hasKeys,
        condition: details.runs ? 'running' : 'non_running',
        images: details.imageUrls,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.lotNumber, lotNumber));
    
    console.log('✅ Details enriched');
    return true;
    
  } catch (error) {
    console.error('Failed to enrich vehicle:', error);
    return false;
  }
}

/**
 * Schedule the sync job
 * Run every 30 minutes to avoid rate limiting
 */
export function scheduleVehicleSync() {
  console.log('📅 Scheduling vehicle sync job (every 30 minutes)...');
  
  // Run immediately on startup
  syncVehiclesFromCopart();
  
  // Then run every 30 minutes
  setInterval(() => {
    syncVehiclesFromCopart();
  }, 30 * 60 * 1000); // 30 minutes
}

/**
 * Run sync manually from command line:
 * npx tsx src/jobs/sync-vehicles-scraper.ts
 */
if (require.main === module) {
  syncVehiclesFromCopart()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
