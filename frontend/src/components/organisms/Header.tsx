import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, PlusCircle, X, ShieldAlert, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeaderProps {
  title?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  type: 'risk' | 'success' | 'warning';
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Dashboard' }) => {
  const { darkMode, toggleDarkMode } = useInvoiceStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'High Risk Flag: INV/2026/8942 duplicate detected',
      time: '10m ago',
      type: 'risk',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'GSTIN filing default alert: Nexus Management Consultants',
      time: '32m ago',
      type: 'warning',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Batch Audit Complete: 5 Invoices processed with 98.4% accuracy',
      time: '1h ago',
      type: 'success',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-20 px-8 bg-white/95 dark:bg-[#10120D]/90 backdrop-blur-xl border-b border-slate-200 dark:border-[#263C49] transition-colors duration-300">
      <div>
        <h1 className="text-xl font-black text-slate-950 dark:text-[#DFE0E2] tracking-tight">{title}</h1>
        <p className="text-xs font-semibold text-slate-600 dark:text-[#CBCDD0] mt-0.5">Automated Risk Intelligence & Audit Dashboard</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Upload Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => navigate('/upload')}
        >
          New Audit
        </Button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#263C49] border border-slate-300 dark:border-[#344e5f] text-slate-800 dark:text-[#DFE0E2] hover:text-amber-600 dark:hover:text-yellow-400 hover:border-amber-500/40 transition-all shadow-sm"
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notification Bell with Dropdown Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-2xl bg-slate-100 dark:bg-[#263C49] border border-slate-300 dark:border-[#344e5f] text-slate-800 dark:text-[#DFE0E2] hover:text-amber-600 dark:hover:text-yellow-400 hover:border-amber-500/40 transition-all shadow-sm"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-zinc-950 font-black text-[10px] flex items-center justify-center border-2 border-white dark:border-[#10120D] shadow-md">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Popover Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#263C49] border border-slate-200 dark:border-[#344e5f] rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-900 dark:text-[#DFE0E2]"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#10120D]/90 border-b border-slate-200 dark:border-[#344e5f]">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-950 dark:text-[#DFE0E2]">Audit System Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-600 dark:text-yellow-400 border border-amber-500/30">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-amber-600 dark:text-yellow-400 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#344e5f]/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs font-medium text-slate-500 dark:text-[#AAABB0]">
                      No recent notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#344e5f]/50 transition-colors ${
                          !n.read ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {n.type === 'risk' && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
                            {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                            {n.type === 'success' && <FileText className="w-4 h-4 text-emerald-500 shrink-0" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-[#DFE0E2] leading-snug">{n.title}</p>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-[#A4A6A8] mt-1 block">{n.time}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(n.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-[#10120D]/90 border-t border-slate-200 dark:border-[#344e5f] text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/audit-trail');
                    }}
                    className="text-xs font-bold text-slate-700 dark:text-[#CBCDD0] hover:text-amber-600 dark:hover:text-yellow-400"
                  >
                    View All Audit Event Logs &rarr;
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-[#263C49]">
          <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 border border-yellow-400 text-zinc-950 font-black text-xs shadow-gold-md">
            PS
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-black text-slate-950 dark:text-[#DFE0E2]">Priya Sharma</span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-yellow-400">Senior Auditor</span>
          </div>
        </div>
      </div>
    </header>
  );
};
