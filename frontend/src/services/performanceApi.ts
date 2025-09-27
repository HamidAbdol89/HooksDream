// src/services/performanceApi.ts
import { performanceMonitor } from '@/utils/simplePerformance';

// Wrapper cho API calls với performance tracking
export async function trackApiCall<T>(
  apiCall: () => Promise<T>,
  endpoint: string
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    performanceMonitor.trackAPICall(endpoint, duration, true);
    return result;
    
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.trackAPICall(endpoint, duration, false);
    throw error;
  }
}

// Example usage với existing API
export const performanceApi = {
  // Wrap existing API calls
  async getPosts() {
    return trackApiCall(
      () => fetch('/api/posts').then(res => res.json()),
      'GET /api/posts'
    );
  },
  
  async createPost(data: any) {
    return trackApiCall(
      () => fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json()),
      'POST /api/posts'
    );
  },
  
  async likePost(postId: string) {
    return trackApiCall(
      () => fetch(`/api/posts/${postId}/like`, { method: 'POST' }),
      `POST /api/posts/${postId}/like`
    );
  }
};
