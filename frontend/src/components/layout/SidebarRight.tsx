import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Bell, 
  Sparkles,
  MoreHorizontal,
  UserPlus
} from 'lucide-react';

// Temporary mock components - replace with your actual shadcn components
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-card border rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: any) => (
  <div className={`p-3 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: any) => (
  <h3 className={`text-base font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }: any) => (
  <div className={`p-3 pt-0 ${className}`}>{children}</div>
);

const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
};

const buttonSizes = {
  default: "h-9 px-3 py-2",
  sm: "h-8 rounded-md px-2 text-xs",
  lg: "h-10 rounded-md px-6",
  icon: "h-8 w-8",
};

type ButtonVariant = keyof typeof buttonVariants;
type ButtonSize = keyof typeof buttonSizes;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const baseClass =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  return (
    <button
      className={`${baseClass} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};


const Avatar = ({ src, alt, fallback, className = "" }: any) => (
  <div className={`relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full ${className}`}>
    {src ? (
      <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
        <span className="text-xs font-medium">{fallback}</span>
      </div>
    )}
  </div>
);

const badgeVariants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "border border-input bg-background",
};

type BadgeVariant = keyof typeof badgeVariants;

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  return (
    <div
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${badgeVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};


export const SidebarRight: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trending'); // 'trending', 'suggested', 'activity'

  // Mock data - simplified for space
  const mockTrendingTopics = [
    { 
      id: 1, 
      tag: '#Web3', 
      posts: 12470, 
      change: '+15%',
    },
    { 
      id: 2, 
      tag: '#AI', 
      posts: 8920, 
      change: '+8%',
    },
    { 
      id: 3, 
      tag: '#DeFi', 
      posts: 6540, 
      change: '+25%',
    }
  ];

  const mockSuggestedUsers = [
    {
      id: '1',
      name: 'Alice Cooper',
      handle: '@alice_dev',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop',
      followers: 12470,
      isFollowing: false,
    },
    {
      id: '2', 
      name: 'Bob Wilson',
      handle: '@bob_crypto',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      followers: 8920,
      isFollowing: false,
    }
  ];

  const mockRecentActivity = [
    {
      id: 1,
      type: 'like',
      user: 'Alice Cooper',
      action: 'liked your post',
      time: '2m',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop'
    },
    {
      id: 2,
      type: 'follow',
      user: 'Bob Wilson',  
      action: 'started following you',
      time: '5m',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop'
    }
  ];

  const handleFollow = (userId: string) => {
    console.log('Follow user:', userId);
  };

  const handleTopicClick = (topic: any) => {
    console.log('Navigate to topic:', topic.tag);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="h-full p-3 space-y-3">
      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          className={`px-3 py-2 text-sm font-medium ${activeTab === 'trending' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('trending')}
        >
          Trending
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium ${activeTab === 'suggested' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('suggested')}
        >
          People
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium ${activeTab === 'activity' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'trending' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockTrendingTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-primary">
                    {topic.tag}
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(topic.posts)} posts
                    </span>
                    <span className={`text-xs font-medium ${
                      topic.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {topic.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'suggested' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Who to follow</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockSuggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-2 p-1 rounded-lg hover:bg-accent transition-colors">
                <Avatar 
                  src={user.avatar}
                  alt={user.name}
                  fallback={user.name.split(' ').map(n => n[0]).join('')}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.handle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatNumber(user.followers)} followers
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={user.isFollowing ? "secondary" : "default"}
                  onClick={() => handleFollow(user.id)}
                  className="text-xs shrink-0"
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-1">
              <Bell className="w-4 h-4" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-2 p-1 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                <Avatar 
                  src={activity.avatar}
                  alt={activity.user}
                  fallback={activity.user.split(' ').map(n => n[0]).join('')}
                  className="w-7 h-7"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time} ago</p>
                </div>
                <div className="shrink-0">
                  {activity.type === 'follow' && <UserPlus className="w-3.5 h-3.5 text-blue-500" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer Links - Simplified */}
      <div className="text-xs text-muted-foreground flex flex-wrap gap-2 px-1">
        <span className="hover:text-primary cursor-pointer">Help</span>
        <span className="hover:text-primary cursor-pointer">Privacy</span>
        <span className="hover:text-primary cursor-pointer">Terms</span>
        <span className="hover:text-primary cursor-pointer">© 2024</span>
      </div>
    </div>
  );
};