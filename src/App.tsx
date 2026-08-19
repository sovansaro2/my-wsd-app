import { useState, useEffect } from 'react';
import { LogOut, Plus, Settings, Home, List, CircleDollarSign, User } from 'lucide-react';



import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './components/ui/LoadingScreen';
import AuthComponent from './components/Auth';
import Dashboard from './components/Dashboard';

import AccountProfile from './components/AccountProfile';
import ManageNameLists from './components/ManageNameLists';
import ManageFinancialRecords from './components/ManageFinancialRecords';
import RecordsComponent from './components/Records';
import NameLists from './components/NameLists';
import { api } from './lib/apiClient';
import { useLanguage } from './contexts/LanguageContext';

type Tab = 'home' | 'records' | 'categories' | 'account' | 'manage_financials' | 'manage_name_lists';
type Role = 'admin' | 'user' | null;

export default function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userRole, setUserRole] = useState<Role>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserRole();
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
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 pt-16">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-orange-500/95 backdrop-blur-md shadow-sm border-b border-orange-600/20 z-50 px-4 flex items-center justify-between">
        <h1 className="text-white tracking-wide text-2xl pt-1" style={{ fontFamily: "'Khmer OS Kulen', 'Koulen', cursive" }}>វត្តស្នាយដួច</h1>
        <button className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-orange-500"></span>
        </button>
      </header>

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
            {activeTab === 'categories' && <NameLists />}
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe z-50">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'home' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-medium font-battambang">{t('nav_home')}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'records' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <CircleDollarSign className="h-6 w-6" />
            <span className="text-[10px] font-medium font-battambang">{t('nav_finance')}</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'categories' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <List className="h-6 w-6" />
            <span className="text-[10px] font-medium font-battambang">{t('nav_list')}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${['account', 'manage_financials', 'manage_name_lists'].includes(activeTab) ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <User className="h-6 w-6" />
            <span className="text-[10px] font-medium font-battambang">{t('nav_account')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
