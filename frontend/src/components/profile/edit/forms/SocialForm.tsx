import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Globe, User } from 'lucide-react';

import { ProfileFormData, ProfileFormErrors } from '@/types/profile';

interface SocialFormProps {
  formData: ProfileFormData;
  errors: ProfileFormErrors;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
}

export function SocialForm({ formData, errors, onInputChange }: SocialFormProps) {
  return (
    <div className="space-y-6">
      {/* Website - Only field that should be in Links tab */}
      <div className="space-y-2">
        <Label htmlFor="website" className="text-sm font-medium">
          Website
        </Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="website"
            type="url"
            value={formData.website || ''}
            onChange={(e) => onInputChange('website', e.target.value)}
            className={`pl-10 ${errors.website ? 'border-destructive' : ''}`}
            placeholder="https://your-website.com"
          />
        </div>
        {errors.website && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.website}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Add your personal website, portfolio, or blog
        </p>
      </div>

      {/* Profile Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="h-12 w-12 border flex-shrink-0">
              <AvatarImage src={formData.avatar || '/default-avatar.png'} alt="Profile preview" />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">
                  {formData.displayName || 'Your Name'}
                </h3>
                {formData.pronouns && (
                  <Badge variant="outline" className="text-xs">
                    {formData.pronouns}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                @{formData.username || 'username'}
              </p>
              
              {formData.bio && (
                <p className="text-sm text-foreground leading-relaxed">
                  {formData.bio}
                </p>
              )}
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
                {formData.location && (
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{formData.location}</span>
                  </div>
                )}
                {formData.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <a 
                      href={formData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Social Links (Future Feature) */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Social Links
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect your Twitter, LinkedIn, GitHub, and other social profiles.
            This feature will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}