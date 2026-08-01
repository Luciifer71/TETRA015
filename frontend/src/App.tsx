import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/Upload';
import { InvoiceListPage } from './pages/InvoiceList';
import { InvoiceDetailPage } from './pages/InvoiceDetail';
import { AuditTrailPage } from './pages/AuditTrail';
import { SettingsPage } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/invoices" element={<InvoiceListPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/audit-trail" element={<AuditTrailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
