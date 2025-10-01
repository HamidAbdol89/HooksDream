// src/components/layout/BottomNav.tsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, X } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { SettingsModal } from './setting/SettingsModal';
import { useNavItems } from './NavItems';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocial } from '../../hooks/useSocial';
import { Badge } from '@/components/ui/badge';
import { UserProfileSheet } from './UserProfileSheet';

interface UserType {
  id?: string;
  _id?: string;
  name?: string;
  profileImage?: string;
}

interface BottomNavProps {
  isInChat?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ isInChat = false }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, isConnected } = useAppStore();
  const { logout } = useGoogleAuth();
  const typedUser = user as UserType;
  
  // 🔥 SỬ DỤNG useSocial THAY VÌ useAppStore cho profile data
  const navItems = useNavItems();
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSettingsView, setCurrentSettingsView] = useState<'main' | 'language' | 'theme'>('main');

  const openSettings = useCallback((view: 'main' | 'language' | 'theme' = 'main') => {
    setIsSettingsOpen(true);
    setCurrentSettingsView(view);
    setIsUserSheetOpen(false);
  }, []);

  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  // Simple ripple effect
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const existingRipple = button.querySelector(".ripple");
    if (existingRipple) existingRipple.remove();

    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  };

  // Nếu đang trong chat, ẩn bottom nav
  if (isInChat) {
    return null;
  }

  return (
    <>
      {/* Navigation items - Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-background/95 backdrop-blur-xl rounded-t-3xl p-2 border-t border-border/50 transition-all duration-300 mx-auto max-w-md">
          <div className="flex justify-around items-center">
            {navItems.map((item, index) => {
              const isActive = location.pathname === (
                item.label === t('nav.home') ? '/feed' :
                item.label === t('nav.friends') ? '/friend' :
                item.label === t('nav.create') ? '/post' :
                item.label === t('nav.notifications') ? '/notifications' :
                item.label === t('nav.messages') ? '/messages' : ''
              );
              
              return (
                <button
                  key={index}
                  onClick={(e) => { 
                    createRipple(e); 
                    item.onClick(); 
                  }}
                  className="relative overflow-hidden flex items-center gap-2 sm:gap-3 transition-all duration-500 rounded-full px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  {/* Active background highlight */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-primary text-primary-foreground rounded-full shadow-md"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                
                  {/* Icon with scale animation */}
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`relative z-10 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    {item.icon}
                  </motion.div>
                
                  {/* Animated text label */}
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.span
                        key={`active-${index}`}
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "auto" }}
                        exit={{ opacity: 0, x: -20, width: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden text-primary-foreground relative z-10"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                
                  {/* Badge */}
                  {item.badge && Number(item.badge) > 0 && (
                    <span className="absolute bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 border-2 border-background -top-1 -right-1 z-20">
                      {Number(item.badge) > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* User Profile Sheet */}
      <UserProfileSheet
        isOpen={isUserSheetOpen}
        onClose={() => setIsUserSheetOpen(false)}
        onOpenSettings={openSettings}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        currentView={currentSettingsView}
        onChangeView={setCurrentSettingsView}
      />
      
      {/* Ripple CSS */}
      <style>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background-color: currentColor;
          opacity: 0.3;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        }
        
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};
