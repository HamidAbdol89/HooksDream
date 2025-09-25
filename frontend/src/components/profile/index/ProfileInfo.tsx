import React, { useState } from 'react';
import { CheckCircle, MapPin, Globe, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

interface ProfileInfoProps {
  user: {
    displayName: string;
    username: string;
    isVerified?: boolean;
    pronouns?: string;
    bio?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    joinedDate?: string;
  };
  showDetails?: boolean;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ 
  user, 
  showDetails = true 
}) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const hasMetaInfo = user.location || user.website || user.joinedDate;

  return (
    <div className="mb-4 md:mb-0 text-center md:text-left">
      {/* Name và Verified - Desktop giữ nguyên */}
      <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
        <h1 className="text-xl md:text-2xl font-bold">{user.displayName}</h1>
        {user.isVerified && (
          <>
            {/* Mobile: icon đơn giản */}
            <CheckCircle className="h-5 w-5 text-blue-500 md:hidden" />
            {/* Desktop: badge như cũ */}
            <Badge variant="secondary" className="px-1 hidden md:inline-flex">
              <CheckCircle className="h-4 w-4 text-primary" />
            </Badge>
          </>
        )}
      </div>
      
      {/* Username */}
      <p className="text-muted-foreground mb-3 text-sm md:text-base">@{user.username}</p>

      {/* Pronouns - giữ nguyên */}
      {user.pronouns && (
        <Badge variant="outline" className="mb-3 text-xs md:rounded-md rounded-full">
          {user.pronouns}
        </Badge>
      )}

      {/* Bio */}
      {user.bio && (
        <div className="mb-4">
          <p className="text-foreground leading-relaxed text-sm md:text-base max-w-sm md:max-w-none mx-auto md:mx-0">
            {/* Mobile: rút gọn 100 ký tự, Desktop: 120 như cũ */}
            {showFullBio ? user.bio : `${user.bio.substring(0, window.innerWidth < 768 ? 100 : 120)}${user.bio.length > (window.innerWidth < 768 ? 100 : 120) ? '...' : ''}`}
          </p>
          {user.bio.length > (window.innerWidth < 768 ? 100 : 120) && (
            <Button 
              variant="link"
              size="sm"
              onClick={() => setShowFullBio(!showFullBio)}
              className="p-0 h-auto text-primary text-xs md:text-sm mt-1"
            >
              {/* Mobile: tiếng Việt, Desktop: tiếng Anh */}
              <span className="md:hidden">{showFullBio ? 'Thu gọn' : 'Xem thêm'}</span>
              <span className="hidden md:inline">{showFullBio ? 'Show less' : 'Show more'}</span>
            </Button>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className="md:flex md:flex-wrap md:items-center md:gap-4 md:text-sm md:text-muted-foreground">
        {/* Mobile: có thể ẩn/hiện */}
        {showDetails && hasMetaInfo && (
          <div className="md:hidden mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMeta(!showMeta)}
              className="text-xs text-muted-foreground p-1 h-auto"
            >
              Chi tiết {showMeta ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
            
            {showMeta && (
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground mt-2">
                {user.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                    >
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {user.joinedDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Tham gia {formatDate(user.joinedDate)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Desktop: hiển thị như cũ */}
        <div className="hidden md:flex md:flex-wrap md:items-center md:gap-4 md:text-sm md:text-muted-foreground">
          {user.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{user.location}</span>
            </div>
          )}
          {user.website && (
            <div className="flex items-center space-x-1">
              <Globe className="h-4 w-4" />
              <a 
                href={user.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};