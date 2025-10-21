/**
 * Test Copart API Connection
 * 
 * Run this script to verify your Copart credentials work:
 * npx tsx scripts/test-copart-connection.ts
 */

import dotenv from 'dotenv';
dotenv.config();

// Check if credentials are present
function checkCredentials() {
  console.log('\n🔍 Checking environment variables...\n');
  
  const required = [
    'COPART_USERNAME',
    'COPART_PASSWORD',
    'COPART_DEALER_NUMBER',
  ];
  
  const missing: string[] = [];
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
      console.log(`❌ ${key}: Not set`);
    } else {
      console.log(`✅ ${key}: Set (${process.env[key]?.substring(0, 5)}...)`);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n⚠️  Missing credentials. Please add to .env file:\n');
    missing.forEach(key => {
      console.log(`${key}=your_value_here`);
    });
    return false;
  }
  
  return true;
}

// Test basic authentication
async function testAuthentication() {
  console.log('\n🔐 Testing authentication...\n');
  
  // This is a placeholder - actual implementation depends on Copart's API
  // You'll need to update this based on their documentation
  
  const authUrl = process.env.COPART_API_URL 
    ? `${process.env.COPART_API_URL}/auth/login`
    : 'https://www.copart.com/api/auth/login';
  
  try {
    console.log(`Attempting to authenticate at: ${authUrl}`);
    console.log(`Username: ${process.env.COPART_USERNAME}`);
    console.log(`Dealer #: ${process.env.COPART_DEALER_NUMBER}`);
    
    // Example auth request - UPDATE THIS based on Copart's actual API
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: process.env.COPART_USERNAME,
        password: process.env.COPART_PASSWORD,
        dealerNumber: process.env.COPART_DEALER_NUMBER,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentication successful!');
      console.log('Token received:', data.token ? 'Yes' : 'No');
      return data.token;
    } else {
      console.log(`❌ Authentication failed: ${response.status} ${response.statusText}`);
      const error = await response.text();
      console.log('Error details:', error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Connection error:', error);
    console.log('\nPossible issues:');
    console.log('1. API URL is incorrect');
    console.log('2. Network/firewall blocking request');
    console.log('3. Copart API structure is different');
    console.log('4. You need to contact Copart to enable API access');
    return null;
  }
}

// Test fetching vehicles
async function testVehicleSearch(token: string) {
  console.log('\n🚗 Testing vehicle search...\n');
  
  const searchUrl = process.env.COPART_API_URL
    ? `${process.env.COPART_API_URL}/vehicles/search`
    : 'https://www.copart.com/api/vehicles/search';
  
  try {
    const response = await fetch(`${searchUrl}?make=Toyota&limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.results?.length || 0} vehicles`);
      
      if (data.results?.[0]) {
        const vehicle = data.results[0];
        console.log('\nSample vehicle:');
        console.log(`- Lot: ${vehicle.lotNumber}`);
        console.log(`- Year: ${vehicle.year}`);
        console.log(`- Make: ${vehicle.make}`);
        console.log(`- Model: ${vehicle.model}`);
        console.log(`- Current Bid: $${vehicle.currentBid}`);
      }
      
      return true;
    } else {
      console.log(`❌ Search failed: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Search error:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('=================================================');
  console.log('   COPART API CONNECTION TEST');
  console.log('=================================================');
  
  // Step 1: Check credentials
  if (!checkCredentials()) {
    console.log('\n❌ Cannot proceed without credentials.');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Add your Copart credentials');
    console.log('3. Run this script again');
    process.exit(1);
  }
  
  // Step 2: Test authentication
  const token = await testAuthentication();
  
  if (!token) {
    console.log('\n⚠️  Authentication failed.');
    console.log('\nNext steps:');
    console.log('1. Verify credentials are correct');
    console.log('2. Contact Copart to enable API access');
    console.log('3. Ask for API documentation and endpoint URLs');
    console.log('4. Update this script with correct API format');
    process.exit(1);
  }
  
  // Step 3: Test vehicle search
  const searchSuccess = await testVehicleSearch(token);
  
  // Summary
  console.log('\n=================================================');
  console.log('   TEST SUMMARY');
  console.log('=================================================\n');
  
  if (searchSuccess) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('\nYour Copart API connection is working.');
    console.log('You can now:');
    console.log('1. Update src/lib/copart-api.ts with correct endpoints');
    console.log('2. Implement vehicle sync in src/jobs/sync-vehicles.ts');
    console.log('3. Connect bidding in src/app/api/bids/route.ts');
    console.log('4. Test with real bids (start small!)');
  } else {
    console.log('⚠️  TESTS INCOMPLETE');
    console.log('\nWhat worked:');
    console.log('✅ Credentials present');
    console.log(token ? '✅ Authentication' : '❌ Authentication');
    console.log(searchSuccess ? '✅ Vehicle search' : '❌ Vehicle search');
    console.log('\nContact Copart support for help:');
    console.log('Phone: +1-972-391-5000');
    console.log('Email: membersupport@copart.com');
  }
  
  console.log('\n=================================================\n');
}

// Run the tests
runTests().catch(console.error);
