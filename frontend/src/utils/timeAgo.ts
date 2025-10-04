// timeAgo.ts - Professional time ago formatting for stories
export const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  // Days
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  // Weeks
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  // More than 4 weeks, show date
  return past.toLocaleDateString();
};

// For story header - show remaining time in 24h
export const formatStoryTimeRemaining = (createdAt: string | Date): string => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMs = now.getTime() - created.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  // Story expires after 24 hours
  const hoursRemaining = 24 - diffInHours;
  
  if (hoursRemaining <= 0) {
    return 'expired';
  }
  
  if (hoursRemaining < 1) {
    const minutesRemaining = Math.floor(hoursRemaining * 60);
    return `${minutesRemaining}m left`;
  }
  
  return `${Math.floor(hoursRemaining)}h left`;
};

// For replies and reactions - simple time ago
export const formatReplyTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'now';
  }
  
  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }
  
  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  
  // Days
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};
