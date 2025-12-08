import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
  Search,
  Upload,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Database
} from 'lucide-react';

export default function Layout({ children }) {
  const { t } = useTranslation('common');
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: t('nav.search'), href: '/search', icon: Search, permission: 'SEARCH_HCP' },
    { name: t('nav.upload'), href: '/upload', icon: Upload, roles: ['ADMIN'] },
    { name: t('nav.users'), href: '/users', icon: Users, roles: ['ADMIN'] },
    { name: t('nav.dashboard'), href: '/dashboard', icon: BarChart3, roles: ['ADMIN'] },
  ];

  const filteredNav = navigation.filter(item => {
    if (item.roles) return hasRole(...item.roles);
    return true;
  });

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Database className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-lg">{t('sidebar.title')}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {filteredNav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center gap-2 p-4 border-b">
            <Database className="h-8 w-8 text-primary-600" />
            <div>
              <span className="font-bold text-lg block">{t('sidebar.title')}</span>
              <span className="text-xs text-gray-500">{t('sidebar.company')}</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {filteredNav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>{t('auth.role')}: {user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1" />

            {/* Language Switcher */}
            <LanguageSwitcher variant="header" />

            {/* User menu */}
            <div className="relative ml-3">
              <button
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.username}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}
