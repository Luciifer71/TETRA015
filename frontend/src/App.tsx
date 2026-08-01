import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/Upload';
import { InvoiceListPage } from './pages/InvoiceList';
import { InvoiceDetailPage } from './pages/InvoiceDetail';
import { AuditTrailPage } from './pages/AuditTrail';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/Login';
import { AdminSetupPage } from './pages/AdminSetup';
import { AuthGuard } from './components/AuthGuard';
import { useAuthStore } from './store/authStore';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const loading = useAuthStore((state) => state.loading);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup-admin" element={<AdminSetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        } />
        <Route path="/upload" element={
          <AuthGuard requiredRole="auditor">
            <UploadPage />
          </AuthGuard>
        } />
        <Route path="/invoices" element={
          <AuthGuard>
            <InvoiceListPage />
          </AuthGuard>
        } />
        <Route path="/invoices/:id" element={
          <AuthGuard>
            <InvoiceDetailPage />
          </AuthGuard>
        } />
        <Route path="/audit-trail" element={
          <AuthGuard requiredRole="auditor">
            <AuditTrailPage />
          </AuthGuard>
        } />
        <Route path="/settings" element={
          <AuthGuard requiredRole="admin">
            <SettingsPage />
          </AuthGuard>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
