// src/services/performanceApi.ts
import { performanceMonitor } from '@/utils/simplePerformance';

// Wrapper cho API calls với performance tracking (non-blocking logging)
export async function trackApiCall<T>(
  apiCall: () => Promise<T>,
  endpoint: string
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;

    // log async để không block
    queueMicrotask(() => {
      performanceMonitor.trackAPICall(endpoint, duration, true);
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    queueMicrotask(() => {
      performanceMonitor.trackAPICall(endpoint, duration, false);
    });

    throw error;
  }
}

// Wrapper fetch helper (có timeout)
async function safeFetch(url: string, options?: RequestInit, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.headers.get("content-type")?.includes("application/json")
      ? res.json()
      : res.text();
  } finally {
    clearTimeout(timer);
  }
}

// Example usage với existing API
export const performanceApi = {
  async getPosts() {
    return trackApiCall(() => safeFetch('/api/posts'), 'GET /api/posts');
  },

  async createPost(data: any) {
    return trackApiCall(
      () =>
        safeFetch('/api/posts', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
        }),
      'POST /api/posts'
    );
  },

  async likePost(postId: string) {
    return trackApiCall(
      () => safeFetch(`/api/posts/${postId}/like`, { method: 'POST' }),
      `POST /api/posts/${postId}/like`
    );
  },
};
