import React from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, BarChart3, Settings } from "lucide-react";

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-50 dark:from-black dark:to-slate-900">
      {/* Simple Header */}
      <div className="px-8 py-12 border-b border-slate-200 dark:border-white/10">
        <h1 className="text-4xl font-bold mb-2">Invoice Audit Platform</h1>
        <p className="text-slate-600 dark:text-slate-400">
          AI-powered invoice extraction, validation, and risk assessment
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Upload Card */}
          <button
            onClick={() => navigate("/upload")}
            className="p-8 rounded-2xl border-2 border-slate-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 mb-4">
              <UploadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Upload Invoice</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Upload invoices for AI extraction and processing
            </p>
          </button>

          {/* Dashboard Card */}
          <button
            onClick={() => navigate("/dashboard")}
            className="p-8 rounded-2xl border-2 border-slate-200 dark:border-white/10 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-lg"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 mb-4">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Dashboard</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View processing results and risk assessment
            </p>
          </button>

          {/* Settings Card */}
          <button
            onClick={() => navigate("/settings")}
            className="p-8 rounded-2xl border-2 border-slate-200 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-lg"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 mb-4">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Settings</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage account and system settings
            </p>
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-16 p-8 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            <li>✓ AI-powered invoice data extraction using Gemini & Groq</li>
            <li>✓ Automatic validation against vendor master and PO ledger</li>
            <li>✓ GST compliance and duplicate detection</li>
            <li>✓ Real-time risk scoring and assessment</li>
            <li>✓ Comprehensive audit trail and reporting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
