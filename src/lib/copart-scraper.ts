/**
 * Copart Web Scraper for MVP
 * 
 * ⚠️ IMPORTANT LIMITATIONS:
 * 1. Can scrape vehicle DATA only
 * 2. CANNOT place actual bids (requires authentication)
 * 3. Will get rate limited/blocked after heavy use
 * 4. Breaks when Copart updates their site
 * 5. Use for MVP only, migrate to API ASAP
 * 
 * LEGAL: This is for educational/MVP purposes. Migrate to official API.
 */

import * as cheerio from 'cheerio';

interface ScrapedVehicle {
  lotNumber: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  odometer?: number;
  primaryDamage?: string;
  currentBid?: number;
  estimatedValue?: number;
  location: string;
  state: string;
  auctionDate?: Date;
  imageUrls: string[];
  titleStatus?: string;
  bodyStyle?: string;
  color?: string;
  engineType?: string;
  transmission?: string;
  driveType?: string;
  hasKeys?: boolean;
  runs?: boolean;
}

interface ScrapeOptions {
  make?: string;
  model?: string;
  year?: number;
  minYear?: number;
  maxYear?: number;
  page?: number;
  limit?: number;
}

export class CopartScraper {
  private baseUrl = 'https://www.copart.com';
  private userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  // Rate limiting
  private lastRequestTime = 0;
  private minRequestInterval = 2000; // 2 seconds between requests
  
  /**
   * Delay to avoid rate limiting
   */
  private async delay(ms: number = this.minRequestInterval): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < ms) {
      await new Promise(resolve => setTimeout(resolve, ms - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  /**
   * Fetch page with error handling and retries
   */
  private async fetchPage(url: string, retries = 3): Promise<string> {
    await this.delay();
    
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Fetching: ${url} (attempt ${i + 1}/${retries})`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        if (response.status === 429) {
          console.warn('Rate limited, waiting 30 seconds...');
          await this.delay(30000);
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.text();
        
      } catch (error) {
        console.error(`Fetch attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await this.delay(5000); // Wait 5s before retry
      }
    }
    
    throw new Error('Failed to fetch page after retries');
  }
  
  /**
   * Search for vehicles (public search, no login needed)
   */
  async searchVehicles(options: ScrapeOptions = {}): Promise<ScrapedVehicle[]> {
    const { 
      make, 
      model, 
      year,
      minYear = 2015,
      maxYear = 2024,
      page = 0,
      limit = 50 
    } = options;
    
    // Build search URL
    const params = new URLSearchParams();
    params.append('free', 'true');
    params.append('query', '*');
    
    if (make) params.append('make', make);
    if (model) params.append('model', model);
    if (year) {
      params.append('year', year.toString());
    } else {
      params.append('year-from', minYear.toString());
      params.append('year-to', maxYear.toString());
    }
    
    params.append('size', Math.min(limit, 100).toString());
    params.append('page', page.toString());
    
    const searchUrl = `${this.baseUrl}/lotSearchResults/?${params.toString()}`;
    
    try {
      const html = await this.fetchPage(searchUrl);
      return this.parseSearchResults(html);
      
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Failed to scrape vehicle search. Copart may have updated their site or blocked the request.');
    }
  }
  
  /**
   * Get detailed information for a specific lot
   */
  async getVehicleDetails(lotNumber: string): Promise<ScrapedVehicle | null> {
    const url = `${this.baseUrl}/lot/${lotNumber}`;
    
    try {
      const html = await this.fetchPage(url);
      return this.parseVehicleDetails(html, lotNumber);
      
    } catch (error) {
      console.error(`Failed to get details for lot ${lotNumber}:`, error);
      return null;
    }
  }
  
  /**
   * Parse search results HTML
   */
  private parseSearchResults(html: string): ScrapedVehicle[] {
    const $ = cheerio.load(html);
    const vehicles: ScrapedVehicle[] = [];
    
    // Copart's search results structure (may change!)
    // This is a simplified example - actual selectors need to be found by inspecting their site
    
    $('div[data-lot]').each((_, element) => {
      try {
        const $el = $(element);
        
        const lotNumber = $el.attr('data-lot') || '';
        const vin = $el.find('[data-vin]').attr('data-vin') || '';
        
        // Parse title like "2018 TOYOTA CAMRY"
        const title = $el.find('.vehicle-title').text().trim();
        const titleParts = title.split(' ');
        const year = parseInt(titleParts[0]) || 0;
        const make = titleParts[1] || '';
        const model = titleParts.slice(2).join(' ') || '';
        
        // Parse pricing
        const currentBidText = $el.find('.current-bid').text().trim();
        const currentBid = this.parseCurrency(currentBidText);
        
        // Parse location
        const location = $el.find('.lot-location').text().trim();
        const state = this.extractState(location);
        
        // Parse images
        const imageUrls: string[] = [];
        $el.find('img').each((_, img) => {
          const src = $(img).attr('src');
          if (src && !src.includes('placeholder')) {
            imageUrls.push(src);
          }
        });
        
        if (lotNumber && year && make) {
          vehicles.push({
            lotNumber,
            vin,
            year,
            make,
            model,
            currentBid,
            location,
            state,
            imageUrls,
          });
        }
        
      } catch (error) {
        console.error('Failed to parse vehicle:', error);
      }
    });
    
    return vehicles;
  }
  
  /**
   * Parse vehicle detail page
   */
  private parseVehicleDetails(html: string, lotNumber: string): ScrapedVehicle | null {
    const $ = cheerio.load(html);
    
    try {
      // Extract data from detail page
      // Note: These selectors are examples and need to be updated based on actual Copart HTML
      
      const title = $('h1.vehicle-name').text().trim();
      const [yearStr, make, ...modelParts] = title.split(' ');
      const year = parseInt(yearStr);
      const model = modelParts.join(' ');
      
      const vin = $('.vin-number').text().trim();
      const odometer = parseInt($('.odometer-reading').text().replace(/\D/g, '')) || 0;
      const primaryDamage = $('.primary-damage').text().trim();
      const currentBid = this.parseCurrency($('.current-bid-amount').text());
      const location = $('.auction-location').text().trim();
      const state = this.extractState(location);
      
      // Extract images
      const imageUrls: string[] = [];
      $('.vehicle-image').each((_, img) => {
        const src = $(img).attr('src');
        if (src) imageUrls.push(src);
      });
      
      // Additional details
      const titleStatus = $('.title-status').text().trim().toLowerCase() as any;
      const bodyStyle = $('.body-style').text().trim();
      const color = $('.color').text().trim();
      const engineType = $('.engine').text().trim();
      const transmission = $('.transmission').text().trim();
      const hasKeys = $('.has-keys').text().toLowerCase().includes('yes');
      const runs = $('.runs-drives').text().toLowerCase().includes('run');
      
      return {
        lotNumber,
        vin,
        year,
        make,
        model,
        odometer,
        primaryDamage,
        currentBid,
        location,
        state,
        imageUrls,
        titleStatus,
        bodyStyle,
        color,
        engineType,
        transmission,
        hasKeys,
        runs,
      };
      
    } catch (error) {
      console.error('Failed to parse vehicle details:', error);
      return null;
    }
  }
  
  /**
   * Parse currency string to number
   */
  private parseCurrency(text: string): number {
    const cleaned = text.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }
  
  /**
   * Extract state abbreviation from location string
   */
  private extractState(location: string): string {
    // Match state abbreviations like "CA", "TX", etc.
    const match = location.match(/\b([A-Z]{2})\b/);
    return match ? match[1] : '';
  }
  
  /**
   * ⚠️ CANNOT ACTUALLY BID VIA SCRAPING
   * This is a placeholder to show what you'd need for real bidding
   */
  async placeBid(lotNumber: string, amount: number): Promise<never> {
    throw new Error(
      'Cannot place bids via scraping. Bidding requires:\n' +
      '1. Authenticated session (login cookies)\n' +
      '2. CSRF tokens\n' +
      '3. Payment verification\n' +
      '4. Will trigger security alerts\n\n' +
      'For MVP: Show users the vehicle, then direct them to Copart to bid manually.\n' +
      'For production: Use official API or data broker.'
    );
  }
}

/**
 * Create scraper instance
 */
export function createCopartScraper(): CopartScraper {
  return new CopartScraper();
}

/**
 * Helper: Check if scraping is working
 */
export async function testScraper(): Promise<boolean> {
  try {
    const scraper = createCopartScraper();
    const results = await scraper.searchVehicles({
      make: 'Toyota',
      limit: 5,
    });
    
    console.log(`✅ Scraper working! Found ${results.length} vehicles`);
    return results.length > 0;
    
  } catch (error) {
    console.error('❌ Scraper failed:', error);
    return false;
  }
}
