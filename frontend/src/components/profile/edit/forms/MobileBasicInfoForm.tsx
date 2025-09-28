import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, User, AtSign, MapPin, MessageSquare, Users } from 'lucide-react';
import { ProfileFormData, ProfileFormErrors, VALIDATION_RULES } from '@/types/profile';

interface MobileBasicInfoFormProps {
  formData: ProfileFormData;
  errors: ProfileFormErrors;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
}

export function MobileBasicInfoForm({ formData, errors, onInputChange }: MobileBasicInfoFormProps) {
  return (
    <div className="space-y-6">
      {/* Display Name */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <Label htmlFor="displayName" className="text-base font-medium">Display Name *</Label>
        </div>
        <Input
          id="displayName"
          type="text"
          value={formData.displayName || ''}
          onChange={(e) => onInputChange('displayName', e.target.value)}
          placeholder="Enter your display name"
          className={`text-base py-3 ${errors.displayName ? 'border-destructive' : ''}`}
          maxLength={50}
        />
        {errors.displayName && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.displayName}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.displayName?.length || 0}/50
        </p>
      </div>

      {/* Username */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-primary" />
          <Label htmlFor="username" className="text-base font-medium">Username *</Label>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-base">@</span>
          <Input
            id="username"
            type="text"
            value={formData.username || ''}
            onChange={(e) => onInputChange('username', e.target.value.toLowerCase())}
            placeholder="your_username"
            className={`pl-8 text-base py-3 ${errors.username ? 'border-destructive' : ''}`}
            maxLength={20}
          />
        </div>
        {errors.username && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.username}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.username?.length || 0}/20
        </p>
      </div>

      {/* Pronouns */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <Label htmlFor="pronouns" className="text-base font-medium">Pronouns</Label>
        </div>
        <Input
          id="pronouns"
          type="text"
          value={formData.pronouns || ''}
          onChange={(e) => onInputChange('pronouns', e.target.value)}
          placeholder="e.g., they/them, she/her, he/him"
          className="text-base py-3"
          maxLength={30}
        />
      </div>

      {/* Bio */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <Label htmlFor="bio" className="text-base font-medium">Bio</Label>
        </div>
        <Textarea
          id="bio"
          value={formData.bio || ''}
          onChange={(e) => onInputChange('bio', e.target.value)}
          placeholder="Tell people a bit about yourself"
          rows={4}
          className={`resize-none text-base ${errors.bio ? 'border-destructive' : ''}`}
          maxLength={160}
        />
        {errors.bio && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.bio}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.bio?.length || 0}/160
        </p>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <Label htmlFor="location" className="text-base font-medium">Location</Label>
        </div>
        <Input
          id="location"
          type="text"
          value={formData.location || ''}
          onChange={(e) => onInputChange('location', e.target.value)}
          placeholder="City, Country"
          className="text-base py-3"
          maxLength={50}
        />
      </div>

    </div>
  );
}
