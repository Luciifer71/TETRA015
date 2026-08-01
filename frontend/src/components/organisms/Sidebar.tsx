import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  History,
  Settings,
  Sparkles,
  ChevronLeft,
  ShieldCheck,
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
      className="relative flex flex-col h-screen bg-[#F3F3F3] dark:bg-black/90 border-r border-[#D0D0D2] dark:border-white/10 z-30 select-none shrink-0 backdrop-blur-2xl"
    >
      {/* Floating Toggle Button on Border Edge */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        animate={{ rotate: collapsed ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute -right-3.5 top-6 z-40 p-1.5 rounded-full bg-white dark:bg-[#121215] text-[#4B4C51] dark:text-[#F3DDB6] hover:text-[#2E2E2D] dark:hover:text-[#F3DDB6] hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-[#D0D0D2] dark:border-white/15 shadow-md hover:scale-110"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </motion.button>

      {/* Brand Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'px-5'} h-20 border-b border-[#D0D0D2] dark:border-white/10`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#2E2E2D] dark:bg-gradient-to-tr dark:from-white/20 dark:via-[#F3DDB6] dark:to-[#F3DDB6] text-white dark:text-[#000000] shadow-md shrink-0 font-bold">
            <ShieldCheck className="w-6 h-6 text-white dark:text-[#000000]" />
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
                <span className="text-base font-black text-[#2E2E2D] dark:text-[#F3DDB6] tracking-tight flex items-center gap-1.5">
                  InvoiceGuard <Sparkles className="w-3.5 h-3.5 text-[#2E2E2D] dark:text-[#F3DDB6] fill-current" />
                </span>
                <span className="text-[10px] font-bold text-[#4B4C51] dark:text-[#7E7E7E] tracking-wider uppercase">
                  AI Risk Engine
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
                  ? 'bg-[#2E2E2D] text-white border border-[#2E2E2D] dark:bg-white/10 dark:text-[#F3DDB6] dark:border-white/15 shadow-sm backdrop-blur-md font-bold'
                  : 'text-[#4B4C51] dark:text-[#7E7E7E] hover:text-[#2E2E2D] dark:hover:text-[#F3DDB6] hover:bg-[#D0D0D2]/40 dark:hover:bg-white/5'
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
              className="p-4 rounded-2xl bg-[#D0D0D2]/30 dark:bg-white/5 border border-[#D0D0D2] dark:border-white/10 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E2E2D] dark:bg-[#F3DDB6] animate-ping" />
                <span className="text-xs font-bold text-[#2E2E2D] dark:text-[#F3DDB6]">AI Risk Rules Active</span>
              </div>
              <p className="text-[11px] text-[#4B4C51] dark:text-[#7E7E7E] mt-1">GSTN & Ledger Sync Live</p>
            </motion.div>
          ) : (
            <div className="flex justify-center py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E2E2D] dark:bg-[#F3DDB6] animate-pulse" title="AI Active" />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

