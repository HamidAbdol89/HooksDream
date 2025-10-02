// ModernAuthConnect.tsx - Modern Authentication Page with Clean UI
// Mobile-first, accessible, and performance-optimized with Clean design

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import SimpleGoogleLogin from './SimpleGoogleLogin';
import { SessionManager } from '@/utils/sessionManager';

export const ModernAuthConnect: React.FC = () => {
  const { isConnected, setIsConnected, setUser, setProfile } = useAppStore();
  const { t, i18n } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();


  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      console.log('🔍 Checking for existing session...');
      
      const session = SessionManager.getAuthSession();
      if (session) {
        console.log('✅ Found valid session:', SessionManager.getSessionInfo());
        
        // Restore app state from session
        setUser(session.user);
        setProfile(session.profile);
        setIsConnected(true);
        
        // Redirect immediately to feed
        navigate('/feed', { replace: true });
        return;
      }
      
      console.log('❌ No valid session found');
      setIsCheckingSession(false);
    };
    
    checkSession();
  }, [navigate, setUser, setProfile, setIsConnected]);

  // Auto redirect when connected
  useEffect(() => {
    if (isConnected && !isCheckingSession) {
      const timer = setTimeout(() => {
        navigate('/feed', { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isCheckingSession, navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('.language-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);


  const renderSuccessState = () => (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {t("auth.welcomeToHooksDream")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("auth.takingToFeed")}
        </p>
      </div>
      
      {/* Progress indicator */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
        <div className="bg-green-500 h-1.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Language selector - minimal */}
      <div className="relative language-dropdown">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-base text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <img
              src={i18n.language === "en" ? "/flags/us.svg" : "/flags/vn.svg"}
              alt="flag"
              className="w-4 h-4 rounded-sm"
            />
            <span>{i18n.language === "en" ? "English" : "Tiếng Việt"}</span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              isOpen ? "rotate-180" : ""
            )}
          />
        </button>

        {/* Dropdown with smooth expand/collapse animation */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-32 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        )}>
          <div className={cn(
            "bg-background rounded-lg shadow-lg border border-border transform transition-all duration-300 ease-in-out",
            isOpen ? "scale-100 translate-y-0" : "scale-95 -translate-y-2"
          )}>
            <button
              onClick={() => { i18n.changeLanguage("en"); setIsOpen(false); }}
              className="w-full px-4 py-3 hover:bg-muted text-left flex items-center gap-2 text-foreground transition-colors duration-200 first:rounded-t-lg"
            >
              <img src="/flags/us.svg" alt="US" className="w-4 h-4 rounded-sm" />
              <span>English</span>
            </button>
            <button
              onClick={() => { i18n.changeLanguage("vi"); setIsOpen(false); }}
              className="w-full px-4 py-3 hover:bg-muted text-left flex items-center gap-2 text-foreground transition-colors duration-200 last:rounded-b-lg"
            >
              <img src="/flags/vn.svg" alt="VN" className="w-4 h-4 rounded-sm" />
              <span>Tiếng Việt</span>
            </button>
          </div>
        </div>
      </div>


      {/* Terms agreement - minimal */}
      <div className="flex items-start gap-3 sm:gap-4">
        <input
          type="checkbox"
          id="agreeTerms"
          checked={agreeTerms}
          onChange={() => setAgreeTerms(!agreeTerms)}
          className="w-5 h-5 sm:w-4 sm:h-4 mt-0.5 rounded border-border text-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-0"
        />
        <label htmlFor="agreeTerms" className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t("auth.agreeToTerms")}{' '}
          <a 
            href="/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:underline"
          >
            {t("auth.termsOfService")}
          </a>
        </label>
      </div>

      {/* Google Login */}
      <div className="space-y-4 sm:space-y-5">
        {agreeTerms ? (
          <SimpleGoogleLogin
            onSuccess={() => {
              console.log('✅ Simple Google login successful');
            }}
            onError={(error: any) => {
              console.error('❌ Simple Google login error:', error);
            }}
          />
        ) : (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            {t("auth.pleaseAgreeTerms")}
          </div>
        )}
      </div>
    </div>
  );

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto">
            <img 
              src="/logo.png" 
              alt="HooksDream Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain" 
            />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-foreground" />
            <span className="text-foreground">Checking session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:p-6 lg:p-8">
      {/* Main content */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 sm:mb-8">
            <img 
              src="/logo.png" 
              alt="HooksDream Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain" 
            />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {isConnected ? t("auth.welcomeBack") : t("auth.welcome")}
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            {isConnected 
              ? t("auth.youreAllSet") 
              : t("auth.tagline")
            }
          </p>
        </div>

        {/* Content */}
        <div className="bg-background">
          {isConnected ? (
            renderSuccessState()
          ) : (
            renderLoginForm()
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 sm:mt-10 text-xs sm:text-sm text-muted-foreground">
          © 2025 HooksDream
        </div>
      </div>
    </div>
  );
};

export default ModernAuthConnect;
