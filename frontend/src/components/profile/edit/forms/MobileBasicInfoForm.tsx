import React from 'react';
import { User, AtSign, MapPin, MessageSquare, Users, AlertCircle } from 'lucide-react';
import { ProfileFormData, ProfileFormErrors } from '@/types/profile';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ValidationIndicator } from '@/components/ui/ValidationIndicator';
import { CharacterCounter } from '@/components/ui/CharacterCounter';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import { useAppStore } from '@/store/useAppStore';

interface MobileBasicInfoFormProps {
  formData: ProfileFormData;
  errors: ProfileFormErrors;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
}

export function MobileBasicInfoForm({ formData, errors, onInputChange }: MobileBasicInfoFormProps) {
  const { user } = useAppStore();
  const usernameValidation = useUsernameValidation(formData.username || '', user?.username);

  return (
    <div className="space-y-6">
      {/* Display Name */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Display Name *</Label>
        </div>
        <Input
          value={formData.displayName || ''}
          onChange={(e) => onInputChange('displayName', e.target.value)}
          placeholder="Enter your display name"
          maxLength={50}
          className={errors.displayName ? "ring-2 ring-red-500" : ""}
        />
        {errors.displayName ? (
          <ValidationIndicator 
            status="invalid" 
            message={errors.displayName}
          />
        ) : formData.displayName && formData.displayName.length > 0 ? (
          <ValidationIndicator 
            status="valid" 
            message="Looks good!"
          />
        ) : null}
        
        <div className="flex justify-end">
          <CharacterCounter 
            current={formData.displayName?.length || 0}
            max={50}
          />
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Username *</Label>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">@</span>
          <Input
            value={formData.username || ''}
            onChange={(e) => onInputChange('username', e.target.value.toLowerCase())}
            placeholder="your_username"
            maxLength={20}
            className={`pl-7 ${errors.username ? "ring-2 ring-red-500" : ""}`}
          />
        </div>
        {errors.username ? (
          <ValidationIndicator 
            status="invalid" 
            message={errors.username}
          />
        ) : formData.username && formData.username.length > 0 ? (
          <ValidationIndicator 
            status={usernameValidation.status === 'checking' ? 'pending' : 
                   usernameValidation.status === 'available' ? 'valid' : 
                   usernameValidation.status === 'taken' || usernameValidation.status === 'invalid' ? 'invalid' : 'idle'}
            message={usernameValidation.message}
          />
        ) : null}
        
        <div className="flex justify-end">
          <CharacterCounter 
            current={formData.username?.length || 0}
            max={20}
          />
        </div>
      </div>

      {/* Pronouns */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Pronouns</Label>
        </div>
        <Input
          value={formData.pronouns || ''}
          onChange={(e) => onInputChange('pronouns', e.target.value)}
          placeholder="e.g., they/them, she/her, he/him"
          maxLength={30}
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Bio</Label>
        </div>
        <Textarea
          value={formData.bio || ''}
          onChange={(e) => onInputChange('bio', e.target.value)}
          placeholder="Tell people a bit about yourself"
          rows={3}
          maxLength={160}
          className={errors.bio ? "ring-2 ring-red-500" : ""}
        />
        {errors.bio ? (
          <ValidationIndicator 
            status="invalid" 
            message={errors.bio}
          />
        ) : formData.bio && formData.bio.length > 10 ? (
          <ValidationIndicator 
            status="valid" 
            message="Great bio!"
          />
        ) : null}
        
        <div className="flex justify-end">
          <CharacterCounter 
            current={formData.bio?.length || 0}
            max={160}
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Location</Label>
        </div>
        <Input
          value={formData.location || ''}
          onChange={(e) => onInputChange('location', e.target.value)}
          placeholder="City, Country"
          maxLength={50}
        />
      </div>

    </div>
  );
}
