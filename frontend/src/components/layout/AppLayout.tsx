import React, { useEffect } from 'react';
import { Sidebar } from '../organisms/Sidebar';
import { Header } from '../organisms/Header';
import { Toaster } from 'sonner';
import { useInvoiceStore } from '../../store/useInvoiceStore';

export interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const darkMode = useInvoiceStore((s) => s.darkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [darkMode]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-gradient-to-br dark:from-[#10120D] dark:via-[#172630] dark:to-[#263C49] dark:bg-fixed text-slate-950 dark:text-[#DFE0E2] antialiased transition-colors duration-300">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-100 dark:bg-transparent">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" theme={darkMode ? 'dark' : 'light'} richColors closeButton />
    </div>
  );
};
