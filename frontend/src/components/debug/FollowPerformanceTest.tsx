// Debug component để test follow button performance
import React, { useState, useEffect } from 'react';
import { FollowButton } from '@/components/ui/FollowButton';

interface TestUser {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  isFollowing: boolean;
  followerCount: number;
}

export const FollowPerformanceTest: React.FC = () => {
  const [testUsers] = useState<TestUser[]>([
    {
      _id: '1',
      username: 'testuser1',
      displayName: 'Test User 1',
      avatar: 'https://via.placeholder.com/40',
      isFollowing: false,
      followerCount: 100
    },
    {
      _id: '2', 
      username: 'testuser2',
      displayName: 'Test User 2',
      avatar: 'https://via.placeholder.com/40',
      isFollowing: true,
      followerCount: 250
    },
    {
      _id: '3',
      username: 'testuser3', 
      displayName: 'Test User 3',
      avatar: 'https://via.placeholder.com/40',
      isFollowing: false,
      followerCount: 75
    }
  ]);

  const [performanceMetrics, setPerformanceMetrics] = useState<{
    clickTime: number;
    responseTime: number;
    totalTime: number;
  } | null>(null);

  const handlePerformanceTest = (userId: string) => {
    const startTime = performance.now();
    
    // Measure click response time
    const clickTime = performance.now() - startTime;
    
    // Simulate measuring API response time
    setTimeout(() => {
      const responseTime = performance.now() - startTime - clickTime;
      const totalTime = performance.now() - startTime;
      
      setPerformanceMetrics({
        clickTime,
        responseTime,
        totalTime
      });
      
      console.log('🚀 Follow Performance Metrics:', {
        clickTime: `${clickTime.toFixed(2)}ms`,
        responseTime: `${responseTime.toFixed(2)}ms`, 
        totalTime: `${totalTime.toFixed(2)}ms`
      });
    }, 100);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Follow Button Performance Test</h2>
      
      {/* Performance Metrics Display */}
      {performanceMetrics && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Latest Metrics:</h3>
          <div className="text-sm text-green-700">
            <div>Click Response: {performanceMetrics.clickTime.toFixed(2)}ms</div>
            <div>API Response: {performanceMetrics.responseTime.toFixed(2)}ms</div>
            <div>Total Time: {performanceMetrics.totalTime.toFixed(2)}ms</div>
          </div>
        </div>
      )}

      {/* Test Users */}
      <div className="space-y-3">
        {testUsers.map((user) => (
          <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <img 
                src={user.avatar} 
                alt={user.displayName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-medium">{user.displayName}</div>
                <div className="text-sm text-gray-500">@{user.username}</div>
              </div>
            </div>
            
            <div onClick={() => handlePerformanceTest(user._id)}>
              <FollowButton
                userId={user._id}
                initialIsFollowing={user.isFollowing}
                initialFollowerCount={user.followerCount}
                username={user.username}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-1">Test Instructions:</h3>
        <div className="text-sm text-blue-700">
          <div>1. Click any follow button</div>
          <div>2. Check console for detailed metrics</div>
          <div>3. Look for performance improvements</div>
          <div>4. Target: &lt;100ms total response time</div>
        </div>
      </div>
    </div>
  );
};
