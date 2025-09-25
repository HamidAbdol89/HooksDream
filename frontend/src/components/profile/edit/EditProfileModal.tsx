import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { ProfileTabs } from './ProfileTabs';
import { BasicInfoForm } from './forms/BasicInfoForm';
import { ImagesForm } from './forms/ImagesForm';
import { SocialForm } from './forms/SocialForm';
import { AccountForm } from './forms/AccountForm';
import { useEditProfile } from '@/hooks/useEditProfile';
import { User } from '@/store/useAppStore';
import { useTranslation } from "react-i18next";

// Import ActiveTab type from ProfileTabs to ensure consistency
import type { ActiveTab } from './ProfileTabs';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedData: Partial<User>) => Promise<void>;
}

export default function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const { toast } = useToast();
  const {
    formData,
    errors,
    isLoading,
    activeTab,
    imageUploading,
    resolvedUser,
    setActiveTab,
    handleInputChange,
    handleImageUpload,
    handleSubmit
  } = useEditProfile({ isOpen, user, onSave, onClose });

  const { t } = useTranslation("common");

  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmitWithSync = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await handleSubmit(e);
      
      if (result) {
        toast({
          title: t("edit_profile.success_title") || "Thành công",
          description: t("edit_profile.success_message") || "Thông tin profile đã được cập nhật",
        });
        
        // Close modal after successful save
        onClose();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: t("edit_profile.error_title") || "Lỗi",
        description: t("edit_profile.error_message") || "Không thể cập nhật profile",
        variant: 'destructive',
      });
    }
  };

  // Don't render if no resolved user
  if (!resolvedUser) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl w-full h-screen sm:h-auto max-h-screen sm:max-h-[90vh] p-0 m-0 sm:m-4 rounded-none sm:rounded-lg border-0 sm:border flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-2 sm:py-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <DialogTitle className="text-base sm:text-lg font-semibold">
            {t("edit_profile.title") || "Edit Profile"}
          </DialogTitle>
          <DialogDescription className="hidden sm:block text-sm text-muted-foreground">
            {t("edit_profile.description") || "Update your profile information"}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs navigation */}
        <div className="px-4 sm:px-6 pt-0 bg-background border-b sticky top-0 sm:top-0 z-10">
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Scrollable form */}
        <ScrollArea className="flex-1 overflow-auto px-4 sm:px-6">
          <form onSubmit={handleSubmitWithSync} className="py-4 sm:py-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
              <TabsContent value="basic">
                <BasicInfoForm 
                  formData={formData} 
                  errors={errors} 
                  onInputChange={handleInputChange} 
                />
              </TabsContent>
              <TabsContent value="images">
                <ImagesForm 
                  formData={formData} 
                  imageUploading={imageUploading} 
                  onImageUpload={handleImageUpload} 
                />
              </TabsContent>
              <TabsContent value="social">
                <SocialForm 
                  formData={formData} 
                  errors={errors} 
                  onInputChange={handleInputChange} 
                />
              </TabsContent>
              <TabsContent value="account">
                <AccountForm 
                  formData={formData} 
                  errors={errors} 
                  onInputChange={handleInputChange} 
                />
              </TabsContent>
            </Tabs>
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-background/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {hasErrors && (
            <div className="flex items-center gap-2 text-sm text-destructive mb-2 sm:mb-0">
              <AlertTriangle className="h-4 w-4" />
              <span>{t("edit_profile.fix_errors") || "Please fix the errors above"}</span>
            </div>
          )}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-initial rounded-full px-6 py-2 text-sm sm:text-base hover:bg-muted/20 transition"
            >
              <span>{t("commonv2.cancel") || "Cancel"}</span>
            </Button>

            <Button
              type="submit"
              onClick={handleSubmitWithSync}
              disabled={isLoading || hasErrors}
              className="flex-1 sm:flex-initial sm:min-w-[120px] rounded-full px-6 py-2 text-sm sm:text-base hover:opacity-90 transition flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">{t("commonv2.saving") || "Saving..."}</span>
                  <span className="sm:hidden">{t("commonv2.save") || "Save"}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t("commonv2.save_changes") || "Save Changes"}</span>
                  <span className="sm:hidden">{t("commonv2.save") || "Save"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}