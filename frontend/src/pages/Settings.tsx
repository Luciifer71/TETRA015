import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { ShieldCheck, Sliders, Database, Save, Cpu, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [duplicateThreshold, setDuplicateThreshold] = useState(90);
  const [poVarianceThreshold, setPoVarianceThreshold] = useState(10);
  const [gstValidation, setGstValidation] = useState(true);
  const [hsnCheck, setHsnCheck] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState<'gemini-pro' | 'gemini-flash' | 'tesseract'>('gemini-pro');

  const handleSave = () => {
    toast.success('Risk intelligence configuration saved successfully!');
  };

  return (
    <AppLayout title="Platform & Risk Rules Configuration">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* AI Engine Model Selection */}
        <Card variant="glass" className="space-y-6 border border-slate-200 dark:border-[#344e5f] shadow-lg">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-[#344e5f]">
            <div className="p-2.5 bg-amber-500/15 text-amber-600 dark:text-yellow-400 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">AI OCR & Audit Engine Selection</h3>
              <p className="text-xs text-slate-600 dark:text-[#A4A6A8]">Choose active multimodal LLM model for invoice parsing & risk scoring</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedEngine('gemini-pro')}
              className={`p-4 rounded-2xl text-left border transition-all ${
                selectedEngine === 'gemini-pro'
                  ? 'bg-amber-500/10 border-amber-500 text-slate-950 dark:text-white shadow-md'
                  : 'bg-slate-50 dark:bg-[#172630]/60 border-slate-200 dark:border-[#344e5f] text-slate-700 dark:text-[#CBCDD0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Gemini 1.5 Pro
                </span>
                {selectedEngine === 'gemini-pro' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#A4A6A8] mt-2">Maximum accuracy for complex multi-line invoices & handwritten notes.</p>
            </button>

            <button
              onClick={() => setSelectedEngine('gemini-flash')}
              className={`p-4 rounded-2xl text-left border transition-all ${
                selectedEngine === 'gemini-flash'
                  ? 'bg-amber-500/10 border-amber-500 text-slate-950 dark:text-white shadow-md'
                  : 'bg-slate-50 dark:bg-[#172630]/60 border-slate-200 dark:border-[#344e5f] text-slate-700 dark:text-[#CBCDD0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">Gemini 1.5 Flash</span>
                {selectedEngine === 'gemini-flash' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#A4A6A8] mt-2">Ultra-low latency sub-second OCR extraction for high volume batches.</p>
            </button>

            <button
              onClick={() => setSelectedEngine('tesseract')}
              className={`p-4 rounded-2xl text-left border transition-all ${
                selectedEngine === 'tesseract'
                  ? 'bg-amber-500/10 border-amber-500 text-slate-950 dark:text-white shadow-md'
                  : 'bg-slate-50 dark:bg-[#172630]/60 border-slate-200 dark:border-[#344e5f] text-slate-700 dark:text-[#CBCDD0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">Offline Tesseract</span>
                {selectedEngine === 'tesseract' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#A4A6A8] mt-2">Local fallback OCR engine for air-gapped secure environments.</p>
            </button>
          </div>
        </Card>

        {/* Risk Thresholds */}
        <Card variant="glass" className="space-y-6 border border-slate-200 dark:border-[#344e5f] shadow-lg">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-[#344e5f]">
            <div className="p-2.5 bg-amber-500/15 text-amber-600 dark:text-yellow-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">AI Anomaly & Risk Thresholds</h3>
              <p className="text-xs text-slate-600 dark:text-[#A4A6A8]">Configure sensitivity for automated fraud detection rules</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-[#DFE0E2] mb-2">
                <span>Duplicate Invoice Match Sensitivity</span>
                <span className="text-amber-600 dark:text-yellow-400 font-mono font-black">{duplicateThreshold}% Match</span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                value={duplicateThreshold}
                onChange={(e) => setDuplicateThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-[#10120D] rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-[#DFE0E2] mb-2">
                <span>PO Price Variance Flag Threshold</span>
                <span className="text-amber-600 dark:text-yellow-400 font-mono font-black">±{poVarianceThreshold}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                value={poVarianceThreshold}
                onChange={(e) => setPoVarianceThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-[#10120D] rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </Card>

        {/* GST & Compliance Rules */}
        <Card variant="glass" className="space-y-6 border border-slate-200 dark:border-[#344e5f] shadow-lg">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-[#344e5f]">
            <div className="p-2.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">Tax & GSTIN Validation Rules</h3>
              <p className="text-xs text-slate-600 dark:text-[#A4A6A8]">Manage real-time tax compliance and portal verification</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#172630]/60 rounded-2xl border border-slate-200 dark:border-[#344e5f] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#172630] transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-[#DFE0E2]">Live GSTIN Active Status Lookup</p>
                <p className="text-[11px] text-slate-500 dark:text-[#A4A6A8]">Verify vendor GSTIN status against government portal</p>
              </div>
              <input
                type="checkbox"
                checked={gstValidation}
                onChange={(e) => setGstValidation(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded bg-slate-200 dark:bg-[#10120D] border-slate-300 dark:border-[#344e5f] accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#172630]/60 rounded-2xl border border-slate-200 dark:border-[#344e5f] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#172630] transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-[#DFE0E2]">HSN Code Tax Rate Matching</p>
                <p className="text-[11px] text-slate-500 dark:text-[#A4A6A8]">Flag items with mismatch between billed GST rate and HSN master</p>
              </div>
              <input
                type="checkbox"
                checked={hsnCheck}
                onChange={(e) => setHsnCheck(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded bg-slate-200 dark:bg-[#10120D] border-slate-300 dark:border-[#344e5f] accent-amber-500"
              />
            </label>
          </div>
        </Card>

        {/* Integration API Keys */}
        <Card variant="glass" className="space-y-4 border border-slate-200 dark:border-[#344e5f] shadow-lg">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-[#344e5f]">
            <div className="p-2.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">ERP & Ledger Integrations</h3>
              <p className="text-xs text-slate-600 dark:text-[#A4A6A8]">API connection parameters for SAP, Tally, or NetSuite</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="GSTIN Portal API Key" type="password" value="************************" readOnly />
            <Input label="Purchase Ledger Sync Endpoint" value="https://api.internal-erp.com/v1/ledger" readOnly />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Save className="w-5 h-5" />}
              onClick={handleSave}
              className="px-8 py-3.5 text-base font-extrabold shadow-md hover:shadow-xl transition-all"
            >
              Save Configurations
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

