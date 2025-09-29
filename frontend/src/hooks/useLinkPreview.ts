// src/hooks/useLinkPreview.ts
import { useState, useCallback, useRef } from 'react';
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

interface UseLinkPreviewReturn {
  previews: LinkPreviewData[];
  isLoading: boolean;
  error: string | null;
  fetchPreview: (url: string) => Promise<LinkPreviewData | null>;
  fetchMultiplePreviews: (content: string) => Promise<LinkPreviewData[]>;
  clearPreviews: () => void;
  clearError: () => void;
}

export const useLinkPreview = (): UseLinkPreviewReturn => {
  const [previews, setPreviews] = useState<LinkPreviewData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache to avoid duplicate requests
  const cacheRef = useRef<Map<string, LinkPreviewData>>(new Map());
  const requestsRef = useRef<Map<string, Promise<LinkPreviewData | null>>>(new Map());

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPreviews = useCallback(() => {
    setPreviews([]);
    setError(null);
  }, []);

  const fetchPreview = useCallback(async (url: string): Promise<LinkPreviewData | null> => {
    try {
      // Check cache first
      const cached = cacheRef.current.get(url);
      if (cached) {
        return cached;
      }

      // Check if request is already in progress
      const existingRequest = requestsRef.current.get(url);
      if (existingRequest) {
        return existingRequest;
      }

      setIsLoading(true);
      setError(null);

      // Create new request
      const request = api.linkPreview.getPreview(url);
      requestsRef.current.set(url, request.then((response: any) => {
        if (response.success && response.data) {
          const preview = response.data as LinkPreviewData;
          cacheRef.current.set(url, preview);
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
      setIsLoading(false);
      requestsRef.current.delete(url);
    }
  }, []);

  const fetchMultiplePreviews = useCallback(async (content: string): Promise<LinkPreviewData[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.linkPreview.getMultiplePreviews(content);
      
      if (response.success && response.data) {
        const newPreviews = response.data as LinkPreviewData[];
        
        // Cache all previews
        newPreviews.forEach(preview => {
          cacheRef.current.set(preview.url, preview);
        });

        // Update previews state
        setPreviews(newPreviews);
        
        return newPreviews;
      } else {
        throw new Error(response.message || 'Failed to fetch link previews');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch link previews';
      setError(errorMessage);
      console.error('Multiple link preview error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    previews,
    isLoading,
    error,
    fetchPreview,
    fetchMultiplePreviews,
    clearPreviews,
    clearError
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
