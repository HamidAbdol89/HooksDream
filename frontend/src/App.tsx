// src/App.tsx - MODERN VERSION with optimized authentication + PWA
import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useModernGoogleAuth, AuthState } from "./hooks/useModernGoogleAuth";
import { useAppStore } from "@/store/useAppStore";
import { initializeSessionExtension } from "@/utils/sessionManager";
import TermsOfUse from "@/pages/TermsOfUse";
import ProtectedApp from "@/components/ProtectedApp";
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { pwaManager } from "@/services/pwaManager";

const App: React.FC = () => {
  const { authState, isLoading, isConnected } = useModernGoogleAuth();
  const { user } = useAppStore();
  const initializationRef = useRef(false);

  // Modern auth system handles all user data loading in single API call
  // No need for additional refetch calls - performance optimized!
  useEffect(() => {
    if (authState === AuthState.SUCCESS && isConnected && user && !initializationRef.current) {
      initializationRef.current = true;
      // Modern auth system: User authenticated and data loaded
      
      // ✅ Initialize session extension for 30-day persistent login
      initializeSessionExtension();
      
      // ✅ Initialize PWA features
      initializePWAFeatures();
      
      // Reset after component lifecycle
      return () => {
        initializationRef.current = false;
      };
    }
  }, [authState, isConnected, user]);

  // Initialize PWA features after user authentication
  const initializePWAFeatures = async () => {
    try {
      // Setup push notifications if supported
      const capabilities = pwaManager.getCapabilities();
      
      if (capabilities.pushNotifications) {
        // Auto-setup push notifications for authenticated users
        await pwaManager.setupPushNotifications();
      }
      
      console.log('PWA features initialized:', capabilities);
    } catch (error) {
      console.error('Failed to initialize PWA features:', error);
    }
  };

  // Show loading during initialization only
  if (authState === AuthState.INITIALIZING) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Initializing HooksDream...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthErrorBoundary>
      <div id="portal-root" />
      <InstallPrompt />
      <Routes>
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/*" element={<ProtectedApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthErrorBoundary>
  );
};

export default App;