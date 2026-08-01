import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, PlusCircle, X, ShieldAlert, FileText, AlertCircle, UserCheck, LogOut, LogIn, Settings, Building, ChevronDown, Edit3 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfileModal } from './UserProfileModal';
import { LoginModal } from './LoginModal';
import { toast } from 'sonner';

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
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
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

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    toast.success('Signed out of audit session');
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between h-20 px-8 bg-[#F3F3F3]/95 dark:bg-black/80 backdrop-blur-2xl border-b border-[#D0D0D2] dark:border-white/10 transition-colors duration-300">
        <div>
          <h1 className="text-xl font-extrabold text-[#2E2E2D] dark:text-[#F3DDB6] tracking-tight">{title}</h1>
          <p className="text-xs font-medium text-[#4B4C51] dark:text-[#7E7E7E] mt-0.5">Automated Risk Intelligence & Audit Dashboard</p>
        </div>

        <div className="flex items-center gap-4">
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
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#121215] border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-white hover:border-[#8D9797]/40 transition-all shadow-sm"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#F3DDB6]" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Notification Bell with Dropdown Popover */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-2xl bg-slate-100 dark:bg-[#121215] border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-white hover:border-[#8D9797]/40 transition-all shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F3DDB6] text-[#000000] font-black text-[10px] flex items-center justify-center border-2 border-white dark:border-black shadow-md">
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
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#1c1c22]/98 border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-900 dark:text-white backdrop-blur-2xl"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#121215] border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-950 dark:text-white">Audit System Alerts</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#8D9797]/20 text-[#8D9797] border border-[#8D9797]/40">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-bold text-[#8D9797] hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/10">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                        No recent notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                            !n.read ? 'bg-amber-500/5 dark:bg-white/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {n.type === 'risk' && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
                              {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                              {n.type === 'success' && <FileText className="w-4 h-4 text-emerald-500 shrink-0" />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{n.title}</p>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 mt-1 block">{n.time}</span>
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

                  <div className="p-2.5 bg-slate-50 dark:bg-[#292929]/90 border-t border-slate-200 dark:border-[#7E7E7E]/40 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/audit-trail');
                      }}
                      className="text-xs font-bold text-slate-700 dark:text-[#F3DDB6] hover:underline"
                    >
                      View All Audit Event Logs &rarr;
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Section with Interactive Popover */}
          <div className="relative pl-3 border-l border-[#D0D0D2] dark:border-white/10" ref={profileRef}>
            {isAuthenticated ? (
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-[#D0D0D2]/30 dark:hover:bg-white/5 transition-all text-left group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-[#2E2E2D] dark:bg-[#8D9797] text-white dark:text-[#000000] font-extrabold text-xs shadow-sm shrink-0">
                  {user.avatarInitials}
                </div>
                <div className="hidden md:flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[#2E2E2D] dark:text-[#F3DDB6]">{user.name}</span>
                    <ChevronDown className="w-3 h-3 text-[#4B4C51] dark:text-[#7E7E7E] group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <span className="text-[10px] font-medium text-[#4B4C51] dark:text-[#7E7E7E]">{user.role}</span>
                </div>
              </button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<LogIn className="w-4 h-4" />}
                onClick={() => setShowLoginModal(true)}
              >
                Sign In
              </Button>
            )}

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#1c1c22] border border-[#D0D0D2] dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 text-[#2E2E2D] dark:text-[#F3DDB6] backdrop-blur-2xl"
                >
                  {/* User Overview */}
                  <div className="p-4 bg-[#F3F3F3] dark:bg-[#121215] border-b border-[#D0D0D2] dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#2E2E2D] dark:bg-[#8D9797] text-white dark:text-[#000000] font-black text-sm shadow-md shrink-0">
                        {user.avatarInitials}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-extrabold text-[#2E2E2D] dark:text-[#F3DDB6] truncate">{user.name}</h4>
                        <p className="text-[11px] font-medium text-[#4B4C51] dark:text-[#7E7E7E] truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-1 text-[11px]">
                      <span className="text-[#4B4C51] dark:text-[#7E7E7E] font-medium flex items-center gap-1 truncate">
                        <UserCheck className="w-3 h-3" /> {user.role} ({user.department})
                      </span>
                      <span className="text-[#4B4C51] dark:text-[#7E7E7E] font-medium flex items-center gap-1 truncate">
                        <Building className="w-3 h-3" /> {user.organization}
                      </span>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="p-2 space-y-1 text-xs font-semibold">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowEditModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#D0D0D2]/40 dark:hover:bg-white/10 transition-colors text-left text-[#2E2E2D] dark:text-[#F3DDB6]"
                    >
                      <Edit3 className="w-4 h-4 text-[#8D9797]" /> Edit Profile Information
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#D0D0D2]/40 dark:hover:bg-white/10 transition-colors text-left text-[#2E2E2D] dark:text-[#F3DDB6]"
                    >
                      <Settings className="w-4 h-4 text-[#8D9797]" /> Account & System Settings
                    </button>

                    <div className="border-t border-[#D0D0D2] dark:border-white/10 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors text-left font-bold"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      <UserProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};
