import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, User, Image, Globe, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { useEditProfile } from '@/hooks/useEditProfile';
import { ActiveTab } from '@/types/profile';
import { MobileEditLayout } from '@/components/profile/edit/MobileEditLayout';
import { PageTransition } from '@/components/ui/PageTransition';

// Import form components
import { BasicInfoForm } from '@/components/profile/edit/forms/BasicInfoForm';
import { ImagesForm } from '@/components/profile/edit/forms/ImagesForm';
import { SocialForm } from '@/components/profile/edit/forms/SocialForm';
import { AccountForm } from '@/components/profile/edit/forms/AccountForm';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mock onSave function for useEditProfile
  const handleSave = async (updatedData: any) => {
    try {
      // Here you would call your API
      console.log('Saving profile data:', updatedData);
      
      // Update global state
      updateUser(updatedData);
      
      // Reset unsaved changes
      setHasUnsavedChanges(false);
      
      // Show success message (you can add toast here)
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  };

  const {
    formData,
    errors,
    isLoading,
    imageUploading,
    resolvedUser,
    handleInputChange,
    handleImageUpload,
    handleSubmit
  } = useEditProfile({ 
    isOpen: true, 
    user: currentUser!, 
    onSave: handleSave, 
    onClose: () => navigate(-1) 
  });

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate(-1);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSubmit(e);
      // Navigate back on success
      navigate(-1);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleInputChangeWithTracking = (field: keyof typeof formData, value: string) => {
    handleInputChange(field, value);
    setHasUnsavedChanges(true);
  };

  const handleImageUploadWithTracking = (file: File, type: 'avatar' | 'coverImage') => {
    handleImageUpload(file, type);
    setHasUnsavedChanges(true);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in to edit your profile</h2>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  // ✅ Mobile Layout với smooth slide-up animation
  if (isMobile) {
    return (
      <PageTransition type="slide-up" duration={400} className="h-screen">
        <MobileEditLayout
          formData={formData}
          errors={errors}
          isLoading={isLoading}
          imageUploading={imageUploading}
          hasUnsavedChanges={hasUnsavedChanges}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onInputChange={handleInputChangeWithTracking}
          onImageUpload={handleImageUploadWithTracking}
          onSave={() => handleFormSubmit(new Event('submit') as any)}
          onCancel={handleGoBack}
        />
      </PageTransition>
    );
  }

  // ✅ Desktop Layout với fade animation
  return (
    <PageTransition type="fade" duration={300}>
      <div className="min-h-screen bg-background">
      {/* Full Width Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Edit Profile</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Update your profile information and settings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-amber-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Unsaved changes
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGoBack}
                disabled={isLoading}
                className="hidden sm:flex"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <Button
                type="submit"
                onClick={handleFormSubmit}
                disabled={isLoading || hasErrors}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
        <form onSubmit={handleFormSubmit}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
            {/* Tab Navigation */}
            <Card className="mb-6">
              <CardContent className="p-4 sm:p-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Basic Info</span>
                    <span className="sm:hidden">Basic</span>
                  </TabsTrigger>
                  <TabsTrigger value="images" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span className="hidden sm:inline">Images</span>
                    <span className="sm:hidden">Photos</span>
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Social</span>
                    <span className="sm:hidden">Links</span>
                  </TabsTrigger>
                  <TabsTrigger value="account" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Account</span>
                    <span className="sm:hidden">Settings</span>
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            {/* Tab Content - Optimized for wide screens */}
            <div className="space-y-6">
              <TabsContent value="basic">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Basic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BasicInfoForm 
                          formData={formData} 
                          errors={errors} 
                          onInputChange={handleInputChangeWithTracking} 
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Preview Panel for Desktop */}
                  <div className="hidden lg:block">
                    <Card className="sticky top-24">
                      <CardHeader>
                        <CardTitle className="text-base">Profile Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                              {formData.avatar ? (
                                <img src={formData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{formData.displayName || 'Your Name'}</p>
                              <p className="text-sm text-muted-foreground">@{formData.username || 'username'}</p>
                            </div>
                          </div>
                          {formData.bio && (
                            <p className="text-sm text-muted-foreground">{formData.bio}</p>
                          )}
                          <div className="text-xs text-muted-foreground space-y-1">
                            {formData.location && <p>📍 {formData.location}</p>}
                            {formData.website && <p>🔗 {formData.website}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5" />
                      Profile Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImagesForm 
                      formData={formData} 
                      imageUploading={imageUploading} 
                      onImageUpload={handleImageUploadWithTracking} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Social Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SocialForm 
                      formData={formData} 
                      errors={errors} 
                      onInputChange={handleInputChangeWithTracking} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AccountForm 
                      formData={formData} 
                      errors={errors} 
                      onInputChange={handleInputChangeWithTracking} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Error Summary */}
            {hasErrors && (
              <Card className="mt-6 border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <X className="h-4 w-4" />
                    <span className="font-medium">Please fix the following errors:</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-destructive/80">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-destructive rounded-full" />
                        <span className="capitalize">{field}:</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Success Message */}
            {!hasUnsavedChanges && !hasErrors && (
              <Card className="mt-6 border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">All changes saved successfully!</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </Tabs>
        </form>
      </div>

      {/* Mobile Bottom Actions */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoBack}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleFormSubmit}
            disabled={isLoading || hasErrors}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Padding */}
      <div className="sm:hidden h-20" />
        </div>
      </div>
    </PageTransition>
  );
}
