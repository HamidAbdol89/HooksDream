const axios = require('axios');
const cheerio = require('cheerio');

class LinkPreviewService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Extract link preview metadata from URL
   * @param {string} url - URL to crawl
   * @returns {Promise<Object>} Preview metadata
   */
  async getPreview(url) {
    try {
      // Validate URL
      const validUrl = this.validateUrl(url);
      if (!validUrl) {
        throw new Error('Invalid URL');
      }

      // Check cache first
      const cached = this.getFromCache(validUrl);
      if (cached) {
        return cached;
      }

      // Crawl metadata
      const metadata = await this.crawlMetadata(validUrl);
      
      // Cache result
      this.setCache(validUrl, metadata);
      
      return metadata;
    } catch (error) {
      console.error('Link preview error:', error.message);
      return {
        url,
        title: this.extractDomainFromUrl(url),
        description: '',
        image: '',
        siteName: '',
        error: error.message
      };
    }
  }

  /**
   * Validate and normalize URL
   * @param {string} url 
   * @returns {string|null}
   */
  validateUrl(url) {
    try {
      // Add protocol if missing
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      
      // Block localhost and private IPs for security
      if (urlObj.hostname === 'localhost' || 
          urlObj.hostname.startsWith('127.') ||
          urlObj.hostname.startsWith('192.168.') ||
          urlObj.hostname.startsWith('10.') ||
          urlObj.hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
        throw new Error('Private URLs not allowed');
      }

      return urlObj.toString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Crawl website metadata
   * @param {string} url 
   * @returns {Promise<Object>}
   */
  async crawlMetadata(url) {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HooksDream/1.0; +https://hooksdream.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache'
      },
      maxContentLength: 5 * 1024 * 1024 // 5MB limit
    });

    const $ = cheerio.load(response.data);
    
    // Extract OpenGraph metadata
    const metadata = {
      url: response.request.res.responseUrl || url,
      title: this.extractTitle($),
      description: this.extractDescription($),
      image: this.extractImage($, url),
      siteName: this.extractSiteName($),
      type: this.extractType($),
      publishedTime: this.extractPublishedTime($),
      author: this.extractAuthor($),
      favicon: this.extractFavicon($, url)
    };

    // Clean and validate metadata
    return this.cleanMetadata(metadata);
  }

  /**
   * Extract title from OpenGraph or fallback to page title
   */
  extractTitle($) {
    return $('meta[property="og:title"]').attr('content') ||
           $('meta[name="twitter:title"]').attr('content') ||
           $('title').text() ||
           '';
  }

  /**
   * Extract description from OpenGraph or meta description
   */
  extractDescription($) {
    return $('meta[property="og:description"]').attr('content') ||
           $('meta[name="twitter:description"]').attr('content') ||
           $('meta[name="description"]').attr('content') ||
           '';
  }

  /**
   * Extract image from OpenGraph
   */
  extractImage($, baseUrl) {
    let image = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('meta[name="twitter:image:src"]').attr('content');

    if (image && !image.startsWith('http')) {
      // Convert relative URL to absolute
      try {
        const base = new URL(baseUrl);
        image = new URL(image, base.origin).toString();
      } catch (error) {
        image = '';
      }
    }

    return image || '';
  }

  /**
   * Extract site name
   */
  extractSiteName($) {
    return $('meta[property="og:site_name"]').attr('content') ||
           $('meta[name="application-name"]').attr('content') ||
           '';
  }

  /**
   * Extract content type
   */
  extractType($) {
    return $('meta[property="og:type"]').attr('content') || 'website';
  }

  /**
   * Extract published time
   */
  extractPublishedTime($) {
    return $('meta[property="article:published_time"]').attr('content') ||
           $('meta[name="pubdate"]').attr('content') ||
           '';
  }

  /**
   * Extract author
   */
  extractAuthor($) {
    return $('meta[property="article:author"]').attr('content') ||
           $('meta[name="author"]').attr('content') ||
           '';
  }

  /**
   * Extract favicon
   */
  extractFavicon($, baseUrl) {
    let favicon = $('link[rel="icon"]').attr('href') ||
                  $('link[rel="shortcut icon"]').attr('href') ||
                  '/favicon.ico';

    if (favicon && !favicon.startsWith('http')) {
      try {
        const base = new URL(baseUrl);
        favicon = new URL(favicon, base.origin).toString();
      } catch (error) {
        favicon = '';
      }
    }

    return favicon;
  }

  /**
   * Clean and validate metadata
   */
  cleanMetadata(metadata) {
    return {
      url: metadata.url,
      title: this.truncateText(metadata.title, 100),
      description: this.truncateText(metadata.description, 200),
      image: metadata.image,
      siteName: this.truncateText(metadata.siteName, 50),
      type: metadata.type,
      publishedTime: metadata.publishedTime,
      author: this.truncateText(metadata.author, 50),
      favicon: metadata.favicon,
      crawledAt: new Date().toISOString()
    };
  }

  /**
   * Truncate text to specified length
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Extract domain from URL for fallback title
   */
  extractDomainFromUrl(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
      return urlObj.hostname;
    } catch (error) {
      return 'Link';
    }
  }

  /**
   * Cache management
   */
  getFromCache(url) {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(url, data) {
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });

    // Cleanup old cache entries (simple LRU)
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Extract multiple URLs from text content
   */
  extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const matches = text.match(urlRegex) || [];
    
    return matches.map(url => {
      if (!url.startsWith('http')) {
        return url.startsWith('www.') ? 'https://' + url : 'https://' + url;
      }
      return url;
    });
  }

  /**
   * Get previews for multiple URLs
   */
  async getMultiplePreviews(urls) {
    const previews = await Promise.allSettled(
      urls.slice(0, 3).map(url => this.getPreview(url)) // Limit to 3 URLs
    );

    return previews
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(preview => preview && !preview.error);
  }
}

module.exports = new LinkPreviewService();
