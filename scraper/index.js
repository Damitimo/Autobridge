const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3001;

// API key for basic auth
const API_KEY = process.env.SCRAPER_API_KEY || 'your-secret-key';

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['x-api-key'] || req.headers['authorization'];
  if (!authHeader || authHeader !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'autobridge-scraper' });
});

// Scrape Copart vehicle
app.post('/scrape/copart', authenticate, async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes('copart.com')) {
    return res.status(400).json({ error: 'Valid Copart URL is required' });
  }

  let browser;
  try {
    console.log('Starting Copart scrape for:', url);

    // Extract lot number from URL
    const lotMatch = url.match(/lot\/(\d+)/i);
    const lotNumber = lotMatch ? lotMatch[1] : '';

    // Parse basic info from URL as fallback
    const urlMatch = url.match(/salvage-(\d{4})-([^-]+)-([^-]+(?:-[^-]+)*)-([a-z]{2})-([^/]+)/i);
    let fallbackYear = 0, fallbackMake = '', fallbackModel = '', fallbackState = '', fallbackCity = '';

    if (urlMatch) {
      fallbackYear = parseInt(urlMatch[1]);
      fallbackMake = urlMatch[2].charAt(0).toUpperCase() + urlMatch[2].slice(1).toLowerCase();
      fallbackModel = urlMatch[3].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      fallbackState = urlMatch[4].toUpperCase();
      fallbackCity = urlMatch[5].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

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
        '--single-process',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Intercept network requests to capture lot data API
    let apiLotData = null;
    await page.setRequestInterception(true);

    page.on('request', request => {
      request.continue();
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/public/data/lotdetails') || url.includes('/lot/') && url.includes('/api')) {
        try {
          const json = await response.json();
          if (json && (json.data || json.lotDetails)) {
            apiLotData = json.data || json.lotDetails || json;
            console.log('Captured API lot data');
          }
        } catch (e) {
          // Not JSON response
        }
      }
    });

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 10000 });

    // Wait longer for dynamic bid data to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try to scroll to trigger any lazy loading
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract vehicle data
    const vehicleData = await page.evaluate(() => {
      const getData = (selector, attribute) => {
        const el = document.querySelector(selector);
        if (!el) return '';
        return attribute ? (el.getAttribute(attribute) || '') : (el.textContent?.trim() || '');
      };

      // Title
      const title = getData('h1') || getData('.lot-details-title') || getData('[data-uname="lotdetailsTitle"]');

      // Images
      let images = [];

      // Method 1: Thumbnails
      const thumbs = document.querySelectorAll('.p-galleria-thumbnail-item img, .p-galleria-thumbnail img, [class*="thumbnail"] img');
      if (thumbs.length > 0) {
        images = Array.from(thumbs).map(img => {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
          return src.replace('_thb.jpg', '_ful.jpg').replace('_thn.jpg', '_ful.jpg');
        }).filter(src => src && !src.includes('placeholder'));
      }

      // Method 2: Gallery images
      if (images.length === 0) {
        const imgElements = document.querySelectorAll('.lot-details-image img, .p-galleria-item img, .gallery-image img');
        images = Array.from(imgElements).map(img => img.getAttribute('src') || '').filter(src => src && src.includes('copart'));
      }

      // Method 3: Script data
      if (images.length <= 1) {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          const content = script.textContent || '';
          const imageMatches = content.match(/https:\/\/cs\.copart\.com\/v1\/AUTH_svc\.pdoc00001\/[^"'\s]+_ful\.jpg/g);
          if (imageMatches) images = [...new Set([...images, ...imageMatches])];
        });
      }

      // Method 4: OG image
      if (images.length === 0) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) images.push(ogImage.getAttribute('content'));
      }

      images = [...new Set(images)].filter(src => src && src.startsWith('http'));

      // Get detail value helper - improved version
      const getDetailValue = (label) => {
        const labelLower = label.toLowerCase();

        // Helper to check if value looks like code/garbage or UI elements
        const isValidExtractedValue = (val) => {
          if (!val || val.length > 200) return false;
          const lower = val.toLowerCase().trim();
          // Reject if it looks like code
          if (val.includes('function') || val.includes('var ') || val.includes('const ') ||
              val.includes('{') || val.includes('}') || val.includes('document.') ||
              val.includes('window.') || val.includes('cookie') || val.includes('script') ||
              val.includes('http') || val.includes('style=') || val.includes('class=')) {
            return false;
          }
          // Reject VIN patterns - they get picked up as values for other fields
          if (lower.startsWith('vin:') || lower.startsWith('vin ') ||
              /^[a-hj-npr-z0-9*]{17}$/i.test(val.replace(/[:\s]/g, '')) ||
              /vin[:\s]*[a-hj-npr-z0-9*]{10,17}/i.test(val)) {
            return false;
          }
          // Reject lot number patterns
          if (/^lot[\s]*(?:number)?[:\s#]*\d+/i.test(val) || /^\d{6,}$/.test(val.trim()) ||
              /lot\s*(?:number|#)?\s*:?\s*\d{5,}/i.test(val)) {
            return false;
          }
          // Reject common UI elements
          const uiElements = ['watchlist', 'sign in', 'register', 'login', 'bid now', 'buy now',
            'add to', 'remove', 'share', 'print', 'save', 'menu', 'close', 'search', 'help',
            'contact', 'member', 'seller', 'unknown', 'n/a', 'loading', 'run and drive',
            'enhanced', 'stationary', 'starts', 'tow', 'engine start', 'verified'];
          if (uiElements.some(ui => lower === ui || lower.startsWith(ui + ' ') || lower.endsWith(' ' + ui) || lower.includes(ui))) {
            return false;
          }
          return true;
        };

        // Method 1: Look for label/value pairs in various structures
        const rows = document.querySelectorAll('.lot-details-info tr, .lot-detail-row, [class*="detail-row"], [class*="lot-detail"], .p-datatable-tbody tr, li');
        for (const row of rows) {
          // Skip if row is inside script or style
          if (row.closest('script') || row.closest('style') || row.closest('noscript')) continue;
          const text = row.textContent?.toLowerCase() || '';
          if (text.includes(labelLower)) {
            // Try to get the value part
            const spans = row.querySelectorAll('span, td, dd, .value');
            for (const span of spans) {
              const spanText = span.textContent?.trim();
              if (spanText && !spanText.toLowerCase().includes(labelLower) && isValidExtractedValue(spanText)) {
                return spanText;
              }
            }
          }
        }

        // Method 2: dt/dd pairs
        const dts = document.querySelectorAll('dt');
        for (const dt of dts) {
          if (dt.closest('script') || dt.closest('style')) continue;
          if (dt.textContent?.toLowerCase().includes(labelLower)) {
            const val = dt.nextElementSibling?.textContent?.trim() || '';
            if (isValidExtractedValue(val)) return val;
          }
        }

        // Method 3: Look in visible content only (exclude scripts, styles, etc.)
        const contentElements = document.querySelectorAll('div, span, p, td, li, dd');
        for (const el of contentElements) {
          if (el.closest('script') || el.closest('style') || el.closest('noscript')) continue;
          if (el.children.length === 0) continue;
          const text = el.textContent?.toLowerCase() || '';
          if (text.includes(labelLower) && text.length < 500 && el.children.length >= 2) {
            const lastChild = el.children[el.children.length - 1];
            const val = lastChild.textContent?.trim();
            if (val && !val.toLowerCase().includes(labelLower) && isValidExtractedValue(val)) {
              return val;
            }
          }
        }

        return '';
      };

      // Extract all lot data from embedded JSON in scripts
      let lotData = {};
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const content = script.textContent || '';
        // Look for JSON objects containing lot data
        const jsonPatterns = [
          /lotDetails\s*[=:]\s*({[^;]+})/,
          /window\.__NEXT_DATA__\s*=\s*({.+?})\s*(?:<\/script>|;)/,
          /"lotDetails"\s*:\s*({[^}]+})/,
          /JSON\.parse\s*\(\s*'({[^']+})'\s*\)/,
        ];
        for (const pattern of jsonPatterns) {
          const match = content.match(pattern);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              lotData = { ...lotData, ...parsed };
            } catch (e) {}
          }
        }

        // Also extract individual fields from scripts
        const fieldPatterns = {
          vin: [/"vin"\s*:\s*"([A-HJ-NPR-Z0-9]{17})"/i, /"fv"\s*:\s*"([A-HJ-NPR-Z0-9]{17})"/i],
          odometer: [/"orr"\s*:\s*(\d+)/, /"odometer"\s*:\s*(\d+)/, /"odometerReading"\s*:\s*(\d+)/],
          seller: [/"mkn"\s*:\s*"([^"]+)"/, /"sellerName"\s*:\s*"([^"]+)"/, /"sn"\s*:\s*"([^"]+)"/],
          saleDate: [/"ad"\s*:\s*(\d+)/, /"auctionDate"\s*:\s*"([^"]+)"/, /"sd"\s*:\s*"([^"]+)"/],
          location: [/"yn"\s*:\s*"([^"]+)"/, /"yardName"\s*:\s*"([^"]+)"/, /"locationName"\s*:\s*"([^"]+)"/],
          damageType: [/"dd"\s*:\s*"([^"]+)"/, /"primaryDamage"\s*:\s*"([^"]+)"/],
          docType: [/"td"\s*:\s*"([^"]+)"/, /"titleType"\s*:\s*"([^"]+)"/],
        };

        for (const [field, patterns] of Object.entries(fieldPatterns)) {
          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && !lotData[field]) {
              lotData[field] = match[1];
            }
          }
        }
      });

      // Invalid values to filter out (UI elements, not data)
      const invalidValues = ['watchlist', 'sign in', 'register', 'login', 'bid now', 'buy now', 'add to', 'remove', 'share', 'print', 'save'];
      const isValidValue = (val) => {
        if (!val) return false;
        const lower = val.toLowerCase().trim();
        return lower.length > 0 && !invalidValues.some(inv => lower.includes(inv));
      };

      // VIN - must be exactly 17 alphanumeric chars (excluding I, O, Q)
      let vin = '';
      // Method 1: From extracted lot data
      if (lotData.vin && /^[A-HJ-NPR-Z0-9]{17}$/i.test(lotData.vin)) {
        vin = lotData.vin.toUpperCase();
      }
      // Method 2: Find VIN pattern in entire page HTML
      if (!vin) {
        const html = document.body.innerHTML;
        // Look for VIN near a VIN label
        const vinContextMatch = html.match(/VIN[:\s#]*([A-HJ-NPR-Z0-9]{17})/i);
        if (vinContextMatch) vin = vinContextMatch[1].toUpperCase();
      }
      // Method 3: Any 17-char VIN pattern (less reliable)
      if (!vin) {
        const allText = document.body.innerText;
        const vinMatch = allText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
        if (vinMatch) vin = vinMatch[1].toUpperCase();
      }

      // Current bid - try multiple methods
      let currentBid = 0;

      // Method 1: Direct selectors - expanded list
      const bidSelectors = [
        '.bid-price',
        '[data-uname="lotdetailsCurrentBid"]',
        '[data-uname="lotdetailsBidValue"]',
        '.current-bid-amount',
        '[data-uname="lotdetailsBidPrice"]',
        '.high-bid-amount',
        '.lot-details-bid-amount',
        '[class*="bidAmount"]',
        '[class*="current-bid"]',
        '[class*="highBid"]',
        '[class*="bid-value"]',
        '.amount',
        '.price-value',
        // Try PrimeNG/Angular components Copart uses
        'p-panel .bid-info',
        '.bid-section .value',
        '.bidding-info span',
        '[data-testid*="bid"]',
      ];
      for (const selector of bidSelectors) {
        try {
          const el = document.querySelector(selector);
          if (el) {
            const text = el.textContent || '';
            const match = text.match(/\$?\s*([\d,]+)/);
            if (match) {
              const bid = parseInt(match[1].replace(/,/g, ''));
              if (bid > currentBid) currentBid = bid;
            }
          }
        } catch (e) {}
      }

      // Method 2: Look for bid in window/global objects
      if (currentBid === 0) {
        try {
          // Check for Angular/React data stores
          const windowKeys = ['__NEXT_DATA__', '__NUXT__', 'lotDetails', 'lotData', 'pageData'];
          for (const key of windowKeys) {
            if (window[key]) {
              const str = JSON.stringify(window[key]);
              const patterns = [/"hb"[:\s]*(\d+)/, /"highBid"[:\s]*(\d+)/, /"currentBid"[:\s]*(\d+)/];
              for (const pattern of patterns) {
                const match = str.match(pattern);
                if (match) {
                  const bid = parseInt(match[1]);
                  if (bid > currentBid) currentBid = bid;
                }
              }
            }
          }
        } catch (e) {}
      }

      // Method 3: Look for bid in page data/scripts - more aggressive
      if (currentBid === 0) {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          const content = script.textContent || '';
          // Try different patterns
          const patterns = [
            /"hb"\s*:\s*(\d+)/,           // hb = high bid
            /"highBid"\s*:\s*(\d+)/,
            /"currentBid"\s*:\s*(\d+)/,
            /"la"\s*:\s*(\d+)/,           // la = last amount
            /"bidAmount"\s*:\s*(\d+)/,
            /"dynamicBidAmt"\s*:\s*(\d+)/,
            /bidValue['":\s]+(\d+)/,
            /"ab"\s*:\s*(\d+)/,           // auction bid
            /"ob"\s*:\s*(\d+)/,           // opening bid
          ];
          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && parseInt(match[1]) > currentBid) {
              currentBid = parseInt(match[1]);
            }
          }
        });
      }

      // Method 4: Find any dollar amount near bid-related text
      if (currentBid === 0) {
        const allText = document.body.innerText;
        // Multiple patterns to try
        const patterns = [
          /(?:current|high|winning|your)\s*bid[:\s]*\$?\s*([\d,]+)/i,
          /bid[:\s]*\$?\s*([\d,]+)\s*(?:usd)?/i,
          /\$\s*([\d,]+)\s*(?:usd)?\s*(?:current|high|bid)/i,
        ];
        for (const pattern of patterns) {
          const match = allText.match(pattern);
          if (match) {
            const bid = parseInt(match[1].replace(/,/g, ''));
            if (bid > currentBid) currentBid = bid;
            break;
          }
        }
      }

      // Method 5: Fall back to detail value
      if (currentBid === 0) {
        const bidText = getDetailValue('current bid') || getDetailValue('high bid');
        const match = bidText.match(/\$?([\d,]+)/);
        if (match) {
          currentBid = parseInt(match[1].replace(/,/g, ''));
        }
      }

      // Method 6: Look for any element containing USD amounts near "bid" keywords
      if (currentBid === 0) {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.children.length === 0) { // leaf nodes only
            const text = el.textContent?.trim() || '';
            if (text.match(/^\$?\s*[\d,]+\s*$/)) {
              const parent = el.parentElement?.textContent?.toLowerCase() || '';
              if (parent.includes('bid') || parent.includes('amount')) {
                const match = text.match(/([\d,]+)/);
                if (match) {
                  const bid = parseInt(match[1].replace(/,/g, ''));
                  if (bid > 100 && bid > currentBid) { // Must be > $100 to be a real bid
                    currentBid = bid;
                    break;
                  }
                }
              }
            }
          }
        }
      }

      // Buy now price
      let buyNowText = getData('.buy-now-price, [data-uname="lotdetailsBuyNow"]') || getDetailValue('buy it now');
      let buyNowPrice;
      const buyNowMatch = buyNowText.match(/[\d,]+/);
      if (buyNowMatch) buyNowPrice = parseInt(buyNowMatch[0].replace(/,/g, ''));

      // Odometer - critical field (must be numeric)
      let odometer = '';
      // Method 1: From script data
      if (lotData.odometer && /^\d+$/.test(lotData.odometer.toString())) {
        odometer = parseInt(lotData.odometer).toLocaleString();
      }
      // Method 2: Look for odometer pattern in page text
      if (!odometer) {
        const allText = document.body.innerText;
        // Match patterns like "Odometer: 45,000" or "45000 mi"
        const patterns = [
          /odometer[:\s]+([0-9,]+)\s*(?:mi|miles|actual|km)?/i,
          /mileage[:\s]+([0-9,]+)/i,
          /([0-9,]+)\s*(?:actual\s*)?miles/i,
        ];
        for (const pattern of patterns) {
          const match = allText.match(pattern);
          if (match) {
            const num = parseInt(match[1].replace(/,/g, ''));
            if (num > 0 && num < 1000000) { // Valid mileage range
              odometer = num.toLocaleString();
              break;
            }
          }
        }
      }
      // Method 3: From HTML near odometer label
      if (!odometer) {
        const html = document.body.innerHTML;
        const odoMatch = html.match(/odometer[^>]*>([^<]*)</i);
        if (odoMatch) {
          const numMatch = odoMatch[1].match(/([0-9,]+)/);
          if (numMatch) {
            const num = parseInt(numMatch[1].replace(/,/g, ''));
            if (num > 0 && num < 1000000) {
              odometer = num.toLocaleString();
            }
          }
        }
      }

      // Damage type
      let damageType = '';
      if (lotData.damageType && isValidValue(lotData.damageType)) {
        damageType = lotData.damageType;
      }
      if (!damageType) {
        const allText = document.body.innerText;
        const damageMatch = allText.match(/primary\s*damage[:\s]+([A-Za-z\s-/]+?)(?:\n|Secondary|Odometer|Est)/i);
        if (damageMatch && isValidValue(damageMatch[1])) {
          damageType = damageMatch[1].trim();
        }
      }

      const secondaryDamage = '';

      // Location
      let location = '';
      if (lotData.location && isValidValue(lotData.location)) {
        location = lotData.location;
      }
      if (!location) {
        const allText = document.body.innerText;
        // Look for city, state pattern
        const locationMatch = allText.match(/(?:location|yard|sale location)[:\s]+([A-Za-z\s]+,\s*[A-Z]{2})/i);
        if (locationMatch && isValidValue(locationMatch[1])) {
          location = locationMatch[1].trim();
        }
      }

      // Auction date/time - try multiple methods
      let auctionDate = '';
      let auctionDateTime = null; // ISO string for countdown

      // Method 1: Look for specific date elements
      const dateSelectors = [
        '[data-uname="lotdetailsSaleDatevalue"]',
        '[data-uname="lotdetailsAuctionDate"]',
        '.sale-date',
        '.auction-date',
        '[class*="sale-date"]',
        '[class*="auction-date"]',
        '.lot-details-sale-date',
      ];
      for (const selector of dateSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent?.trim()) {
          auctionDate = el.textContent.trim();
          break;
        }
      }

      // Method 2: Search for date patterns in page text
      if (!auctionDate) {
        const allText = document.body.innerText;
        // Look for patterns like "April 21, 2025 10:00 AM" or "04/21/2025"
        const datePatterns = [
          /sale\s*(?:date|time)?[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/i,
          /auction\s*(?:date|time)?[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/i,
          /([A-Za-z]+\s+\d{1,2},?\s+\d{4}\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*(?:ET|EST|EDT|CT|CST|CDT|PT|PST|PDT)/i,
        ];
        for (const pattern of datePatterns) {
          const match = allText.match(pattern);
          if (match) {
            auctionDate = match[1].trim();
            break;
          }
        }
      }

      // Method 3: Look in scripts for sale date data
      if (!auctionDate) {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          const content = script.textContent || '';
          const patterns = [
            /"saleDate"\s*:\s*"([^"]+)"/,
            /"auctionDate"\s*:\s*"([^"]+)"/,
            /"sd"\s*:\s*"([^"]+)"/,
            /"saleDateStr"\s*:\s*"([^"]+)"/,
            /"auctionDateTime"\s*:\s*"([^"]+)"/,
            /"ad"\s*:\s*(\d+)/, // Unix timestamp
          ];
          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
              // Check if it's a Unix timestamp
              if (pattern.toString().includes('\\d+')) {
                const ts = parseInt(match[1]);
                if (ts > 1000000000) { // Valid timestamp
                  const date = new Date(ts * 1000);
                  auctionDate = date.toLocaleString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true
                  });
                  auctionDateTime = date.toISOString();
                }
              } else {
                auctionDate = match[1];
              }
              break;
            }
          }
        });
      }

      // Method 4: Get from detail row
      if (!auctionDate) {
        auctionDate = getDetailValue('sale date') || getDetailValue('auction date') || 'See listing';
      }

      // Try to parse auctionDate into ISO format for countdown
      if (auctionDate && auctionDate !== 'See listing' && !auctionDateTime) {
        try {
          const parsed = new Date(auctionDate);
          if (!isNaN(parsed.getTime())) {
            auctionDateTime = parsed.toISOString();
          }
        } catch (e) {}
      }
      // Title/Doc type
      let titleStatus = '';
      // Method 1: From script data
      if (lotData.docType && isValidValue(lotData.docType)) {
        titleStatus = lotData.docType;
      }
      // Method 2: Look for doc type pattern in page text
      if (!titleStatus) {
        const allText = document.body.innerText;
        const patterns = [
          /doc\s*type[:\s]+([A-Za-z\s-]+?)(?:\n|VIN|Primary|Odometer)/i,
          /title\s*(?:type|status)?[:\s]+([A-Za-z\s-]+?)(?:\n|VIN|Primary|Odometer)/i,
        ];
        for (const pattern of patterns) {
          const match = allText.match(pattern);
          if (match && isValidValue(match[1])) {
            titleStatus = match[1].trim();
            break;
          }
        }
      }
      // Common title types to look for
      if (!titleStatus) {
        const allText = document.body.innerText.toLowerCase();
        const titleTypes = ['clean title', 'salvage title', 'certificate of destruction', 'non-repairable', 'rebuilt'];
        for (const type of titleTypes) {
          if (allText.includes(type)) {
            titleStatus = type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
          }
        }
      }
      const engineType = getDetailValue('engine') || '';
      const transmission = getDetailValue('transmission') || '';
      const driveType = getDetailValue('drive') || '';
      const fuelType = getDetailValue('fuel') || '';
      const color = getDetailValue('color') || '';
      const bodyStyle = getDetailValue('body style') || '';
      const hasKeys = (getDetailValue('keys') || '').toLowerCase().includes('yes');

      // Vehicle running condition - extract from Highlights field
      let highlights = '';
      let isRunning = false;

      // Method 1: Look for Highlights section
      const highlightsSelectors = [
        '[data-uname="lotdetailsHighlights"]',
        '.lot-details-highlights',
        '[class*="highlights"]',
        '[class*="Highlights"]',
      ];
      for (const selector of highlightsSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent?.trim()) {
          highlights = el.textContent.trim();
          break;
        }
      }

      // Method 2: Search in page text for highlights patterns
      if (!highlights) {
        const allText = document.body.innerText;
        const highlightsMatch = allText.match(/highlights?[:\s]+([^\n]+)/i);
        if (highlightsMatch) {
          highlights = highlightsMatch[1].trim();
        }
      }

      // Method 3: Look for run/drive status anywhere
      if (!highlights) {
        const allText = document.body.innerText.toLowerCase();
        if (allText.includes('run and drive')) highlights = 'Run and Drive';
        else if (allText.includes('enhanced vehicle')) highlights = 'Enhanced Vehicle';
        else if (allText.includes('starts')) highlights = 'Starts';
        else if (allText.includes('stationary')) highlights = 'Stationary';
        else if (allText.includes('engine starts')) highlights = 'Engine Starts';
      }

      // Method 4: Check script data for highlights
      if (!highlights && lotData) {
        highlights = lotData.highlights || lotData.hl || lotData.vehicleHighlights || '';
      }

      // Determine if vehicle is running based on highlights
      const highlightsLower = highlights.toLowerCase();
      if (highlightsLower.includes('run and drive') ||
          highlightsLower.includes('runs and drives') ||
          highlightsLower.includes('enhanced vehicle') ||
          highlightsLower.includes('engine starts') ||
          highlightsLower.includes('starts')) {
        isRunning = true;
      } else if (highlightsLower.includes('stationary') ||
                 highlightsLower.includes('does not run') ||
                 highlightsLower.includes('non-runner') ||
                 highlightsLower.includes('not running') ||
                 highlightsLower.includes('tow only')) {
        isRunning = false;
      } else {
        // Default: assume not running if we can't determine (safer for cost estimate)
        isRunning = false;
      }

      // Seller - important for insurance detection
      let seller = '';
      // Method 1: From script data
      if (lotData.seller && isValidValue(lotData.seller)) {
        seller = lotData.seller;
      }
      // Method 2: Look for seller pattern in page text
      if (!seller) {
        const allText = document.body.innerText;
        const sellerMatch = allText.match(/seller[:\s]+([A-Za-z0-9\s&.,'-]+?)(?:\n|Primary|Secondary|Damage|Odometer)/i);
        if (sellerMatch && isValidValue(sellerMatch[1])) {
          seller = sellerMatch[1].trim();
        }
      }
      // Method 3: From HTML
      if (!seller) {
        const html = document.body.innerHTML;
        const sellerMatch = html.match(/seller[^>]*>([^<]+)</i);
        if (sellerMatch && isValidValue(sellerMatch[1])) {
          seller = sellerMatch[1].trim();
        }
      }

      const saleType = getDetailValue('sale type') || getDetailValue('sale name') || '';

      // Detect if it's an insurance vehicle
      const insuranceCompanies = [
        'state farm', 'allstate', 'geico', 'progressive', 'usaa', 'liberty mutual',
        'farmers', 'nationwide', 'travelers', 'american family', 'auto-owners',
        'erie insurance', 'hartford', 'amica', 'safeco', 'mercury', 'esurance',
        'metlife', 'aig', 'chubb', 'zurich', 'ace', 'cigna', 'aflac',
        'insurance', 'ins co', 'ins.', 'assurance', 'indemnity', 'mutual'
      ];
      const sellerLower = seller.toLowerCase();
      const saleTypeLower = saleType.toLowerCase();
      const isInsurance = insuranceCompanies.some(ins => sellerLower.includes(ins)) ||
                          saleTypeLower.includes('insurance') ||
                          sellerLower.includes('insurance');

      // Auction status
      let auctionStatus = '';
      let auctionEnded = false;

      const statusSelectors = ['.sale-status', '.lot-status', '[data-uname="lotdetailsStatus"]', '[class*="status"]'];
      for (const selector of statusSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim().toLowerCase() || '';
          if (text.includes('sold') || text.includes('ended') || text.includes('closed')) {
            auctionStatus = el.textContent?.trim() || '';
            auctionEnded = true;
            break;
          }
        }
      }

      const allText = document.body.innerText.toLowerCase();
      if (!auctionEnded) {
        if (allText.includes('sale ended') || allText.includes('sold on') ||
            allText.includes('winning bid') || allText.includes('final bid') ||
            allText.includes('this lot has sold')) {
          auctionEnded = true;
          auctionStatus = 'Sale Ended';
        }
      }

      if (!auctionStatus) auctionStatus = auctionEnded ? 'Sale Ended' : 'Active';

      // Year, Make, Model - use \S+ to capture make with hyphens like MERCEDES-BENZ
      let year = 0, make = '', model = '';
      const titleParts = title.match(/(\d{4})\s+(\S+)\s+(.+)/);
      if (titleParts) {
        year = parseInt(titleParts[1]);
        make = titleParts[2];
        model = titleParts[3];
      }

      return {
        title, year, make, model, vin, currentBid, buyNowPrice, images, location,
        damageType, secondaryDamage, odometer, titleStatus, engineType, transmission,
        driveType, fuelType, color, bodyStyle, hasKeys, highlights, isRunning,
        auctionDate, auctionDateTime, auctionStatus, auctionEnded, seller, saleType, isInsurance
      };
    });

    await browser.close();

    // Try to get bid from API data if available
    let apiBid = 0;
    if (apiLotData) {
      apiBid = apiLotData.hb || apiLotData.highBid || apiLotData.currentBid ||
               apiLotData.dynamicBidAmt || apiLotData.ab || 0;
      console.log('API bid value:', apiBid);
    }

    const result = {
      title: vehicleData.title || `${fallbackYear} ${fallbackMake} ${fallbackModel}`,
      year: vehicleData.year || fallbackYear,
      make: vehicleData.make || fallbackMake,
      model: vehicleData.model || fallbackModel,
      vin: vehicleData.vin,
      lotNumber,
      currentBid: vehicleData.currentBid || apiBid,
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
      highlights: vehicleData.highlights || '',
      isRunning: vehicleData.isRunning || false,
      auctionDate: vehicleData.auctionDate,
      auctionDateTime: vehicleData.auctionDateTime,
      auctionStatus: vehicleData.auctionStatus,
      auctionEnded: vehicleData.auctionEnded,
      seller: vehicleData.seller,
      isInsurance: vehicleData.isInsurance,
      saleType: vehicleData.saleType,
      source: 'copart',
    };

    console.log('Scrape complete:', result.title);
    console.log('Highlights:', result.highlights, '| isRunning:', result.isRunning);
    res.json({ success: true, vehicle: result });

  } catch (error) {
    console.error('Scrape error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to scrape vehicle data', details: error.message });
  }
});

// Scrape IAAI vehicle
app.post('/scrape/iaai', authenticate, async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes('iaai.com')) {
    return res.status(400).json({ error: 'Valid IAAI URL is required' });
  }

  let browser;
  try {
    console.log('Starting IAAI scrape for:', url);

    // Extract stock number from URL
    // Formats: /VehicleDetail/45242122~US or ?itemID=45242122 or /VehicleDetail/45242122
    const detailMatch = url.match(/VehicleDetail\/(\d+)/i);
    const itemMatch = url.match(/itemID=(\d+)/i);
    const stockNumber = detailMatch ? detailMatch[1] : (itemMatch ? itemMatch[1] : '');

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
        '--single-process',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Intercept network requests to capture API data
    let apiVehicleData = null;
    await page.setRequestInterception(true);

    page.on('request', request => {
      request.continue();
    });

    page.on('response', async response => {
      const responseUrl = response.url();
      // IAAI uses various API endpoints for vehicle data
      if (responseUrl.includes('GetVehicleDetailsViewModel') ||
          responseUrl.includes('vehicledetails') ||
          responseUrl.includes('VehicleDetail') ||
          (responseUrl.includes('/api/') && (responseUrl.includes('vehicle') || responseUrl.includes('stock')))) {
        try {
          const text = await response.text();
          // Try to parse as JSON
          try {
            const json = JSON.parse(text);
            if (json && (json.vehicleInfo || json.vehicle || json.data || json.VehicleInfo)) {
              apiVehicleData = json.vehicleInfo || json.vehicle || json.data || json.VehicleInfo || json;
              console.log('Captured IAAI API data from:', responseUrl);
            }
          } catch (e) {
            // Check if it's embedded in the HTML response (SSR)
            const jsonMatch = text.match(/"vehicleInfo"\s*:\s*({[^}]+})/);
            if (jsonMatch) {
              try {
                apiVehicleData = JSON.parse(jsonMatch[1]);
                console.log('Extracted vehicle info from HTML');
              } catch (e) {}
            }
          }
        } catch (e) {
          // Response not readable
        }
      }
    });

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 10000 });

    // Wait longer for dynamic content to load (IAAI uses heavy JS)
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract vehicle data using IAAI's specific structure
    const vehicleData = await page.evaluate(() => {
      // Helper to safely get text content
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent?.trim() || '' : '';
      };

      // IAAI uses a specific structure: Look for Next.js __NEXT_DATA__ or embedded JSON
      let vehicleJson = null;
      const scripts = document.querySelectorAll('script');

      for (const script of scripts) {
        const content = script.textContent || '';

        // Look for __NEXT_DATA__ (Next.js app)
        if (script.id === '__NEXT_DATA__') {
          try {
            const nextData = JSON.parse(content);
            vehicleJson = nextData?.props?.pageProps?.vehicleDetails ||
                         nextData?.props?.pageProps?.data ||
                         nextData?.props?.pageProps;
            if (vehicleJson) console.log('Found NEXT_DATA');
          } catch (e) {}
        }

        // Look for window.__INITIAL_STATE__ or similar
        const statePatterns = [
          /window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});?\s*(?:<\/script>|$)/,
          /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]+?});?\s*(?:<\/script>|$)/,
          /"vehicleDetails"\s*:\s*({[^}]+})/,
        ];

        for (const pattern of statePatterns) {
          const match = content.match(pattern);
          if (match) {
            try {
              vehicleJson = JSON.parse(match[1]);
              console.log('Found state JSON');
            } catch (e) {}
          }
        }
      }

      // Title from page
      let title = getText('h1') || getText('[class*="title"]') || '';

      // Parse year/make/model from title (format: "2024 MERCEDES-BENZ E 350")
      let year = 0, make = '', model = '';
      const titleMatch = title.match(/^(\d{4})\s+([A-Z0-9-]+)\s+(.+)$/i);
      if (titleMatch) {
        year = parseInt(titleMatch[1]);
        make = titleMatch[2].toUpperCase();
        model = titleMatch[3];
      }

      // Images - Multiple methods
      let images = [];

      // Method 1: All img tags with IAAI domains
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.dataset?.src || '';
        if (src && src.includes('iaai.com') && !src.includes('placeholder') && !src.includes('logo')) {
          // Convert to full resolution
          let fullSrc = src;
          if (src.includes('/resizer?')) {
            // IAAI resizer URL - extract original and use larger size
            fullSrc = src.replace(/imageKeys=([^&]+)/, (m, keys) => {
              return 'imageKeys=' + keys;
            }).replace(/width=\d+/, 'width=1024').replace(/height=\d+/, 'height=768');
          }
          images.push(fullSrc);
        }
      });

      // Method 2: Look in script content for image URLs
      scripts.forEach(script => {
        const content = script.textContent || '';
        const imageMatches = content.match(/https?:\/\/(?:vis|images)\.iaai\.com[^"'\s\\]+/gi);
        if (imageMatches) {
          imageMatches.forEach(url => {
            const cleanUrl = url.replace(/\\u002F/g, '/').replace(/\\/g, '');
            if (cleanUrl.includes('.jpg') || cleanUrl.includes('.png') || cleanUrl.includes('.webp')) {
              images.push(cleanUrl);
            }
          });
        }
      });

      // Dedupe images
      images = [...new Set(images)].filter(src => src && src.startsWith('http'));

      // IAAI specific data extraction from the data-* attributes or structured content
      // IAAI typically uses a two-column layout: label on left, value on right
      const getValueForLabel = (labelText) => {
        const labelLower = labelText.toLowerCase().trim();

        // Method 1: Look for table rows with specific structure
        const allRows = document.querySelectorAll('tr');
        for (const row of allRows) {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const labelCell = cells[0].textContent?.toLowerCase().trim() || '';
            if (labelCell.includes(labelLower) || labelLower.includes(labelCell)) {
              const valueText = cells[1].textContent?.trim() || '';
              if (valueText && valueText.length < 200 && !valueText.toLowerCase().includes(labelLower)) {
                return valueText;
              }
            }
          }
        }

        // Method 2: Look for divs/spans with label-value pairs
        const containers = document.querySelectorAll('[class*="detail"], [class*="info"], [class*="spec"], dl, .row');
        for (const container of containers) {
          const text = container.textContent || '';
          const textLower = text.toLowerCase();
          if (textLower.includes(labelLower)) {
            // Try to find the value after the label
            const children = container.querySelectorAll('span, div, dd, p');
            let foundLabel = false;
            for (const child of children) {
              const childText = child.textContent?.trim() || '';
              const childLower = childText.toLowerCase();
              if (childLower.includes(labelLower)) {
                foundLabel = true;
                continue;
              }
              if (foundLabel && childText && childText.length < 100 && !childLower.includes(labelLower)) {
                // Check it's not just whitespace or common UI text
                if (!/^(loading|n\/a|unknown|see|view|click)$/i.test(childText)) {
                  return childText;
                }
              }
            }
          }
        }

        // Method 3: Regex search in body text (last resort)
        const bodyText = document.body.innerText;
        const pattern = new RegExp(labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[:\\s]+([^\\n]{1,100})', 'i');
        const match = bodyText.match(pattern);
        if (match) {
          const value = match[1].trim();
          // Validate it's not another label or garbage
          if (value && !/^[a-z]+:$/i.test(value) && !value.includes('|') && !value.includes('Privacy')) {
            return value;
          }
        }

        return '';
      };

      // Try to extract data from __NEXT_DATA__ first (IAAI uses Next.js)
      let nextData = null;
      const nextDataScript = document.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
        try {
          nextData = JSON.parse(nextDataScript.textContent || '');
          console.log('Found __NEXT_DATA__');
        } catch (e) {}
      }

      // Extract from Next.js props
      const pageProps = nextData?.props?.pageProps || {};
      const vehicleDetails = pageProps.vehicleDetails || pageProps.vehicle || pageProps.data || {};

      // Extract VIN - prefer from Next data
      let vin = '';
      if (vehicleDetails.vin && /^[A-HJ-NPR-Z0-9]{17}$/i.test(vehicleDetails.vin)) {
        vin = vehicleDetails.vin.toUpperCase();
      }
      // Fallback: Look for VIN pattern in page HTML
      if (!vin) {
        const html = document.body.innerHTML;
        // Look for VIN in specific contexts (near "VIN" label)
        const vinContextMatch = html.match(/VIN[:\s]*<[^>]*>([A-HJ-NPR-Z0-9]{17})<\/[^>]+>/i);
        if (vinContextMatch) {
          vin = vinContextMatch[1].toUpperCase();
        }
      }
      if (!vin) {
        // Search for 17-char alphanumeric strings that look like VINs
        const potentialVins = document.body.innerText.match(/\b[A-HJ-NPR-Z0-9]{17}\b/g) || [];
        for (const v of potentialVins) {
          // VINs typically start with a digit or letter (not pattern-like)
          if (/^[1-9A-HJ-NPR-Z][A-HJ-NPR-Z0-9]{16}$/i.test(v)) {
            vin = v.toUpperCase();
            break;
          }
        }
      }

      // Current bid - look for bid/price elements
      let currentBid = 0;
      const priceElements = document.querySelectorAll('[class*="bid"], [class*="price"], [class*="amount"]');
      for (const el of priceElements) {
        const text = el.textContent || '';
        const match = text.match(/\$?\s*([\d,]+)/);
        if (match) {
          const val = parseInt(match[1].replace(/,/g, ''));
          if (val > currentBid && val < 1000000) currentBid = val;
        }
      }

      // Helper to clean bad IAAI values (section headers)
      const cleanValue = (val) => {
        if (!val) return '';
        const badValues = ['vehicle information', 'bid information', 'at the branch',
                          'iaa |', 'two westbrook', 'privacy', 'cookie', 'see listing'];
        const lower = val.toLowerCase();
        if (badValues.some(b => lower.includes(b)) || lower.length > 100) return '';
        return val;
      };

      // Extract other details - prefer Next.js data, fall back to DOM
      const vd = vehicleDetails; // shorthand
      const odometer = cleanValue(vd.odometer || vd.mileage) || cleanValue(getValueForLabel('Odometer')) || cleanValue(getValueForLabel('Mileage')) || '';
      const damageType = cleanValue(vd.primaryDamage || vd.damage) || cleanValue(getValueForLabel('Primary Damage')) || cleanValue(getValueForLabel('Damage')) || '';
      const secondaryDamage = cleanValue(vd.secondaryDamage) || cleanValue(getValueForLabel('Secondary Damage')) || '';
      const location = cleanValue(vd.location || vd.branch || vd.yardName || vd.branchName) || cleanValue(getValueForLabel('Location')) || cleanValue(getValueForLabel('Branch')) || '';
      const titleStatus = cleanValue(vd.title || vd.titleType || vd.docType) || cleanValue(getValueForLabel('Title')) || cleanValue(getValueForLabel('Doc Type')) || '';
      const engineType = cleanValue(vd.engine || vd.engineType) || cleanValue(getValueForLabel('Engine')) || '';
      const transmission = cleanValue(vd.transmission) || cleanValue(getValueForLabel('Transmission')) || '';
      const driveType = cleanValue(vd.drive || vd.driveType || vd.driveTrain) || cleanValue(getValueForLabel('Drive')) || '';
      const fuelType = cleanValue(vd.fuel || vd.fuelType) || cleanValue(getValueForLabel('Fuel')) || '';
      const color = cleanValue(vd.color || vd.exteriorColor) || cleanValue(getValueForLabel('Color')) || '';
      const bodyStyle = cleanValue(vd.body || vd.bodyStyle) || cleanValue(getValueForLabel('Body')) || '';
      const seller = cleanValue(vd.seller || vd.sellerName) || cleanValue(getValueForLabel('Seller')) || '';
      const saleType = cleanValue(vd.saleType || vd.sale) || cleanValue(getValueForLabel('Sale Type')) || '';

      // Keys
      const keysText = getValueForLabel('Keys') || '';
      const hasKeys = keysText.toLowerCase().includes('yes');

      // Auction date
      let auctionDate = getValueForLabel('Auction Date') || getValueForLabel('Sale Date') || 'See listing';
      let auctionDateTime = null;

      // Running condition
      let highlights = '';
      let isRunning = false;
      const highlightsText = cleanValue(getValueForLabel('Highlights')) || cleanValue(getValueForLabel('Condition')) || cleanValue(getValueForLabel('Run Condition')) || '';
      if (highlightsText) {
        highlights = highlightsText;
      }

      // Always search in page for running status keywords (more reliable)
      const pageTextLower = document.body.innerText.toLowerCase();
      if (pageTextLower.includes('run and drive')) { highlights = 'Run and Drive'; isRunning = true; }
      else if (pageTextLower.includes('enhanced vehicle')) { highlights = 'Enhanced Vehicle'; isRunning = true; }
      else if (pageTextLower.includes('engine starts')) { highlights = 'Engine Starts'; isRunning = true; }
      else if (pageTextLower.includes('stationary')) { highlights = 'Stationary'; isRunning = false; }
      else if (pageTextLower.includes('does not run')) { highlights = 'Does Not Run'; isRunning = false; }

      // Determine running from highlights if not already set
      if (!isRunning) {
        const highlightsLower = highlights.toLowerCase();
        if (highlightsLower.includes('run') || highlightsLower.includes('drive') ||
            highlightsLower.includes('enhanced') || highlightsLower.includes('starts')) {
          isRunning = true;
        }
      }

      // Auction status
      let auctionStatus = 'Active';
      let auctionEnded = false;
      const pageText = document.body.innerText.toLowerCase();
      if (pageText.includes('sold') || pageText.includes('sale ended') || pageText.includes('no longer available')) {
        auctionStatus = 'Sold';
        auctionEnded = true;
      }

      // Insurance seller detection
      const insuranceCompanies = ['state farm', 'allstate', 'geico', 'progressive', 'usaa', 'insurance'];
      const isInsurance = insuranceCompanies.some(ins => seller.toLowerCase().includes(ins));

      return {
        title, year, make, model, vin, currentBid, images,
        location, damageType, secondaryDamage, odometer: odometer.replace(/[^\d,]/g, ''),
        titleStatus, engineType, transmission, driveType, fuelType, color, bodyStyle,
        hasKeys, highlights, isRunning, auctionDate, auctionDateTime, auctionStatus,
        auctionEnded, seller, saleType, isInsurance
      };
    });

    await browser.close();

    const result = {
      title: vehicleData.title || 'Unknown Vehicle',
      year: vehicleData.year || 0,
      make: vehicleData.make || '',
      model: vehicleData.model || '',
      vin: vehicleData.vin,
      lotNumber: stockNumber,
      currentBid: vehicleData.currentBid || 0,
      buyNowPrice: vehicleData.buyNowPrice,
      imageUrl: vehicleData.images[0] || null,
      images: vehicleData.images,
      location: vehicleData.location || '',
      damageType: vehicleData.damageType || '',
      secondaryDamage: vehicleData.secondaryDamage || '',
      odometer: vehicleData.odometer || '',
      titleStatus: vehicleData.titleStatus || '',
      engineType: vehicleData.engineType || '',
      transmission: vehicleData.transmission || '',
      driveType: vehicleData.driveType || '',
      fuelType: vehicleData.fuelType || '',
      color: vehicleData.color || '',
      bodyStyle: vehicleData.bodyStyle || '',
      hasKeys: vehicleData.hasKeys || false,
      highlights: vehicleData.highlights || '',
      isRunning: vehicleData.isRunning || false,
      auctionDate: vehicleData.auctionDate || 'See listing',
      auctionDateTime: vehicleData.auctionDateTime,
      auctionStatus: vehicleData.auctionStatus || 'Active',
      auctionEnded: vehicleData.auctionEnded || false,
      seller: vehicleData.seller || '',
      isInsurance: vehicleData.isInsurance || false,
      saleType: vehicleData.saleType || '',
      source: 'iaai',
    };

    console.log('IAAI scrape complete:', result.title);
    console.log('Images found:', result.images.length);
    console.log('Highlights:', result.highlights, '| isRunning:', result.isRunning);
    res.json({ success: true, vehicle: result });

  } catch (error) {
    console.error('IAAI scrape error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to scrape IAAI vehicle data', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Scraper service running on port ${PORT}`);
});
