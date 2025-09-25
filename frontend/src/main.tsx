import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import './styles/globals.css'
import "./i18n";
import { ToastProvider } from '@/components/ui/SuccessToast';
import { ReactQueryProvider } from './providers/ReactQueryProvider';
// 🔥 BỎ UnfollowConfirmProvider ở đây vì đã có trong ProtectedApp

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ReactQueryProvider>
  </React.StrictMode>
);