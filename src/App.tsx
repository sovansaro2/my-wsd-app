import { useState, useEffect } from 'react';
import { LogOut, Plus, Settings } from 'lucide-react';
import { MdHome, MdDashboard, MdPerson } from 'react-icons/md';
import { TbDatabaseDollar } from 'react-icons/tb';
import { CiViewList } from 'react-icons/ci';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './components/ui/LoadingScreen';
import AuthComponent from './components/Auth';
import FeedComponent from './components/Feed';
import CreatePostModal from './components/CreatePostModal';
import ManagePosts from './components/ManagePosts';
import AccountProfile from './components/AccountProfile';
import ManageNameLists from './components/ManageNameLists';
import ManageFinancialRecords from './components/ManageFinancialRecords';

import RecordsComponent from './components/Records';

import NameLists from './components/NameLists';

type Tab = 'home' | 'records' | 'categories' | 'account' | 'manage_posts' | 'manage_financials' | 'manage_name_lists';
type Role = 'admin' | 'user' | null;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userRole, setUserRole] = useState<Role>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.role) {
          setUserRole(userData.role);
        }
      } catch (e) {
        console.error("Failed to parse auth user", e);
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (role: Role) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('authUser');
  };

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!userRole) {
    return <AuthComponent onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <FeedComponent />;
      case 'records':
        return <RecordsComponent />;
      case 'categories':
        return <NameLists />;
      case 'manage_posts':
        return <ManagePosts onBack={() => setActiveTab('account')} />;
      case 'manage_financials':
        return <ManageFinancialRecords onBack={() => setActiveTab('account')} />;
      case 'manage_name_lists':
        return <ManageNameLists onBack={() => setActiveTab('account')} />;
      case 'account':
        return (
          <AccountProfile 
            userRole={userRole} 
            onLogout={handleLogout} 
            onManagePosts={() => setActiveTab('manage_posts')} 
            onManageFinancials={() => setActiveTab('manage_financials')}
            onManageNameLists={() => setActiveTab('manage_name_lists')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="flex h-screen w-full flex-col bg-gray-50 text-gray-900 font-sans"
      style={{ fontFamily: 'Battambang, sans-serif' }}
    >
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Koulen&display=swap');`}
      </style>
      {/* Top Navbar */}
      <header className="flex h-16 shrink-0 items-center justify-between bg-blue-800 px-4 sm:px-6 text-white shadow-md z-10">
        <h1 
          className="text-3xl tracking-wider pt-1"
          style={{ fontFamily: 'Koulen, cursive' }}
        >
          វត្តស្នាយដួច
        </h1>
        <div className="flex items-center">
          {userRole === 'admin' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1 rounded-full bg-blue-700/50 px-3 py-1.5 text-xs font-medium border border-blue-600/50 shadow-inner hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>បង្ហោះ</span>
            </button>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="flex h-16 shrink-0 items-center justify-around border-t border-gray-200 bg-white pb-safe z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors ${
            activeTab === 'home' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <MdHome className="h-6 w-6" />
          <span className="text-[10px] font-bold whitespace-nowrap">ទំព័រដើម</span>
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors ${
            activeTab === 'records' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <TbDatabaseDollar className="h-6 w-6" />
          <span className="text-[10px] font-bold whitespace-nowrap">ចំណូលចំណាយ</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors ${
            activeTab === 'categories' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <CiViewList className="h-6 w-6" />
          <span className="text-[10px] font-bold whitespace-nowrap">បញ្ជីផ្សេងៗ</span>
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors ${
            activeTab === 'account' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <MdPerson className="h-6 w-6" />
          <span className="text-[10px] font-bold whitespace-nowrap">គណនី</span>
        </button>
      </nav>

      {/* Modals */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
