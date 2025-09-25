import React from 'react';
import { Separator } from '@/components/ui/separator';

interface ProfileStatsProps {
  postCount: number;
  followerCount: number;
  followingCount: number;
  userId: string; 
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  postCount,
  followerCount,
  followingCount,
  onOpenFollowers,
  onOpenFollowing
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <>
      <Separator className="my-6" />
      <div className="flex justify-around text-center">
        <div className="flex flex-col items-center">
          <div className="text-base font-medium">{formatNumber(postCount)}</div>
          <div className="text-xs text-muted-foreground">Bài viết</div>
        </div>
        
        {/* ✅ SỬA: Đảm bảo button có onClick handler */}
        <button 
          className="flex flex-col items-center p-0 text-center hover:text-primary transition-colors cursor-pointer"
          onClick={onOpenFollowers} // ✅ Đã có handler
        >
          <div className="text-base font-medium">{formatNumber(followerCount)}</div>
          <div className="text-xs text-muted-foreground">Người theo dõi</div>
        </button>
        
        <button 
          className="flex flex-col items-center p-0 text-center hover:text-primary transition-colors cursor-pointer"
          onClick={onOpenFollowing} // ✅ Đã có handler
        >
          <div className="text-base font-medium">{formatNumber(followingCount)}</div>
          <div className="text-xs text-muted-foreground">Đang theo dõi</div>
        </button>
      </div>
    </>
  );
};