// src/hooks/useLinkPreview.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/services/api';

interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  type: string;
  publishedTime?: string;
  author?: string;
  favicon?: string;
  crawledAt: string;
}

interface CachedPreview extends LinkPreviewData {
  cachedAt: number;
  expiresAt: number;
}

// Cache configuration
const CACHE_KEY = 'hooksdream_link_previews';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum number of cached previews

interface UseLinkPreviewReturn {
  previews: LinkPreviewData[];
  error: string | null;
  fetchPreview: (url: string) => Promise<LinkPreviewData | null>;
  fetchMultiplePreviews: (content: string) => Promise<LinkPreviewData[]>;
  clearPreviews: () => void;
  clearError: () => void;
  clearCache: () => void;
  getCacheStats: () => { size: number; totalSize: string };
}

// Persistent cache utilities
const loadCacheFromStorage = (): Map<string, CachedPreview> => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return new Map();
    
    const data = JSON.parse(stored) as Record<string, CachedPreview>;
    const now = Date.now();
    const cache = new Map<string, CachedPreview>();
    
    // Filter out expired entries
    Object.entries(data).forEach(([url, preview]) => {
      if (preview.expiresAt > now) {
        cache.set(url, preview);
      }
    });
    
    return cache;
  } catch (error) {
    console.warn('Failed to load link preview cache:', error);
    return new Map();
  }
};

const saveCacheToStorage = (cache: Map<string, CachedPreview>) => {
  try {
    // Convert Map to Object and limit size
    const entries = Array.from(cache.entries());
    const limitedEntries = entries.slice(-MAX_CACHE_SIZE); // Keep only latest entries
    const data = Object.fromEntries(limitedEntries);
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save link preview cache:', error);
  }
};

const createCachedPreview = (preview: LinkPreviewData): CachedPreview => {
  const now = Date.now();
  return {
    ...preview,
    cachedAt: now,
    expiresAt: now + CACHE_DURATION
  };
};

export const useLinkPreview = (): UseLinkPreviewReturn => {
  const [previews, setPreviews] = useState<LinkPreviewData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Persistent cache loaded from localStorage
  const persistentCacheRef = useRef<Map<string, CachedPreview>>(new Map());
  const requestsRef = useRef<Map<string, Promise<LinkPreviewData | null>>>(new Map());
  
  // Load cache from localStorage on mount
  useEffect(() => {
    persistentCacheRef.current = loadCacheFromStorage();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPreviews = useCallback(() => {
    setPreviews([]);
    setError(null);
  }, []);

  const fetchPreview = useCallback(async (url: string): Promise<LinkPreviewData | null> => {
    try {
      // Check persistent cache first
      const cached = persistentCacheRef.current.get(url);
      if (cached) {
        // Return cached data immediately
        const preview = { ...cached };
        delete (preview as any).cachedAt;
        delete (preview as any).expiresAt;
        
        // Update previews state immediately with cached data
        setPreviews(prev => {
          const exists = prev.some(p => p.url === preview.url);
          if (!exists) {
            return [...prev, preview];
          }
          return prev;
        });
        
        return preview;
      }

      // Check if request is already in progress
      const existingRequest = requestsRef.current.get(url);
      if (existingRequest) {
        return existingRequest;
      }

      setError(null);

      // Create new request
      const request = api.linkPreview.getPreview(url);
      requestsRef.current.set(url, request.then((response: any) => {
        if (response.success && response.data) {
          const preview = response.data as LinkPreviewData;
          
          // Cache the preview with expiration
          const cachedPreview = createCachedPreview(preview);
          persistentCacheRef.current.set(url, cachedPreview);
          
          // Save to localStorage
          saveCacheToStorage(persistentCacheRef.current);
          
          return preview;
        }
        return null;
      }));

      const response = await request;
      
      if (response.success && response.data) {
        const preview = response.data as LinkPreviewData;
        
        // Update previews state
        setPreviews(prev => {
          const exists = prev.some(p => p.url === preview.url);
          if (!exists) {
            return [...prev, preview];
          }
          return prev;
        });

        return preview;
      } else {
        throw new Error(response.message || 'Failed to fetch link preview');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch link preview';
      setError(errorMessage);
      console.error('Link preview error:', err);
      return null;
    } finally {
      requestsRef.current.delete(url);
    }
  }, []);

  const fetchMultiplePreviews = useCallback(async (content: string): Promise<LinkPreviewData[]> => {
    try {
      setError(null);

      // Extract URLs from content first
      const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
      const matches = content.match(urlRegex) || [];
      const urls = matches.map(url => {
        if (!url.startsWith('http')) {
          return url.startsWith('www.') ? 'https://' + url : 'https://' + url;
        }
        return url;
      });
      
      // Check cache for existing previews
      const cachedPreviews: LinkPreviewData[] = [];
      const urlsToFetch: string[] = [];
      
      urls.forEach(url => {
        const cached = persistentCacheRef.current.get(url);
        if (cached) {
          const preview = { ...cached };
          delete (preview as any).cachedAt;
          delete (preview as any).expiresAt;
          cachedPreviews.push(preview);
        } else {
          urlsToFetch.push(url);
        }
      });
      
      // Set cached previews immediately
      if (cachedPreviews.length > 0) {
        setPreviews(cachedPreviews);
      }
      
      // If all URLs are cached, return immediately
      if (urlsToFetch.length === 0) {
        return cachedPreviews;
      }

      // Fetch remaining URLs
      const response = await api.linkPreview.getMultiplePreviews(content);
      
      if (response.success && response.data) {
        const newPreviews = response.data as LinkPreviewData[];
        
        // Cache all new previews
        newPreviews.forEach(preview => {
          const cachedPreview = createCachedPreview(preview);
          persistentCacheRef.current.set(preview.url, cachedPreview);
        });
        
        // Save to localStorage
        saveCacheToStorage(persistentCacheRef.current);

        // Combine cached and new previews
        const allPreviews = [...cachedPreviews, ...newPreviews];
        setPreviews(allPreviews);
        
        return allPreviews;
      } else {
        throw new Error(response.message || 'Failed to fetch link previews');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch link previews';
      setError(errorMessage);
      console.error('Multiple link preview error:', err);
      return [];
    }
  }, []);

  const clearCache = useCallback(() => {
    persistentCacheRef.current.clear();
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const getCacheStats = useCallback(() => {
    const size = persistentCacheRef.current.size;
    const sizeInBytes = new Blob([localStorage.getItem(CACHE_KEY) || '']).size;
    const totalSize = sizeInBytes > 1024 ? `${(sizeInBytes / 1024).toFixed(1)}KB` : `${sizeInBytes}B`;
    
    return { size, totalSize };
  }, []);

  return {
    previews,
    error,
    fetchPreview,
    fetchMultiplePreviews,
    clearPreviews,
    clearError,
    clearCache,
    getCacheStats
  };
};

// Utility hook for extracting URLs from text
export const useUrlExtraction = () => {
  const extractUrls = useCallback((text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const matches = text.match(urlRegex) || [];
    
    return matches.map(url => {
      if (!url.startsWith('http')) {
        return url.startsWith('www.') ? 'https://' + url : 'https://' + url;
      }
      return url;
    });
  }, []);

  const hasUrls = useCallback((text: string): boolean => {
    return extractUrls(text).length > 0;
  }, [extractUrls]);

  return {
    extractUrls,
    hasUrls
  };
};
