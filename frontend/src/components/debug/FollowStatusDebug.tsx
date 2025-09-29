// Debug component để test follow status
import React, { useState, useEffect } from 'react';
import { userApi } from '@/services/api';

interface DebugUser {
  _id: string;
  username: string;
  displayName: string;
  isFollowing: boolean;
  followerCount: number;
}

export const FollowStatusDebug: React.FC<{ userId: string }> = ({ userId }) => {
  const [debugData, setDebugData] = useState<{
    user: DebugUser | null;
    apiResponse: any;
    error: string | null;
    loading: boolean;
  }>({
    user: null,
    apiResponse: null,
    error: null,
    loading: false
  });

  const fetchUserProfile = async () => {
    setDebugData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔍 Fetching profile for userId:', userId);
      const response = await userApi.getProfile(userId);
      
      console.log('📡 API Response:', response);
      
      if (response.success && response.data) {
        setDebugData({
          user: {
            _id: response.data._id,
            username: response.data.username,
            displayName: response.data.displayName,
            isFollowing: response.data.isFollowing,
            followerCount: response.data.followerCount
          },
          apiResponse: response,
          error: null,
          loading: false
        });
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      setDebugData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      }));
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleRefresh = () => {
    fetchUserProfile();
  };

  if (debugData.loading) {
    return <div className="p-4 bg-yellow-50 rounded-lg">Loading profile data...</div>;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Follow Status Debug</h3>
        <button 
          onClick={handleRefresh}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {debugData.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="font-semibold text-red-800">Error:</div>
          <div className="text-red-700 text-sm">{debugData.error}</div>
        </div>
      )}

      {debugData.user && (
        <div className="space-y-3">
          <div className="p-3 bg-white rounded border">
            <h4 className="font-semibold mb-2">User Data:</h4>
            <div className="text-sm space-y-1">
              <div><strong>ID:</strong> {debugData.user._id}</div>
              <div><strong>Username:</strong> {debugData.user.username}</div>
              <div><strong>Display Name:</strong> {debugData.user.displayName}</div>
              <div className="flex items-center gap-2">
                <strong>Is Following:</strong> 
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  debugData.user.isFollowing 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {debugData.user.isFollowing ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div><strong>Follower Count:</strong> {debugData.user.followerCount}</div>
            </div>
          </div>

          <div className="p-3 bg-white rounded border">
            <h4 className="font-semibold mb-2">Raw API Response:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(debugData.apiResponse, null, 2)}
            </pre>
          </div>

          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Debug Info:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• Check console logs for detailed API calls</div>
              <div>• Backend should log follow status checks</div>
              <div>• Verify token is being sent correctly</div>
              <div>• isFollowing should reflect actual follow status</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
