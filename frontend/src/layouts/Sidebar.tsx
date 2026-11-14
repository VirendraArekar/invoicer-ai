import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Receipt,
  Package,
  BarChart3,
  Sparkles,
  Settings as SettingsIcon,
  LogOut,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out safely.', 'Logged Out');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Invoices', path: '/invoices', icon: FileText, badge: 'Smart' },
    { label: 'Clients', path: '/clients', icon: Users },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Expenses', path: '/expenses', icon: Receipt },
    { label: 'Catalog', path: '/catalog', icon: Package },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'AI Copilot', path: '/ai-assistant', icon: Sparkles, glow: true },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800/80">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 text-white shadow-glow group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Invoicer <span className="text-brand-600 dark:text-brand-400 font-extrabold">AI</span>
              </span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                } ${item.glow ? 'border border-brand-500/30' : ''}`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300">
                  {item.badge}
                </span>
              )}
              {item.glow && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* AI Pulse Badge Card */}
        <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-b from-brand-50/60 to-slate-100/60 dark:from-slate-800/80 dark:to-slate-900 border border-brand-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-brand-500 dark:text-brand-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">Gemini AI Active</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Autonomous invoice generation & smart debt collection enabled.
          </p>
          <NavLink
            to="/invoices/new"
            onClick={onClose}
            className="flex items-center justify-center w-full py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-all shadow-sm hover:shadow"
          >
            + New AI Invoice
          </NavLink>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white font-bold text-xs uppercase shadow-sm">
              {user?.name ? user.name.substring(0, 2) : 'AI'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Alex Rivera'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.companyName || 'Business Owner'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
