import { db } from './src/db/index';
import { vehicles } from './src/db/schema';
import { eq } from 'drizzle-orm';

// Update images to use actual Copart image URLs
const lotNumbers = ['83780695', '82140875', '89578735', '89572965', '89510735'];

async function updateImages() {
  console.log('🖼️  Updating to real Copart image URLs...\n');
  
  for (const lotNumber of lotNumbers) {
    const imageUrls = [
      `https://cs.copart.com/v1/AUTH_svc.pdoc00001/LPP/${lotNumber}/1.jpg`,
      `https://cs.copart.com/v1/AUTH_svc.pdoc00001/LPP/${lotNumber}/2.jpg`,
      `https://cs.copart.com/v1/AUTH_svc.pdoc00001/LPP/${lotNumber}/3.jpg`,
      `https://cs.copart.com/v1/AUTH_svc.pdoc00001/LPP/${lotNumber}/4.jpg`,
    ];
    
    await db.update(vehicles)
      .set({
        images: imageUrls,
        thumbnailUrl: imageUrls[0],
      })
      .where(eq(vehicles.lotNumber, lotNumber));
    
    console.log(`✅ Updated images for Lot ${lotNumber}`);
  }
  
  console.log('\n✨ All images updated to real Copart URLs!');
  console.log('📸 These will show actual vehicle photos from Copart\n');
  process.exit(0);
}

updateImages().catch(console.error);
