import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { toast } from 'sonner';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    toast.success('Signed in successfully!');
    onClose();
  };

  const handleDemoLogin = () => {
    login('priya.sharma@enterprise.com');
    toast.success('Signed in as Priya Sharma (Demo)');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white dark:bg-[#1c1c22] border border-[#D0D0D2] dark:border-[#8D9797]/30 rounded-3xl shadow-2xl overflow-hidden z-10 text-[#2E2E2D] dark:text-[#F3DDB6]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#D0D0D2] dark:border-white/10 bg-[#F3F3F3] dark:bg-[#121215]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#2E2E2D] dark:bg-[#8D9797] text-white dark:text-[#000000] font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">InvoiceGuard Portal</h3>
                <p className="text-xs text-[#4B4C51] dark:text-[#7E7E7E]">Sign in to your enterprise audit account</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#4B4C51] hover:text-[#2E2E2D] dark:hover:text-white hover:bg-[#D0D0D2]/40 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="auditor@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" variant="primary" className="w-full mt-2" leftIcon={<LogIn className="w-4 h-4" />}>
              Sign In
            </Button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#D0D0D2] dark:border-white/10 w-full" />
              <span className="bg-white dark:bg-[#1c1c22] px-3 text-[11px] font-bold text-[#4B4C51] dark:text-[#7E7E7E] uppercase absolute">
                or
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              className="w-full"
              leftIcon={<Sparkles className="w-4 h-4 text-[#8D9797]" />}
            >
              Quick Demo Login as Priya Sharma
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
