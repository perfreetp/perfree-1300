import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PawPrint, 
  Home, 
  Cat, 
  Calendar, 
  Clock, 
  CreditCard, 
  FileText, 
  Bell, 
  Star, 
  Menu, 
  X,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/pets', label: '宠物档案', icon: Cat },
  { path: '/plans', label: '喂养计划', icon: Calendar },
  { path: '/booking', label: '服务预约', icon: Clock },
  { path: '/records', label: '喂养记录', icon: FileText },
  { path: '/notifications', label: '消息通知', icon: Bell },
  { path: '/reviews', label: '评价售后', icon: Star },
];

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, switchRole } = useAuthStore();
  const unreadCount = useOrderStore((state) => state.getUnreadNotificationCount());

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-primary-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-soft"
            >
              <PawPrint className="w-6 h-6 text-white" />
            </motion.div>
            <span className="font-display text-xl text-gradient hidden sm:block">
              宠心守护
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const hasNotification = item.path === '/notifications' && unreadCount > 0;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-warm-700 hover:text-primary-500 hover:bg-primary-50/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                  {hasNotification && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-primary-50 transition-colors"
              >
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-full border-2 border-primary-200"
                />
                <span className="text-sm font-medium text-warm-700 hidden md:block">
                  {currentUser?.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-warm-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card border border-warm-100 overflow-hidden"
                  >
                    <div className="p-4 border-b border-warm-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={currentUser?.avatar}
                          alt={currentUser?.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-warm-700">{currentUser?.name}</p>
                          <p className="text-sm text-warm-400">{currentUser?.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-warm-400 px-3 py-2">角色切换</p>
                      {(['owner', 'feeder', 'admin'] as const).map((role) => {
                        const roleLabels = { owner: '宠物主人', feeder: '喂养员', admin: '管理员' };
                        const isActive = currentUser?.role === role;
                        return (
                          <button
                            key={role}
                            onClick={() => {
                              switchRole(role);
                              setUserMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left text-sm transition-colors ${
                              isActive
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-warm-600 hover:bg-warm-50'
                            }`}
                          >
                            <User className="w-4 h-4 inline mr-2" />
                            {roleLabels[role]}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/notifications"
              className="relative p-2 rounded-xl hover:bg-primary-50 transition-colors lg:hidden"
            >
              <Bell className="w-5 h-5 text-warm-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-primary-50 transition-colors lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-warm-600" />
              ) : (
                <Menu className="w-5 h-5 text-warm-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-warm-100 overflow-hidden"
          >
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const hasNotification = item.path === '/notifications' && unreadCount > 0;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-warm-600 hover:bg-warm-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {hasNotification && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
