import React, { useRef, useEffect, useState } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { useTranslation } from "react-i18next";
import { Icons } from '../ui/Icons';
import { ChevronDown, Shield, Clock, Check, AlertTriangle } from "lucide-react";
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import rocketAnimation from '@/assets/animation/rocket.json';
import GoogleLogin from './GoogleLogin';

export const AuthConnect: React.FC = () => {
  const { isLoading, login, isConnected } = useGoogleAuth();
  const { t, i18n } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle login with navigation
  const handleLogin = async () => {
    if (!agreeTerms) return;
    
    setShowConnectionStatus(true);
    try {
      await login();
    } catch (error) {
      setShowConnectionStatus(false);
    }
  };

  // Auto redirect when connected
  useEffect(() => {
    if (isConnected && !isLoading) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isLoading, navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show connection status
  useEffect(() => {
    if (isConnected && !isLoading) {
      setShowConnectionStatus(true);
      const timer = setTimeout(() => {
        setShowConnectionStatus(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isLoading]);

  // Prevent mobile scroll
  useEffect(() => {
    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalHeight = body.style.height;
    
    body.style.overflow = 'hidden';
    body.style.height = '100vh';
    
    return () => {
      body.style.overflow = originalOverflow;
      body.style.height = originalHeight;
    };
  }, []);

  const renderLoadingState = () => (
    <div className="flex flex-col items-center space-y-4 py-6">
      <div className="relative">
        <Icons.spinner className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          {t("connecting_wallet")}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("please_wait_moment")}
        </p>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center py-6 space-y-4">
      <Icons.checkCircle className="w-16 h-16 text-green-500 mx-auto" />
      
      <div className="space-y-2">
        <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
          {t("connected_successfully")}
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t("redirecting")}
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">{t("secure_connection")}</span>
        </div>
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="space-y-6">
      {/* Language selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between rounded-full bg-gray-800 dark:bg-neutral-900 px-4 py-2 text-sm shadow-sm text-white transition-all duration-200 hover:bg-gray-700 dark:hover:bg-neutral-800"
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
            className={`w-4 h-4 text-white transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 w-full rounded-md bg-gray-800 dark:bg-neutral-900 shadow-lg border border-gray-700 z-10">
            <button
              onClick={() => { i18n.changeLanguage("en"); setIsOpen(false); }}
              className="w-full px-4 py-2 hover:bg-gray-700 dark:hover:bg-neutral-700 rounded-t-md text-white text-left transition-colors duration-200 flex items-center gap-2"
            >
              <img src="/flags/us.svg" alt="US" className="w-4 h-4 rounded-sm" />
              <span>English</span>
            </button>
            <button
              onClick={() => { i18n.changeLanguage("vi"); setIsOpen(false); }}
              className="w-full px-4 py-2 hover:bg-gray-700 dark:hover:bg-neutral-700 rounded-b-md text-white text-left transition-colors duration-200 flex items-center gap-2"
            >
              <img src="/flags/vn.svg" alt="VN" className="w-4 h-4 rounded-sm" />
              <span>Tiếng Việt</span>
            </button>
          </div>
        )}
      </div>

      {/* Terms agreement */}
      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border border-gray-200 dark:border-neutral-700">
        <input
          type="checkbox"
          id="agreeTerms"
          checked={agreeTerms}
          onChange={() => setAgreeTerms(!agreeTerms)}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="agreeTerms" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {t("agree_terms_prefix")}&nbsp;
          <a 
            href="/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
          >
            {t("terms_of_service")}
          </a>
          &nbsp;{t("agree_terms_suffix")}
        </label>
      </div>

      {/* Google Login */}
      <div className="space-y-4">
        <GoogleLogin
          onSuccess={() => {
            console.log('✅ Google login successful');
          }}
          onError={(error) => {
            console.error('❌ Google login error:', error);
          }}
          disabled={!agreeTerms}
        />
        
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("secure_wallet_connection")}
          </p>
          {!agreeTerms && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t("please_agree_terms")}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background with rocket and stars */}
      <div className="absolute inset-0">
        {/* Twinkling stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <div 
              className="bg-white rounded-full opacity-40"
              style={{
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`
              }}
            ></div>
          </div>
        ))}

        {/* Large rocket animation in background */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20">
          <div className="w-96 h-96">
            <Lottie 
              animationData={rocketAnimation}
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Smaller floating rockets */}
        <div className="absolute top-20 left-10 opacity-30 animate-float">
          <div className="w-24 h-24">
            <Lottie 
              animationData={rocketAnimation}
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
        
        <div className="absolute bottom-32 right-16 opacity-25 animate-float" style={{ animationDelay: '2s' }}>
          <div className="w-32 h-32">
            <Lottie 
              animationData={rocketAnimation}
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Brand text in background */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-10">
          <h1 className="text-6xl font-bold text-white">HooksDream</h1>
        </div>
      </div>

      {/* Login card with backdrop blur */}
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-2xl">
          <CardHeader className="space-y-4 p-6 pb-4">
            <div className="mx-auto flex justify-center">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-20 h-20 object-contain" 
                />
                {isConnected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <CardTitle className="text-xl font-semibold text-white">
                {isConnected ? t("welcome_back") : "Welcome to HooksDream"}
              </CardTitle>
              <CardDescription className="text-gray-200 text-sm">
                {isConnected ? t("session_active") : "Sign in with your Google account"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {isLoading ? (
              renderLoadingState()
            ) : isConnected && showConnectionStatus ? (
              renderSuccessState()
            ) : (
              renderLoginForm()
            )}
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
