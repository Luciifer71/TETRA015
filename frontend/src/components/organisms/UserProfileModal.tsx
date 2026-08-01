import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, ShieldCheck, Building, Briefcase, Save } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { toast } from 'sonner';

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    organization: user.organization,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData);
    toast.success('User profile updated successfully');
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
          className="relative w-full max-w-lg bg-white dark:bg-[#1c1c22] border border-[#D0D0D2] dark:border-[#8D9797]/30 rounded-3xl shadow-2xl overflow-hidden z-10 text-[#2E2E2D] dark:text-[#F3DDB6]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#D0D0D2] dark:border-white/10 bg-[#F3F3F3] dark:bg-[#121215]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#2E2E2D] dark:bg-[#8D9797] text-white dark:text-[#000000] font-black text-sm shadow-md">
                {user.avatarInitials}
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">Edit Profile Information</h3>
                <p className="text-xs text-[#4B4C51] dark:text-[#7E7E7E]">Update your auditor credentials & details</p>
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
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Role / Title"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                required
              />

              <Input
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                leftIcon={<Briefcase className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Organization"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              leftIcon={<Building className="w-4 h-4" />}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D0D0D2] dark:border-white/10">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
