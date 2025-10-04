import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Bell, 
  Mail, 
  Bookmark, 
  User, 
  Settings,
  TrendingUp,
  Hash,
  Users,
  UserPlus,
  Sparkles
} from 'lucide-react';

const Card = ({ children, className = "" }: any) => (
  <div className={`bg-card border rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: any) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: any) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }: any) => (
  <div className={`p-4 pt-0 ${className}`}>{children}</div>
);

const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
};

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
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
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {src ? (
      <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
        <span className="text-sm font-medium">{fallback}</span>
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${badgeVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};


const SidebarLeft: React.FC = () => {
  const [activeItem, setActiveItem] = useState('home');
  const navigate = useNavigate();

 
  // TODO: Move to constants file or fetch from API
  const navigationItems = [
    { id: 'stories', icon: Sparkles, label: 'Stories', badge: null, route: '/stories' },
    { id: 'trending', icon: TrendingUp, label: 'Trending', badge: null, route: '/trending' },
    { id: 'following', icon: Users, label: 'Following', badge: null, route: '/following' },
    { id: 'friends', icon: UserPlus, label: 'Gợi ý kết bạn', badge: null, route: '/friend' },
    { id: 'topics', icon: Hash, label: 'Topics', badge: null, route: '/topics' },
    { id: 'bookmarks', icon: Bookmark, label: 'Đã lưu', badge: null, route: '/bookmarks' },
    { id: 'profile', icon: User, label: 'Hồ sơ', badge: null, route: '/profile/me' },
    { id: 'settings', icon: Settings, label: 'Cài đặt', badge: null, route: '/settings' },
  ];

  // TODO: Create CreatePostModal component and implement functionality
  const handleCreatePost = () => {
    console.log('Open create post modal');
  };

  // TODO: Implement navigation functionality
  const handleNavigation = (item: any) => {
    setActiveItem(item.id);
    navigate(item.route);
  };

  // TODO: Implement quick action functionality
  const handleQuickAction = (type: string) => {
    console.log('Quick action:', type);
    // Implement different post types (photo, video, audio, text)
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto">
   

 {/* Navigation Menu */}
<Card className="w-full max-h-[400px]">
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Navigation</CardTitle>
  </CardHeader>
  <CardContent className="space-y-1">
    {navigationItems.map((item) => (
      <button
        key={item.id}
        onClick={() => handleNavigation(item)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
          activeItem === item.id
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <div className="flex items-center space-x-3">
          <item.icon className="w-5 h-5" />
          <span className="text-sm">{item.label}</span>
        </div>
        {item.badge && (
          <Badge variant="destructive" className="text-xs">
            {item.badge}
          </Badge>
        )}
      </button>
    ))}
  </CardContent>
</Card>


        
     
      </div>

  );
};

export default SidebarLeft;