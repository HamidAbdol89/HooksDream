import React, { useState, useRef, useEffect } from 'react';
import { Save, X, User, Image, Globe, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ActiveTab, ProfileFormData, ProfileFormErrors } from '@/types/profile';

// Import mobile-optimized form components
import { MobileBasicInfoForm } from './forms/MobileBasicInfoForm';
import { ImagesForm } from './forms/ImagesForm';
import { SocialForm } from './forms/SocialForm';
import { AccountForm } from './forms/AccountForm';

interface MobileEditLayoutProps {
  formData: ProfileFormData;
  errors: ProfileFormErrors;
  isLoading: boolean;
  imageUploading: 'avatar' | 'cover' | null;
  hasUnsavedChanges: boolean;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
  onImageUpload: (file: File, type: 'avatar' | 'coverImage') => void;
  onSave: () => void;
  onCancel: () => void;
}

const TABS = [
  { id: 'basic' as ActiveTab, label: 'Basic', icon: User, shortLabel: 'Info' },
  { id: 'images' as ActiveTab, label: 'Images', icon: Image, shortLabel: 'Photos' },
  { id: 'social' as ActiveTab, label: 'Social', icon: Globe, shortLabel: 'Links' },
  { id: 'account' as ActiveTab, label: 'Account', icon: Settings, shortLabel: 'Settings' },
];

export const MobileEditLayout: React.FC<MobileEditLayoutProps> = ({
  formData,
  errors,
  isLoading,
  imageUploading,
  hasUnsavedChanges,
  activeTab,
  onTabChange,
  onInputChange,
  onImageUpload,
  onSave,
  onCancel
}) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const currentTabIndex = TABS.findIndex(tab => tab.id === activeTab);
  const hasErrors = Object.keys(errors).length > 0;


  // ✅ Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return;
    currentX.current = e.touches[0].clientX;
    const diffX = startX.current - currentX.current;
    
    // Visual feedback during swipe
    if (Math.abs(diffX) > 10) {
      setSwipeDirection(diffX > 0 ? 'left' : 'right');
    }
  };

  const handleTouchEnd = () => {
    if (!startX.current || !currentX.current) return;
    
    const diffX = startX.current - currentX.current;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentTabIndex < TABS.length - 1) {
        // Swipe left - next tab
        navigateToTab(TABS[currentTabIndex + 1].id);
      } else if (diffX < 0 && currentTabIndex > 0) {
        // Swipe right - previous tab
        navigateToTab(TABS[currentTabIndex - 1].id);
      }
    }
    
    // Reset
    startX.current = 0;
    currentX.current = 0;
    setSwipeDirection(null);
  };

  const navigateToTab = (tabId: ActiveTab) => {
    onTabChange(tabId);
  };

  const renderTabContent = () => {
    const contentProps = {
      formData,
      errors,
      onInputChange
    };

    switch (activeTab) {
      case 'basic':
        return <MobileBasicInfoForm {...contentProps} />;
      case 'images':
        return <ImagesForm {...contentProps} imageUploading={imageUploading} onImageUpload={onImageUpload} />;
      case 'social':
        return <SocialForm {...contentProps} />;
      case 'account':
        return <AccountForm {...contentProps} />;
      default:
        return null;
    }
  };
  return (
    <div className="h-screen bg-background flex flex-col">

      {/* Ultra Compact Tab Navigation */}
      <div className="bg-background border-b">
        <div className="flex items-center px-2 py-2">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            
            return (
              <button
                key={tab.id}
                onClick={() => navigateToTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
        <div className="h-0.5 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentTabIndex + 1) / TABS.length) * 100}%` }}
          />
        </div>
      </div>


      {/* Content Area with Swipe Support */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-y-auto ${
          swipeDirection === 'left' ? 'translate-x-[-5px] transition-transform duration-150' : 
          swipeDirection === 'right' ? 'translate-x-[5px] transition-transform duration-150' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4 pb-24">
          {/* Simple Tab Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              {React.createElement(TABS[currentTabIndex].icon, { className: "h-5 w-5 text-primary" })}
              <h2 className="text-lg font-semibold">{TABS[currentTabIndex].label}</h2>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {renderTabContent()}
          </div>

          {/* Error Summary for Mobile */}
          {hasErrors && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <X className="h-4 w-4" />
                <span className="font-medium">Please fix these errors:</span>
              </div>
              <div className="space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <div key={field} className="flex items-start gap-2 text-sm text-red-600">
                    <div className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span><span className="font-medium capitalize">{field}:</span> {error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-background/95 backdrop-blur border-t p-4">
        {hasUnsavedChanges && (
          <div className="flex items-center justify-center gap-1 text-xs text-amber-600 mb-3">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Unsaved changes
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onSave}
            disabled={isLoading || hasErrors}
            isLoading={isLoading}
            className="flex-1"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
