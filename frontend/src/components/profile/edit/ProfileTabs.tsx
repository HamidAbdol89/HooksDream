import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Image, Globe, Settings } from 'lucide-react';
import { useTranslation } from "react-i18next";

// Type aligned with useEditProfile hook
export type ActiveTab = 'basic' | 'images' | 'social' | 'account';

interface ProfileTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const { t } = useTranslation("common");

  const TAB_CONFIG = [
    { 
      id: 'basic' as ActiveTab, 
      label: t("tabs.basic_info") || "Basic Info", 
      icon: User,
      description: t("tabs.basic_info_desc") || "Name, bio, location"
    },
    { 
      id: 'images' as ActiveTab, 
      label: t("tabs.photos") || "Images", 
      icon: Image,
      description: t("tabs.photos_desc") || "Avatar & cover"
    },
    { 
      id: 'social' as ActiveTab, 
      label: t("tabs.social") || "Social", 
      icon: Globe,
      description: t("tabs.social_desc") || "Links & website"
    },
    { 
      id: 'account' as ActiveTab, 
      label: t("tabs.account") || "Account", 
      icon: Settings,
      description: t("tabs.account_desc") || "Contact & privacy"
    }
  ];

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ActiveTab)} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-auto bg-muted/50">
        {TAB_CONFIG.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="
                flex flex-col items-center gap-1 
                py-2 sm:py-3 px-1 sm:px-2 
                text-xs sm:text-sm
                data-[state=active]:bg-background 
                data-[state=active]:text-foreground
                data-[state=active]:shadow-sm
                transition-all duration-200
              "
            >
              <IconComponent className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="font-medium leading-tight text-center">
                {tab.label}
              </span>
              <span className="hidden sm:block text-xs text-muted-foreground font-normal leading-tight text-center">
                {tab.description}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}