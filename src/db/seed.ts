/**
 * Database Seeding Script
 * Seeds the database with sample data for development
 */

import { db } from './index';
import { users, vehicles, bids, shipments } from './schema';
import { hashPassword } from '@/lib/auth';
import { generateReferralCode } from '@/lib/utils';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create test users
    console.log('Creating users...');
    const [testUser] = await db.insert(users).values([
      {
        email: 'emeka@example.com',
        phone: '+2348012345678',
        passwordHash: await hashPassword('password123'),
        firstName: 'Emeka',
        lastName: 'Okafor',
        referralCode: generateReferralCode(),
        kycStatus: 'verified',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
      },
    ]).returning();

    console.log('✅ Created test user:', testUser.email);

    // Create sample vehicles
    console.log('Creating vehicles...');
    const sampleVehicles = [
      {
        auctionSource: 'copart' as const,
        lotNumber: 'LOT123456',
        vin: '1HGBH41JXMN109186',
        year: 2018,
        make: 'Toyota',
        model: 'Camry',
        trim: 'LE',
        bodyStyle: 'Sedan',
        color: 'Silver',
        condition: 'running' as const,
        titleStatus: 'clean' as const,
        primaryDamage: 'Front End',
        odometer: 45000,
        currentBid: '8500',
        auctionDate: new Date('2025-10-15'),
        auctionLocation: 'Los Angeles, CA',
        auctionLocationState: 'CA',
        images: [
          'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb',
          'https://images.unsplash.com/photo-1619682817481-e994891cd1f5',
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb',
        engineType: '2.5L I4',
        transmission: 'Automatic',
        fuelType: 'Gasoline',
        hasKeys: true,
      },
      {
        auctionSource: 'iaai' as const,
        lotNumber: 'LOT789012',
        vin: '5XYKT3A69CG234567',
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        trim: 'EX',
        bodyStyle: 'Sedan',
        color: 'Black',
        condition: 'running' as const,
        titleStatus: 'salvage' as const,
        primaryDamage: 'Rear End',
        odometer: 32000,
        currentBid: '12000',
        auctionDate: new Date('2025-10-20'),
        auctionLocation: 'Houston, TX',
        auctionLocationState: 'TX',
        images: [
          'https://images.unsplash.com/photo-1590362891991-f776e747a588',
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588',
        engineType: '1.5L Turbo',
        transmission: 'CVT',
        fuelType: 'Gasoline',
        hasKeys: true,
      },
      {
        auctionSource: 'copart' as const,
        lotNumber: 'LOT345678',
        vin: 'WBADT43452G123456',
        year: 2019,
        make: 'BMW',
        model: '3 Series',
        trim: '330i',
        bodyStyle: 'Sedan',
        color: 'White',
        condition: 'non_running' as const,
        titleStatus: 'salvage' as const,
        primaryDamage: 'Side',
        secondaryDamage: 'Undercarriage',
        odometer: 28000,
        currentBid: '15000',
        auctionDate: new Date('2025-10-18'),
        auctionLocation: 'New York, NY',
        auctionLocationState: 'NY',
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e',
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e',
        engineType: '2.0L Turbo I4',
        transmission: 'Automatic',
        fuelType: 'Gasoline',
        hasKeys: false,
      },
      {
        auctionSource: 'copart' as const,
        lotNumber: 'LOT901234',
        vin: '1FTFW1ET5BFC12345',
        year: 2017,
        make: 'Ford',
        model: 'F-150',
        trim: 'XLT',
        bodyStyle: 'Pickup',
        color: 'Blue',
        condition: 'running' as const,
        titleStatus: 'clean' as const,
        primaryDamage: 'Hail',
        odometer: 65000,
        currentBid: '18000',
        auctionDate: new Date('2025-10-22'),
        auctionLocation: 'Dallas, TX',
        auctionLocationState: 'TX',
        images: [
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
        engineType: '3.5L V6',
        transmission: 'Automatic',
        fuelType: 'Gasoline',
        hasKeys: true,
      },
      {
        auctionSource: 'iaai' as const,
        lotNumber: 'LOT567890',
        vin: '4T1BF1FK6CU123456',
        year: 2016,
        make: 'Lexus',
        model: 'ES 350',
        trim: 'Base',
        bodyStyle: 'Sedan',
        color: 'Gray',
        condition: 'running' as const,
        titleStatus: 'rebuilt' as const,
        primaryDamage: 'Front End',
        odometer: 58000,
        currentBid: '14500',
        auctionDate: new Date('2025-10-25'),
        auctionLocation: 'Atlanta, GA',
        auctionLocationState: 'GA',
        images: [
          'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2',
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2',
        engineType: '3.5L V6',
        transmission: 'Automatic',
        fuelType: 'Gasoline',
        hasKeys: true,
      },
    ];

    const createdVehicles = await db.insert(vehicles).values(sampleVehicles).returning();
    console.log(`✅ Created ${createdVehicles.length} sample vehicles`);

    // Create a sample bid
    console.log('Creating sample bid...');
    const [sampleBid] = await db.insert(bids).values({
      userId: testUser.id,
      vehicleId: createdVehicles[0].id,
      maxBidAmount: '9000',
      status: 'won',
      finalBidAmount: '8700',
      wonAt: new Date(),
    }).returning();

    console.log('✅ Created sample bid');

    // Create a sample shipment
    console.log('Creating sample shipment...');
    await db.insert(shipments).values({
      userId: testUser.id,
      bidId: sampleBid.id,
      vehicleId: createdVehicles[0].id,
      status: 'vessel_in_transit',
      shippingMethod: 'roro',
      pickupScheduledAt: new Date('2025-10-16'),
      pickedUpAt: new Date('2025-10-18'),
      arrivedAtWarehouseAt: new Date('2025-10-20'),
      departedAt: new Date('2025-10-25'),
      estimatedArrivalAt: new Date('2025-11-15'),
      arrivalPort: 'Lagos',
      vesselName: 'MV Ocean Express',
      trackingHistory: [
        {
          status: 'auction_won',
          location: 'Los Angeles, CA',
          timestamp: new Date('2025-10-15').toISOString(),
          notes: 'Auction won successfully',
        },
        {
          status: 'payment_received',
          location: 'AutoBridge Platform',
          timestamp: new Date('2025-10-16').toISOString(),
          notes: 'Payment confirmed',
        },
        {
          status: 'picked_up',
          location: 'Los Angeles Auction Yard',
          timestamp: new Date('2025-10-18').toISOString(),
        },
        {
          status: 'vessel_departed',
          location: 'Port of Los Angeles',
          timestamp: new Date('2025-10-25').toISOString(),
          notes: 'Vessel departed for Nigeria',
        },
      ],
    });

    console.log('✅ Created sample shipment');

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: emeka@example.com');
    console.log('   Password: password123');
    console.log('\n🚗 Sample vehicles created:', createdVehicles.length);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('\n✅ Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });

