import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { ProfileFormData, ProfileFormErrors, VALIDATION_RULES } from '@/types/profile';

interface BasicInfoFormProps {
  formData: ProfileFormData;
  errors: ProfileFormErrors;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
}

export function BasicInfoForm({ formData, errors, onInputChange }: BasicInfoFormProps) {
  const { t } = useTranslation("common");
  
  return (
    <div className="space-y-6">

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("basic.display_name") || "Display Name"} *</Label>
        <Input
          id="displayName"
          type="text"
          value={formData.displayName || ''}
          onChange={(e) => onInputChange('displayName', e.target.value)}
          placeholder={t("basic.display_name_placeholder") || "Enter your display name"}
          className={errors.displayName ? 'border-destructive' : ''}
          maxLength={50}
        />
        {errors.displayName && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.displayName}
          </div>
        )}
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {t("basic.display_name_desc") || "This is how your name will appear to others"}
          </p>
          <Badge variant="outline" className="text-xs">{formData.displayName?.length || 0}/50</Badge>
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">{t("basic.username") || "Username"} *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
          <Input
            id="username"
            type="text"
            value={formData.username || ''}
            onChange={(e) => onInputChange('username', e.target.value.toLowerCase())}
            placeholder={t("basic.username_placeholder") || "your_username"}
            className={`pl-7 ${errors.username ? 'border-destructive' : ''}`}
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
          {t("basic.username_rules") || "Only letters, numbers, and underscores allowed"}
        </p>
        <Badge variant="outline" className="text-xs">{formData.username?.length || 0}/20</Badge>
      </div>

      {/* Pronouns */}
      <div className="space-y-2">
        <Label htmlFor="pronouns">{t("basic.pronouns") || "Pronouns"}</Label>
        <Input
          id="pronouns"
          type="text"
          value={formData.pronouns || ''}
          onChange={(e) => onInputChange('pronouns', e.target.value)}
          placeholder={t("basic.pronouns_placeholder") || "e.g., they/them, she/her, he/him"}
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground">
          {t("basic.pronouns_desc") || "Optional. Help others know how to refer to you"}
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">{t("basic.bio") || "Bio"}</Label>
        <Textarea
          id="bio"
          value={formData.bio || ''}
          onChange={(e) => onInputChange('bio', e.target.value)}
          placeholder={t("basic.bio_placeholder") || "Tell people a bit about yourself"}
          rows={4}
          className={`resize-none ${errors.bio ? 'border-destructive' : ''}`}
          maxLength={160}
        />
        {errors.bio && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errors.bio}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {t("basic.bio_desc") || "Write a short description about yourself"}
        </p>
        <Badge variant="outline" className="text-xs">{formData.bio?.length || 0}/160</Badge>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">{t("basic.location") || "Location"}</Label>
        <Input
          id="location"
          type="text"
          value={formData.location || ''}
          onChange={(e) => onInputChange('location', e.target.value)}
          placeholder={t("basic.location_placeholder") || "City, Country"}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {t("basic.location_desc") || "Where are you located?"}
        </p>
      </div>
      
    </div>
  );
}