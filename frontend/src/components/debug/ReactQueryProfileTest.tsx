import React from 'react';
import { useProfileWithPosts, usePrefetchProfile } from '@/hooks/useProfileQuery';
import { useAppStore } from '@/store/useAppStore';

interface ReactQueryProfileTestProps {
  userId: string;
}

export const ReactQueryProfileTest: React.FC<ReactQueryProfileTestProps> = ({ userId }) => {
  const currentUser = useAppStore(state => state.user);
  const prefetchProfile = usePrefetchProfile();
  
  const {
    user,
    profile,
    posts,
    loading,
    error,
    refetch
  } = useProfileWithPosts(userId, currentUser?._id);

  const handlePrefetch = () => {
    // Test prefetching another user
    prefetchProfile('test-user-id');
    console.log('🚀 Prefetched profile for smooth navigation');
  };

  const handleRefetch = () => {
    refetch();
    console.log('🔄 Manual refetch triggered');
  };

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-800">⚡ React Query Loading...</h3>
        <p className="text-blue-600">Testing aggressive caching performance</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <h3 className="font-bold text-red-800">❌ Error</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={handleRefetch}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg space-y-3">
      <h3 className="font-bold text-green-800">⚡ React Query Success!</h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>User:</strong> {user?.displayName || 'N/A'}
        </div>
        <div>
          <strong>Posts:</strong> {posts.length}
        </div>
        <div>
          <strong>Followers:</strong> {user?.followerCount || 0}
        </div>
        <div>
          <strong>Following:</strong> {user?.followingCount || 0}
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleRefetch}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          🔄 Refetch
        </button>
        <button 
          onClick={handlePrefetch}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
        >
          🚀 Test Prefetch
        </button>
      </div>

      <div className="text-xs text-gray-600">
        <p>✅ Data loaded with React Query aggressive caching</p>
        <p>✅ Subsequent loads will be instant (5min cache)</p>
        <p>✅ Optimistic updates enabled</p>
      </div>
    </div>
  );
};
