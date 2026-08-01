import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  ShieldCheck,
  History,
  Settings,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Audit Upload', path: '/upload', icon: <UploadCloud className="w-5 h-5" /> },
    { label: 'Invoices', path: '/invoices', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { label: 'Audit Trail', path: '/audit-trail', icon: <History className="w-5 h-5" /> },
    { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-screen bg-white dark:bg-[#10120D]/95 border-r border-slate-200 dark:border-[#263C49] z-30 select-none overflow-hidden shrink-0 backdrop-blur-xl"
    >
      {/* Brand Header */}
      <div className="flex items-center h-20 px-4 border-b border-slate-200 dark:border-[#263C49] relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 text-zinc-950 shadow-gold-md shrink-0 font-bold">
            <ShieldCheck className="w-6 h-6 text-zinc-950" />
          </div>
          
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col whitespace-nowrap overflow-hidden"
              >
                <span className="text-base font-black text-slate-950 dark:text-[#DFE0E2] tracking-tight flex items-center gap-1.5">
                  InvoiceGuard <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-[#CBCDD0] tracking-wider uppercase">
                  AI Risk Engine
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Smooth Floating Toggle Button */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute right-3 p-1.5 rounded-xl bg-slate-100 dark:bg-[#263C49] text-slate-700 dark:text-[#DFE0E2] hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-slate-200 dark:hover:bg-[#344e5f] transition-colors border border-slate-300 dark:border-[#344e5f] shadow-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center px-0' : 'px-3.5'} py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#263C49] text-yellow-400 border border-[#344e5f] shadow-gold-md font-bold'
                  : 'text-slate-700 dark:text-[#AAABB0] hover:text-slate-950 dark:hover:text-[#DFE0E2] hover:bg-slate-100 dark:hover:bg-[#263C49]/60'
              }`
            }
          >
            <div className="shrink-0">{item.icon}</div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 truncate whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 mb-4 mx-3">
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-2xl bg-slate-100 dark:bg-[#263C49] border border-amber-500/30 shadow-gold-glow"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-bold text-slate-900 dark:text-[#DFE0E2]">AI Risk Rules Active</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-[#A4A6A8] mt-1">GSTN & Ledger Sync Live</p>
            </motion.div>
          ) : (
            <div className="flex justify-center py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="AI Active" />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
