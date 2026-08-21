import { useState, useEffect } from 'react';
import { LogOut, Plus, Settings, Home, List, CircleDollarSign, User, FileText, Bell, X } from 'lucide-react';



import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './components/ui/LoadingScreen';
import AuthComponent from './components/Auth';
import Dashboard from './components/Dashboard';

import AccountProfile from './components/AccountProfile';
import ManageNameLists from './components/ManageNameLists';
import ManageFinancialRecords from './components/ManageFinancialRecords';
import RecordsComponent from './components/Records';
import Reports from './components/Reports';
import NameLists from './components/NameLists';
import InstallPrompt from './components/InstallPrompt';
import { api } from './lib/apiClient';
import { useLanguage } from './contexts/LanguageContext';

type Tab = 'home' | 'records' | 'reports' | 'categories' | 'account' | 'manage_financials' | 'manage_name_lists';
type Role = 'admin' | 'user' | null;

export default function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userRole, setUserRole] = useState<Role>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserRole();
      fetchNotifications();
      
      // Auto refresh on focus
      const onFocus = () => fetchNotifications();
      window.addEventListener('focus', onFocus);
      
      // Background refresh every 3 minutes
      const interval = setInterval(fetchNotifications, 180000);
      
      return () => {
        window.removeEventListener('focus', onFocus);
        clearInterval(interval);
      };
    } else {
      setIsInitializing(false);
    }
  }, []);

  const fetchUserRole = async () => {
    try {
      const data = await api.getMe();
      setUserRole(data?.role as Role || 'user');
    } catch (err) {
      console.log('Session expired or unauthorized');
      localStorage.removeItem('access_token'); // Token might be expired
      setUserRole(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      const lastRead = localStorage.getItem('last_read_notifications');
      
      if (data.length > 0) {
        if (!lastRead) {
          setUnreadCount(data.length);
        } else {
          const unread = data.filter((n: any) => new Date(n.created_at).getTime() > new Date(lastRead).getTime());
          setUnreadCount(unread.length);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setUnreadCount(0);
    if (notifications.length > 0) {
      localStorage.setItem('last_read_notifications', notifications[0].created_at);
    }
  };

  const handleNotificationClick = (target_tab: string) => {
    setActiveTab(target_tab as any);
    setShowNotifications(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem('access_token');
    setUserRole(null);
    setActiveTab('home');
  };

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!userRole) {
    return <AuthComponent onLogin={(role) => setUserRole(role)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 pt-16">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-orange-500 dark:bg-slate-950 backdrop-blur-md shadow-sm border-b border-orange-600/20 dark:border-white/5 transition-colors duration-200 z-50 px-4 flex items-center justify-between">
        <h1 className="text-white tracking-wide text-2xl pt-1" style={{ fontFamily: "'Khmer OS Kulen', 'Koulen', cursive" }}>វត្តស្នាយដួច</h1>
        <div className="relative">
          <button 
            onClick={handleOpenNotifications}
            className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-orange-500 dark:border-slate-950 px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notifications Slide-over Drawer */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-slate-950 z-[70] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-battambang font-bold text-lg text-gray-900 dark:text-white">ការជូនដំណឹង</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/20">
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.target_tab)}
                        className="p-4 hover:bg-orange-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer bg-white dark:bg-transparent"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${notif.type === 'income' ? 'bg-emerald-500' : notif.type === 'expense' ? 'bg-rose-500' : 'bg-blue-500'} shadow-sm`} />
                          <div className="flex-1">
                            <p className="text-[14px] font-bold text-gray-900 dark:text-white font-battambang leading-tight mb-1">{notif.title}</p>
                            <p className="text-[13px] text-gray-600 dark:text-slate-400 font-battambang leading-relaxed">{notif.message}</p>
                            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2.5 flex items-center gap-1.5">
                              {new Date(notif.created_at).toLocaleDateString('km-KH')} {new Date(notif.created_at).toLocaleTimeString('km-KH', {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                      </div>
                      <p className="text-gray-500 dark:text-slate-400 text-[14px] font-battambang">មិនមានការជូនដំណឹងថ្មីទេ</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'home' && <Dashboard />}
            {activeTab === 'records' && (
              <RecordsComponent 
                userRole={userRole} 
                onAddRecord={() => setActiveTab('manage_financials')} 
              />
            )}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'categories' && <NameLists userRole={userRole} />}
            {activeTab === 'account' && (
              <AccountProfile
    userRole={userRole}
    onLogout={handleLogout}
    
    onManageFinancials={() => setActiveTab('manage_financials')}
    onManageNameLists={() => setActiveTab('manage_name_lists')}
  />
            )}
            
            {/* Admin Management Views */}
            {activeTab === 'manage_financials' && userRole === 'admin' && (
              <ManageFinancialRecords onBack={() => setActiveTab('account')} />
            )}
            {activeTab === 'manage_name_lists' && userRole === 'admin' && (
              <ManageNameLists onBack={() => setActiveTab('account')} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Create Post Modal */}
      

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-gray-200 dark:border-white/5 px-4 py-2 pb-safe z-50 transition-colors duration-200">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('home')}
            className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${activeTab === 'home' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
          >
            {activeTab === 'home' && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-orange-50 dark:bg-orange-500/10 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <Home className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-medium font-battambang">{t('nav_home')}</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('records')}
            className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${activeTab === 'records' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
          >
            {activeTab === 'records' && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-orange-50 dark:bg-orange-500/10 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <CircleDollarSign className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-medium font-battambang">{t('nav_finance')}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('categories')}
            className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${activeTab === 'categories' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
          >
            {activeTab === 'categories' && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-orange-50 dark:bg-orange-500/10 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <List className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-medium font-battambang">{t('nav_list')}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('reports')}
            className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${activeTab === 'reports' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
          >
            {activeTab === 'reports' && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-orange-50 dark:bg-orange-500/10 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <FileText className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-medium font-battambang">របាយការណ៍</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('account')}
            className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${['account', 'manage_financials', 'manage_name_lists'].includes(activeTab) ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
          >
            {['account', 'manage_financials', 'manage_name_lists'].includes(activeTab) && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-orange-50 dark:bg-orange-500/10 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <User className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-medium font-battambang">{t('nav_account')}</span>
          </motion.button>
        </div>
      </nav>
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
