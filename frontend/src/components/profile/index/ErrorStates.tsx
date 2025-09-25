import { AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const ProfileError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="p-6">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive mb-4">Error loading profile: {error}</p>
        <Button onClick={onRetry}>
          Retry
        </Button>
      </div>
    </Card>
  </div>
);

export const UserNotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="p-6">
      <div className="text-center">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">User not found</p>
      </div>
    </Card>
  </div>
);