import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Sparkles, Plus, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleNotificationsClick = () => {
    toast.info('All automated payment reminders & invoice workflows are running smoothly.', 'AI Operations Active');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 lg:px-8 transition-colors duration-200">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices, clients, expenses... (Press Enter)"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  navigate(`/invoices?search=${encodeURIComponent(target.value.trim())}`);
                }
              }
            }}
          />
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* AI Quick Button */}
        <Link
          to="/ai-assistant"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 bg-brand-500/10 border border-brand-500/20 dark:border-brand-500/30 rounded-xl hover:bg-brand-500/20 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 animate-pulse" />
          <span>AI Copilot</span>
        </Link>

        {/* Create Invoice Primary Button */}
        <Link
          to="/invoices/new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/25 hover:shadow-brand-600/40 hover:-translate-y-0.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Invoice</span>
        </Link>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-0.5 sm:mx-1 hidden sm:block" />

        {/* Currency Pill */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg">
          <span className="text-emerald-500 dark:text-emerald-400 font-bold">$</span>
          <span>{user?.currency || 'USD'}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={handleNotificationsClick}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="AI Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
        </button>

        {/* Profile Avatar */}
        <Link
          to="/settings"
          className="flex items-center gap-2 pl-1 group"
          title="Account Settings"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs ring-2 ring-transparent group-hover:ring-brand-500 transition-all shadow-sm">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AI'}
          </div>
        </Link>
      </div>
    </header>
  );
};
