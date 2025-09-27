import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { searchApi } from '@/services/api';
import { TrendingUp, Hash, BarChart3 } from 'lucide-react';

interface TrendingHashtagsProps {
  onHashtagClick: (hashtag: string) => void;
  limit?: number;
  period?: number;
}

interface TrendingHashtag {
  hashtag: string;
  count: number;
  avgEngagement: number;
  trendingScore: number;
}

export const TrendingHashtags: React.FC<TrendingHashtagsProps> = ({
  onHashtagClick,
  limit = 10,
  period = 7
}) => {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingHashtags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchApi.getTrendingHashtags({
        limit,
        period
      });

      if (response.success) {
        setHashtags(response.data || []);
      } else {
        setError('Không thể tải hashtags thịnh hành');
      }
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingHashtags();
  }, [limit, period]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendingIcon = (index: number) => {
    if (index === 0) return '🔥';
    if (index === 1) return '⚡';
    if (index === 2) return '🚀';
    return '📈';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Hashtags thịnh hành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Hashtags thịnh hành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTrendingHashtags}
              className="mt-2"
            >
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hashtags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Hashtags thịnh hành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có hashtags thịnh hành</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Hashtags thịnh hành
          <span className="text-xs text-muted-foreground font-normal">
            ({period} ngày qua)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hashtags.map((hashtag, index) => (
            <button
              key={hashtag.hashtag}
              onClick={() => onHashtagClick(hashtag.hashtag)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
            >
              {/* Ranking */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted group-hover:bg-muted/80">
                <span className="text-sm font-medium">
                  {index < 3 ? getTrendingIcon(index) : index + 1}
                </span>
              </div>

              {/* Hashtag Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-sm truncate">
                    {hashtag.hashtag}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(hashtag.count)} bài viết
                  {hashtag.avgEngagement > 0 && (
                    <span className="ml-2">
                      • {formatNumber(hashtag.avgEngagement)} tương tác TB
                    </span>
                  )}
                </div>
              </div>

              {/* Trending Score */}
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  Điểm xu hướng
                </div>
                <div className="text-sm font-medium text-primary">
                  {formatNumber(hashtag.trendingScore)}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTrendingHashtags}
            className="w-full text-xs"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Cập nhật xu hướng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingHashtags;
