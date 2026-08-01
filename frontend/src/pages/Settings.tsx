import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Settings, ShieldCheck, Sliders, Database, Save } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [duplicateThreshold, setDuplicateThreshold] = useState(90);
  const [poVarianceThreshold, setPoVarianceThreshold] = useState(10);
  const [gstValidation, setGstValidation] = useState(true);
  const [hsnCheck, setHsnCheck] = useState(true);

  const handleSave = () => {
    toast.success('Risk intelligence configuration saved successfully!');
  };

  return (
    <AppLayout title="Platform & Risk Rules Configuration">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Risk Thresholds */}
        <Card variant="glass" className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">AI Anomaly & Risk Thresholds</h3>
              <p className="text-xs text-slate-400">Configure sensitivity for automated fraud detection rules</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2">
                <span>Duplicate Invoice Match Sensitivity</span>
                <span className="text-brand-400 font-mono font-bold">{duplicateThreshold}% Match</span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                value={duplicateThreshold}
                onChange={(e) => setDuplicateThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2">
                <span>PO Price Variance Flag Threshold</span>
                <span className="text-brand-400 font-mono font-bold">±{poVarianceThreshold}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                value={poVarianceThreshold}
                onChange={(e) => setPoVarianceThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
          </div>
        </Card>

        {/* GST & Compliance Rules */}
        <Card variant="glass" className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Tax & GSTIN Validation Rules</h3>
              <p className="text-xs text-slate-400">Manage real-time tax compliance and portal verification</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-200">Live GSTIN Active Status Lookup</p>
                <p className="text-[11px] text-slate-400">Verify vendor GSTIN status against government portal</p>
              </div>
              <input
                type="checkbox"
                checked={gstValidation}
                onChange={(e) => setGstValidation(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-slate-800 border-slate-700 accent-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-200">HSN Code Tax Rate Matching</p>
                <p className="text-[11px] text-slate-400">Flag items with mismatch between billed GST rate and HSN master</p>
              </div>
              <input
                type="checkbox"
                checked={hsnCheck}
                onChange={(e) => setHsnCheck(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-slate-800 border-slate-700 accent-brand-500"
              />
            </label>
          </div>
        </Card>

        {/* Integration API Keys */}
        <Card variant="glass" className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">ERP & Ledger Integrations</h3>
              <p className="text-xs text-slate-400">API connection parameters for SAP, Tally, or NetSuite</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="GSTIN Portal API Key" type="password" value="************************" readOnly />
            <Input label="Purchase Ledger Sync Endpoint" value="https://api.internal-erp.com/v1/ledger" readOnly />
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
