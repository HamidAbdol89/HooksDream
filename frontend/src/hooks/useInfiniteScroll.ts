// hooks/useInfiniteScroll.ts
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseInfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  rootMargin?: string;
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  loading,
  rootMargin = '0px'
}: UseInfiniteScrollProps) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin,
  });

  useEffect(() => {
    if (inView && hasMore && !loading) {
      onLoadMore();
    }
  }, [inView, hasMore, loading, onLoadMore]);

  return { targetRef: ref };
};