// ModernAuthConnect.tsx - Modern Authentication Page
// Mobile-first, accessible, and performance-optimized

import React, { useRef, useEffect, useState } from 'react';
import { useModernGoogleAuth, AuthState } from '@/hooks/useModernGoogleAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { useTranslation } from "react-i18next";
import { ChevronDown, Shield, Check, AlertTriangle, Sparkles, Users, Zap } from "lucide-react";
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ModernGoogleLogin from './ModernGoogleLogin';

export const ModernAuthConnect: React.FC = () => {
  const { authState, isLoading, isConnected, progress } = useModernGoogleAuth();
  const { t, i18n } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Features carousel
  const features = [
    {
      icon: Users,
      title: "Connect with Friends",
      description: "Share moments and stay connected with people you care about"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed and smooth user experience"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security"
    }
  ];

  // Auto redirect when connected
  useEffect(() => {
    if (isConnected && authState === AuthState.SUCCESS) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, authState, navigate]);

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

  // Feature carousel rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Prevent body scroll on mobile
  useEffect(() => {
    const body = document.body;
    const originalOverflow = body.style.overflow;
    
    body.style.overflow = 'hidden';
    
    return () => {
      body.style.overflow = originalOverflow;
    };
  }, []);

  const renderSuccessState = () => (
    <div className="text-center py-8 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
          Welcome to HooksDream!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t("redirecting")} Redirecting you to your feed...
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
          <Shield className="w-5 h-5" />
          <span className="font-medium">Secure Connection Established</span>
        </div>
        <div className="text-sm text-green-600 dark:text-green-400">
          Your account is ready and protected
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
          className="w-full flex items-center justify-between rounded-xl bg-gray-100 dark:bg-neutral-800 px-4 py-3 text-sm shadow-sm text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <img
              src={i18n.language === "en" ? "/flags/us.svg" : "/flags/vn.svg"}
              alt="flag"
              className="w-5 h-5 rounded-sm"
            />
            <span className="font-medium">{i18n.language === "en" ? "English" : "Tiếng Việt"}</span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              isOpen ? "rotate-180" : ""
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 w-full rounded-xl bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700 z-10 overflow-hidden">
            <button
              onClick={() => { i18n.changeLanguage("en"); setIsOpen(false); }}
              className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 text-left transition-colors duration-200 flex items-center gap-3"
            >
              <img src="/flags/us.svg" alt="US" className="w-5 h-5 rounded-sm" />
              <span className="font-medium">English</span>
            </button>
            <button
              onClick={() => { i18n.changeLanguage("vi"); setIsOpen(false); }}
              className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 text-left transition-colors duration-200 flex items-center gap-3"
            >
              <img src="/flags/vn.svg" alt="VN" className="w-5 h-5 rounded-sm" />
              <span className="font-medium">Tiếng Việt</span>
            </button>
          </div>
        )}
      </div>

      {/* Feature showcase */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-center">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500",
                  index === currentFeature
                    ? "bg-blue-500 text-white scale-110"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 scale-90"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
            );
          })}
        </div>
        
        <div className="text-center space-y-2 min-h-[4rem]">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {features[currentFeature].title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {features[currentFeature].description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentFeature
                  ? "bg-blue-500 w-6"
                  : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      </div>

      {/* Terms agreement */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-gray-200 dark:border-neutral-700">
        <input
          type="checkbox"
          id="agreeTerms"
          checked={agreeTerms}
          onChange={() => setAgreeTerms(!agreeTerms)}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
        <label htmlFor="agreeTerms" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          I agree to the&nbsp;
          <a 
            href="/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
          >
            Terms of Service
          </a>
          &nbsp;and understand how my data will be used.
        </label>
      </div>

      {/* Google Login */}
      <div className="space-y-4">
        <ModernGoogleLogin
          onSuccess={() => {
            console.log('✅ Modern Google login successful');
          }}
          onError={(error) => {
            console.error('❌ Modern Google login error:', error);
          }}
          disabled={!agreeTerms}
          size="lg"
          showProgress={true}
        />
        
        <div className="text-center space-y-2">
          {!agreeTerms && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Please agree to the terms to continue
            </p>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure authentication powered by Google
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating elements */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <Sparkles 
              className="text-blue-500 dark:text-blue-400"
              style={{
                width: `${8 + Math.random() * 16}px`,
                height: `${8 + Math.random() * 16}px`
              }}
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl">
          <CardHeader className="space-y-6 p-8 pb-6">
            <div className="mx-auto flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <img 
                    src="/logo.png" 
                    alt="HooksDream Logo" 
                    className="w-12 h-12 object-contain" 
                  />
                </div>
                {isConnected && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white dark:border-neutral-800 flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {authState === AuthState.SUCCESS ? "Welcome back!" : "Welcome to HooksDream"}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 text-base">
                {authState === AuthState.SUCCESS 
                  ? "You're all set! Redirecting to your feed..." 
                  : "Connect with friends and share your moments"
                }
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {authState === AuthState.SUCCESS ? (
              renderSuccessState()
            ) : (
              renderLoginForm()
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2024 HooksDream. Built with ❤️ for connecting people.</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ModernAuthConnect;
