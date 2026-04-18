import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

export interface CopartVehicleData {
  title: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  lotNumber: string;
  currentBid: number;
  buyNowPrice?: number;
  imageUrl: string | null;
  images: string[];
  location: string;
  damageType: string;
  secondaryDamage?: string;
  odometer: string;
  titleStatus?: string;
  engineType?: string;
  transmission?: string;
  driveType?: string;
  fuelType?: string;
  color?: string;
  bodyStyle?: string;
  hasKeys?: boolean;
  auctionDate: string;
  auctionStatus: string;
  auctionEnded: boolean;
  seller?: string;
  source: 'copart';
}

export async function scrapeCopartVehicle(url: string): Promise<CopartVehicleData> {
  // Extract lot number from URL
  const lotMatch = url.match(/lot\/(\d+)/i);
  const lotNumber = lotMatch ? lotMatch[1] : '';

  // Parse basic info from URL as fallback
  const urlMatch = url.match(/salvage-(\d{4})-([^-]+)-([^-]+(?:-[^-]+)*)-([a-z]{2})-([^/]+)/i);
  let fallbackYear = 0;
  let fallbackMake = '';
  let fallbackModel = '';
  let fallbackState = '';
  let fallbackCity = '';

  if (urlMatch) {
    fallbackYear = parseInt(urlMatch[1]);
    fallbackMake = urlMatch[2].charAt(0).toUpperCase() + urlMatch[2].slice(1).toLowerCase();
    fallbackModel = urlMatch[3].split('-').map((w: string) =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
    fallbackState = urlMatch[4].toUpperCase();
    fallbackCity = urlMatch[5].split('-').map((w: string) =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
  }

  let browser;
  try {
    console.log('Launching browser for Copart scrape...');

    // Use system Chromium in production (Docker), bundled in development
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        '--single-process', // Helps in Docker
      ],
    });

    const page = await browser.newPage();

    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    console.log('Navigating to:', url);

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 10000 });

    // Give extra time for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract vehicle data
    const vehicleData = await page.evaluate(() => {
      const getData = (selector: string, attribute?: string): string => {
        const el = document.querySelector(selector);
        if (!el) return '';
        return attribute ? (el.getAttribute(attribute) || '') : (el.textContent?.trim() || '');
      };

      const getDataAll = (selector: string, attribute?: string): string[] => {
        const els = document.querySelectorAll(selector);
        return Array.from(els).map(el =>
          attribute ? (el.getAttribute(attribute) || '') : (el.textContent?.trim() || '')
        ).filter(Boolean);
      };

      // Try to get data from page
      // These selectors may need adjustment based on Copart's current structure

      // Title/Vehicle name
      const title = getData('h1') || getData('.lot-details-title') || getData('[data-uname="lotdetailsTitle"]');

      // Images - try multiple selectors
      let images: string[] = [];

      // Method 1: Try to get images from gallery thumbnails (most reliable)
      const thumbs = document.querySelectorAll('.p-galleria-thumbnail-item img, .p-galleria-thumbnail img, [class*="thumbnail"] img, .imageGalleryThumbnail img');
      if (thumbs.length > 0) {
        images = Array.from(thumbs)
          .map(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
            // Convert thumbnail URL to full size
            return src.replace('_thb.jpg', '_ful.jpg').replace('_thn.jpg', '_ful.jpg').replace('/thumb/', '/full/');
          })
          .filter(src => src && !src.includes('placeholder') && !src.includes('spinner'));
      }

      // Method 2: Try main gallery images
      if (images.length === 0) {
        const imgElements = document.querySelectorAll('.lot-details-image img, .p-galleria-item img, [data-uname="lotsearchLotimage"] img, .gallery-image img, .imageGallery img');
        images = Array.from(imgElements)
          .map(img => img.getAttribute('src') || img.getAttribute('data-src') || '')
          .filter(src => src && !src.includes('placeholder') && !src.includes('spinner') && src.includes('copart'));
      }

      // Method 3: Look for image URLs in page data/scripts
      if (images.length <= 1) {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          const content = script.textContent || '';
          // Look for image URL patterns
          const imageMatches = content.match(/https:\/\/cs\.copart\.com\/v1\/AUTH_svc\.pdoc00001\/[^"'\s]+_ful\.jpg/g);
          if (imageMatches) {
            images = [...new Set([...images, ...imageMatches])];
          }
          // Also look for image keys
          const keyMatches = content.match(/"imageKey"\s*:\s*"([^"]+)"/g);
          if (keyMatches) {
            keyMatches.forEach(match => {
              const key = match.match(/"imageKey"\s*:\s*"([^"]+)"/)?.[1];
              if (key) {
                images.push(`https://cs.copart.com/v1/AUTH_svc.pdoc00001/${key}_ful.jpg`);
              }
            });
          }
        });
        images = [...new Set(images)]; // Remove duplicates
      }

      // Method 4: Look for lotImages array in any JSON
      if (images.length <= 1) {
        const bodyText = document.body.innerHTML;
        const lotImagesMatch = bodyText.match(/"lotImages"\s*:\s*\[([^\]]+)\]/);
        if (lotImagesMatch) {
          const keysMatch = lotImagesMatch[1].match(/"([^"]+)"/g);
          if (keysMatch) {
            keysMatch.forEach(key => {
              const cleanKey = key.replace(/"/g, '');
              if (cleanKey && !cleanKey.includes(':')) {
                images.push(`https://cs.copart.com/v1/AUTH_svc.pdoc00001/${cleanKey}_ful.jpg`);
              }
            });
          }
        }
        images = [...new Set(images)];
      }

      // Method 5: OG image as fallback
      if (images.length === 0) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
          const ogSrc = ogImage.getAttribute('content');
          if (ogSrc) images.push(ogSrc);
        }
      }

      // Clean up and dedupe
      images = [...new Set(images)].filter(src => src && src.startsWith('http'));

      // Get lot details from the details section
      const getDetailValue = (label: string): string => {
        const rows = document.querySelectorAll('.lot-details-info tr, .lot-detail-row, [class*="detail-row"]');
        for (const row of rows) {
          const text = row.textContent || '';
          if (text.toLowerCase().includes(label.toLowerCase())) {
            const value = row.querySelector('td:last-child, .value, span:last-child');
            return value?.textContent?.trim() || '';
          }
        }
        // Also try definition lists
        const dts = document.querySelectorAll('dt');
        for (const dt of dts) {
          if (dt.textContent?.toLowerCase().includes(label.toLowerCase())) {
            const dd = dt.nextElementSibling;
            return dd?.textContent?.trim() || '';
          }
        }
        return '';
      };

      // VIN
      let vin = getDetailValue('vin') || getData('[data-uname="lotdetailsVin"]');
      if (!vin) {
        const vinMatch = document.body.innerHTML.match(/VIN[:\s#]*([A-HJ-NPR-Z0-9]{17})/i);
        vin = vinMatch ? vinMatch[1] : '';
      }

      // Current bid
      let currentBidText = getData('.bid-price, [data-uname="lotdetailsCurrentBid"], .current-bid-amount') || getDetailValue('current bid');
      let currentBid = 0;
      const bidMatch = currentBidText.match(/[\d,]+/);
      if (bidMatch) {
        currentBid = parseInt(bidMatch[0].replace(/,/g, ''));
      }

      // Buy now price
      let buyNowText = getData('.buy-now-price, [data-uname="lotdetailsBuyNow"]') || getDetailValue('buy it now');
      let buyNowPrice: number | undefined;
      const buyNowMatch = buyNowText.match(/[\d,]+/);
      if (buyNowMatch) {
        buyNowPrice = parseInt(buyNowMatch[0].replace(/,/g, ''));
      }

      // Damage type
      const damageType = getDetailValue('primary damage') || getDetailValue('damage') || 'See listing';
      const secondaryDamage = getDetailValue('secondary damage') || '';

      // Odometer
      let odometer = getDetailValue('odometer') || getDetailValue('mileage') || 'See listing';

      // Location
      const location = getDetailValue('location') || getDetailValue('sale location') || '';

      // Auction date
      const auctionDate = getDetailValue('sale date') || getDetailValue('auction date') || 'See listing';

      // Auction status - check multiple indicators
      let auctionStatus = '';
      let auctionEnded = false;

      // Method 1: Look for status elements
      const statusSelectors = [
        '.sale-status',
        '.lot-status',
        '[data-uname="lotdetailsStatus"]',
        '.lot-details-status',
        '[class*="status"]',
        '.bidding-status',
        '.auction-status'
      ];
      for (const selector of statusSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim().toLowerCase() || '';
          if (text.includes('sold') || text.includes('sale') || text.includes('ended') || text.includes('closed')) {
            auctionStatus = el.textContent?.trim() || '';
            auctionEnded = true;
            break;
          }
        }
      }

      // Method 2: Look for "Sale Information" or "Sold" badges
      const allText = document.body.innerText.toLowerCase();
      if (!auctionEnded) {
        if (allText.includes('sale ended') || allText.includes('sold on') ||
            allText.includes('winning bid') || allText.includes('final bid') ||
            allText.includes('sale information') || allText.includes('this lot has sold')) {
          auctionEnded = true;
          auctionStatus = 'Sale Ended';
        }
      }

      // Method 3: Check for sold price vs current bid wording
      if (!auctionEnded) {
        const soldPriceEl = document.querySelector('[class*="sold"], [class*="final"], [class*="winning"]');
        if (soldPriceEl) {
          auctionEnded = true;
          auctionStatus = 'Sold';
        }
      }

      // Method 4: Look in page data/scripts
      if (!auctionEnded) {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          const content = script.textContent || '';
          if (content.includes('"saleStatus":"SOLD"') ||
              content.includes('"lotStatus":"SOLD"') ||
              content.includes('"as":"SOLD"') ||
              content.includes('"sold":true')) {
            auctionEnded = true;
            auctionStatus = 'Sold';
          }
        });
      }

      if (!auctionStatus) {
        auctionStatus = auctionEnded ? 'Sale Ended' : 'Active';
      }

      // Additional details
      const titleStatus = getDetailValue('title') || getDetailValue('doc type') || '';
      const engineType = getDetailValue('engine') || getDetailValue('engine type') || '';
      const transmission = getDetailValue('transmission') || '';
      const driveType = getDetailValue('drive') || '';
      const fuelType = getDetailValue('fuel') || getDetailValue('fuel type') || '';
      const color = getDetailValue('color') || '';
      const bodyStyle = getDetailValue('body style') || '';
      const hasKeys = (getDetailValue('keys') || '').toLowerCase().includes('yes');
      const seller = getDetailValue('seller') || '';

      // Year, Make, Model from title or page
      let year = 0;
      let make = '';
      let model = '';

      const titleParts = title.match(/(\d{4})\s+(\w+)\s+(.+)/);
      if (titleParts) {
        year = parseInt(titleParts[1]);
        make = titleParts[2];
        model = titleParts[3];
      }

      return {
        title,
        year,
        make,
        model,
        vin,
        currentBid,
        buyNowPrice,
        images,
        location,
        damageType,
        secondaryDamage,
        odometer,
        titleStatus,
        engineType,
        transmission,
        driveType,
        fuelType,
        color,
        bodyStyle,
        hasKeys,
        auctionDate,
        auctionStatus,
        auctionEnded,
        seller,
      };
    });

    await browser.close();

    // Merge with fallback data
    return {
      title: vehicleData.title || `${fallbackYear} ${fallbackMake} ${fallbackModel}`,
      year: vehicleData.year || fallbackYear,
      make: vehicleData.make || fallbackMake,
      model: vehicleData.model || fallbackModel,
      vin: vehicleData.vin,
      lotNumber,
      currentBid: vehicleData.currentBid,
      buyNowPrice: vehicleData.buyNowPrice,
      imageUrl: vehicleData.images[0] || null,
      images: vehicleData.images,
      location: vehicleData.location || `${fallbackCity}, ${fallbackState}`,
      damageType: vehicleData.damageType,
      secondaryDamage: vehicleData.secondaryDamage,
      odometer: vehicleData.odometer,
      titleStatus: vehicleData.titleStatus,
      engineType: vehicleData.engineType,
      transmission: vehicleData.transmission,
      driveType: vehicleData.driveType,
      fuelType: vehicleData.fuelType,
      color: vehicleData.color,
      bodyStyle: vehicleData.bodyStyle,
      hasKeys: vehicleData.hasKeys,
      auctionDate: vehicleData.auctionDate,
      auctionStatus: vehicleData.auctionStatus || 'Active',
      auctionEnded: vehicleData.auctionEnded,
      seller: vehicleData.seller,
      source: 'copart',
    };

  } catch (error) {
    console.error('Copart scrape error:', error);

    if (browser) {
      await browser.close();
    }

    // Return fallback data from URL parsing
    return {
      title: `${fallbackYear} ${fallbackMake} ${fallbackModel}`,
      year: fallbackYear,
      make: fallbackMake,
      model: fallbackModel,
      vin: '',
      lotNumber,
      currentBid: 0,
      buyNowPrice: undefined,
      imageUrl: null,
      images: [],
      location: `${fallbackCity}, ${fallbackState}`,
      damageType: 'See listing',
      odometer: 'See listing',
      auctionDate: 'See listing',
      auctionStatus: 'Unknown',
      auctionEnded: false,
      source: 'copart',
    };
  }
}
