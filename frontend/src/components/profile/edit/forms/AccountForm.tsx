import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertCircle, Mail, Phone, Shield } from 'lucide-react';

import { ProfileFormData, ProfileFormErrors } from '@/types/profile';

interface AccountFormProps {
  formData: ProfileFormData;
  errors: ProfileFormErrors;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
}

export function AccountForm({ formData, errors, onInputChange }: AccountFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            This information is private and will not be displayed on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => onInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                placeholder="your@email.com"
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors.email}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Used for important account notifications and password recovery
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => onInputChange('phone', e.target.value)}
                className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                placeholder="+1 (123) 456-7890"
              />
            </div>
            {errors.phone && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors.phone}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Optional. Used for account verification and security alerts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Privacy & Security</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your email and phone number are kept private and secure. We use this information only for account security, 
                important notifications, and to help you recover your account if needed. We never share this information 
                with third parties or display it on your public profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Settings</CardTitle>
          <CardDescription>
            Quick overview of your account security status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div className="font-medium">Email Verified</div>
                <div className="text-muted-foreground text-xs">
                  {formData.email ? 'Email provided' : 'No email set'}
                </div>
              </div>
              <div className={`h-2 w-2 rounded-full ${formData.email ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div className="font-medium">Phone Added</div>
                <div className="text-muted-foreground text-xs">
                  {formData.phone ? 'Phone provided' : 'No phone set'}
                </div>
              </div>
              <div className={`h-2 w-2 rounded-full ${formData.phone ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}