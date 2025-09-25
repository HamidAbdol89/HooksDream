// src/App.tsx - FIXED VERSION
import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useAppStore } from "@/store/useAppStore";
import TermsOfUse from "@/pages/TermsOfUse";
import ProtectedApp from "@/components/ProtectedApp";

const App: React.FC = () => {
  const { isLoading } = useGoogleAuth();
  const { isConnected, user, refetchProfile } = useAppStore();
  const hasRefetchedRef = useRef(false); // 🔥 Tránh refetch nhiều lần

  useEffect(() => {
    if (!isLoading && isConnected && user?._id && !hasRefetchedRef.current) {
      console.log('🔄 App mounted - refetching user data...');
      hasRefetchedRef.current = true;
      
      refetchProfile()
        .catch(console.error)
        .finally(() => {
          // Reset flag after 5s để cho phép refetch lần sau nếu cần
          setTimeout(() => {
            hasRefetchedRef.current = false;
          }, 5000);
        });
    }
  }, [isLoading, isConnected, user?._id]); // 🔥 Bỏ refetchProfile khỏi dependencies

  return (
    <>
      <div id="portal-root" />
      <Routes>
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/*" element={<ProtectedApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;