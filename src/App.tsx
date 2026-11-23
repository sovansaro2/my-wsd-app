import { useState, useEffect, useRef, lazy, Suspense, type ComponentType } from 'react';
import { 
  Home, 
  List, 
  CircleDollarSign, 
  User, 
  FileText, 
  Bell, 
  X, 
  Award, 
  Users as UsersIcon, 
  LogOut, 
  Globe, 
  Sun, 
  Moon,
  Trash2,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Search,
  CalendarDays,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { systemLogger } from './lib/logger';
import { LoadingScreen } from './components/ui/LoadingScreen';
import AuthComponent from './components/Auth';
import Dashboard from './components/Dashboard';
import InstallPrompt from './components/InstallPrompt';
import { NetworkStatusBadge } from './components/NetworkStatusBadge';
import { OfflineOutboxModal } from './components/OfflineOutboxModal';
import { syncEngine } from './lib/syncEngine';

function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  moduleName: string
) {
  return lazy(async () => {
    const storageKey = `lazy_retry_reloaded_${moduleName}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const mod = await factory();
        try {
          sessionStorage.removeItem(storageKey);
        } catch {}
        return mod;
      } catch (err) {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }
        const message = err instanceof Error ? err.message : String(err);
        const isChunkFetchError =
          /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(
            message
          );
        if (isChunkFetchError && typeof window !== 'undefined') {
          let alreadyReloaded = false;
          try {
            alreadyReloaded = sessionStorage.getItem(storageKey) === '1';
            if (!alreadyReloaded) {
              sessionStorage.setItem(storageKey, '1');
            }
          } catch {}
          if (!alreadyReloaded) {
            window.location.reload();
            return new Promise<{ default: T }>(() => {});
          }
        }
        throw err;
      }
    }
    return factory();
  });
}

const BuddhistCalendar = lazyWithRetry(() => import('./components/BuddhistCalendar'), 'BuddhistCalendar');
const AccountProfile = lazyWithRetry(() => import('./components/AccountProfile'), 'AccountProfile');
const Certificates = lazyWithRetry(() => import('./components/Certificates'), 'Certificates');
const RecordsComponent = lazyWithRetry(() => import('./components/Records'), 'Records');
const Reports = lazyWithRetry(() => import('./components/Reports'), 'Reports');
const NameLists = lazyWithRetry(() => import('./components/NameLists'), 'NameLists');
const AdminPanel = lazyWithRetry(() => import('./components/AdminPanel'), 'AdminPanel');
const GlobalDonorSearch = lazyWithRetry(() => import('./components/GlobalDonorSearch'), 'GlobalDonorSearch');
import { api } from './lib/apiClient';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';

type Tab = 'home' | 'records' | 'reports' | 'categories' | 'account' | 'manage_financials' | 'manage_name_lists' | 'certificates' | 'users' | 'admin_panel';
type Role = 'admin' | 'user' | null;

export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      const saved = localStorage.getItem('active_tab') as Tab;
      const validTabs: Tab[] = [
        'home', 
        'records', 
        'reports', 
        'categories', 
        'account', 
        'manage_financials', 
        'manage_name_lists', 
        'certificates', 
        'users',
        'admin_panel'
      ];
      if (saved && validTabs.includes(saved)) {
        return saved;
      }
    } catch {}
    return 'home';
  });

  const [actualRole, setActualRole] = useState<Role>(() => {
    try {
      const cached = localStorage.getItem('cached_user_profile');
      if (cached) {
        const p = JSON.parse(cached);
        return (p?.role as Role) || null;
      }
    } catch {}
    return null;
  });

  const [userRole, setUserRole] = useState<Role>(() => {
    try {
      const cached = localStorage.getItem('cached_user_profile');
      if (cached) {
        const p = JSON.parse(cached);
        return (p?.role as Role) || null;
      }
    } catch {}
    return null;
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('cached_user_profile');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return null;
  });

  const [isInitializing, setIsInitializing] = useState(() => {
    try {
      const token = localStorage.getItem('access_token');
      const cached = localStorage.getItem('cached_user_profile');
      if (token && cached) return false;
      if (!token) return false;
    } catch {}
    return true;
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  const lastTabClickRef = useRef<{ tab: Tab; time: number }>({ tab: activeTab, time: 0 });

  const handleMobileTabClick = (tab: Tab) => {
    const now = Date.now();
    const isDoubleClick = lastTabClickRef.current.tab === tab && (now - lastTabClickRef.current.time) < 500;
    
    try {
      localStorage.setItem('active_tab', tab);
    } catch {}

    if (isDoubleClick) {
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(40);
        }
      } catch {}
      window.location.reload();
      return;
    }

    lastTabClickRef.current = { tab, time: now };
    setActiveTab(tab);
  };
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [openSystemLogsDirectly, setOpenSystemLogsDirectly] = useState(false);
  const [showGlobalDonorSearch, setShowGlobalDonorSearch] = useState(false);
  const [showBuddhistCalendar, setShowBuddhistCalendar] = useState(false);
  const [showOutboxModal, setShowOutboxModal] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) {
        setShowDesktopMenu(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDesktopMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const onSyncCompleted = (e: any) => {
      const { success, failed } = e.detail || {};
      if (success > 0 && failed === 0) {
        setSyncToast({
          message: language === 'en'
            ? `Successfully synced ${success} item${success > 1 ? 's' : ''}`
            : `បានបញ្ជូនទិន្នន័យ ${success} ទៅកាន់ម៉ាស៊ីនមេដោយជោគជ័យ`,
          type: 'success'
        });
        setTimeout(() => setSyncToast(null), 4000);
      } else if (failed > 0) {
        setSyncToast({
          message: language === 'en'
            ? `Sync completed: ${success} synced, ${failed} failed`
            : `បញ្ជូនទិន្នន័យ៖ ជោគជ័យ ${success}, មិនទាន់ជោគជ័យ ${failed}`,
          type: 'error'
        });
        setTimeout(() => setSyncToast(null), 5000);
      }
    };

    window.addEventListener('wsd-sync-completed', onSyncCompleted);
    return () => {
      window.removeEventListener('wsd-sync-completed', onSyncCompleted);
    };
  }, [language]);

  // Open Buddhist Calendar directly when user taps a Lock Screen notification
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('open') === 'calendar') {
        setShowBuddhistCalendar(true);
        params.delete('open');
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', nextUrl);
      }
    } catch {}

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OPEN_CALENDAR') {
        setShowBuddhistCalendar(true);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // Quietly check today/tomorrow Seil & monastery events for local OS alerts if enabled (lazy-loaded)
    const timer = setTimeout(() => {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        localStorage.getItem('wsd_calendar_push_enabled') === '1'
      ) {
        Promise.all([api.getEvents(), import('./lib/pushNotifications')])
          .then(([evList, pushMod]) => {
            if (Array.isArray(evList)) {
              pushMod.checkAndNotifyUpcomingLocally(evList);
            }
          })
          .catch(() => {});
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, []);

  
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.error?.message || event.message || '';
      if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('ResizeObserver')) return;
      systemLogger.error(msg, event.error?.stack);
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = typeof event.reason === 'string' ? event.reason : (event.reason?.message || '');
      if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('ResizeObserver')) return;
      systemLogger.error('Unhandled Promise Rejection', event.reason?.stack || event.reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const onAuthExpired = () => {
      setCurrentUser(null);
      setActualRole(null);
      setUserRole(null);
    };
    window.addEventListener('auth-token-expired', onAuthExpired);

    // Defer background offline prewarm until after initial UI settles so startup stays instant
    const prewarmTimer = setTimeout(() => {
      api.prewarmOfflineDatabase().catch(() => {});
    }, 8000);

    const handleOnlinePrewarm = () => {
      api.prewarmOfflineDatabase().catch(() => {});
    };
    window.addEventListener('online', handleOnlinePrewarm);

    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserRole();
      fetchNotifications();
      const stopSync = syncEngine.startBackgroundSyncListener();
      
      const onFocus = () => fetchNotifications();
      window.addEventListener('focus', onFocus);
      
      const interval = setInterval(fetchNotifications, 180000);
      
      return () => {
        clearTimeout(prewarmTimer);
        window.removeEventListener('auth-token-expired', onAuthExpired);
        window.removeEventListener('online', handleOnlinePrewarm);
        window.removeEventListener('focus', onFocus);
        clearInterval(interval);
        stopSync();
      };
    } else {
      setIsInitializing(false);
      return () => {
        clearTimeout(prewarmTimer);
        window.removeEventListener('auth-token-expired', onAuthExpired);
        window.removeEventListener('online', handleOnlinePrewarm);
      };
    }
  }, []);

  const fetchUserRole = async () => {
    try {
      const data = await api.getMe();
      if (!data) {
        // Fallback to local profile cache if available
        const cached = localStorage.getItem('cached_user_profile');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setCurrentUser(parsed);
            const role = (parsed?.role as Role) || 'user';
            setActualRole(role);
            setUserRole(role);
            return;
          } catch {}
        }
        return;
      }
      setCurrentUser(data);
      try {
        localStorage.setItem('cached_user_profile', JSON.stringify(data));
      } catch {}
      const role = (data?.role as Role) || 'user';
      setActualRole(role);
      setUserRole(role);
    } catch {
      // In case of network errors or offline, retain cached profile
      const cached = localStorage.getItem('cached_user_profile');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCurrentUser(parsed);
          const role = (parsed?.role as Role) || 'user';
          setActualRole(role);
          setUserRole(role);
        } catch {}
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      const clearedAt = localStorage.getItem('cleared_notifications_at');
      
      const list = Array.isArray(data) ? data : [];
      const activeNotifications = clearedAt 
        ? list.filter((n: any) => new Date(n.created_at).getTime() > new Date(clearedAt).getTime())
        : list;

      setNotifications(activeNotifications);
      const lastRead = localStorage.getItem('last_read_notifications');
      
      if (activeNotifications.length > 0) {
        if (!lastRead) {
          setUnreadCount(activeNotifications.length);
        } else {
          const unread = activeNotifications.filter((n: any) => new Date(n.created_at).getTime() > new Date(lastRead).getTime());
          setUnreadCount(unread.length);
        }
      } else {
        setUnreadCount(0);
      }
    } catch (err: any) {
      console.warn('Notifications temporarily unavailable:', err);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setUnreadCount(0);
    if (notifications.length > 0) {
      localStorage.setItem('last_read_notifications', notifications[0].created_at);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem('cleared_notifications_at', now);
      localStorage.setItem('last_read_notifications', now);
      setNotifications([]);
      setUnreadCount(0);

      await api.clearNotifications().catch((err: any) => {
        console.warn('Backend clear notifications warning:', err);
      });
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = (notif: any) => {
    setSelectedNotification(notif);
  };

  const handleLogout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('cached_user_profile');
    localStorage.removeItem('active_tab');
    localStorage.removeItem('account_subview');
    setActualRole(null);
    setUserRole(null);
    setCurrentUser(null);
    setActiveTab('home');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'km' ? 'en' : 'km');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (isInitializing) {
    return <LoadingScreen />;
  }

  const handleLogin = (role: 'admin' | 'user') => {
    setUserRole(role);
    setActualRole(role);
    fetchUserRole();
    fetchNotifications();
    api.prewarmOfflineDatabase().catch(() => {});
  };

  if (!userRole) {
    return (
      <>
        <AuthComponent onLogin={handleLogin} />
        <InstallPrompt />
      </>
    );
  }

  const desktopPrimaryLinks: Array<{ id: Tab; label: string }> = [
    { id: 'home', label: t('nav_home') },
    { id: 'records', label: t('nav_finance') },
    { id: 'categories', label: t('nav_list') },
  ];

  const isAdminUser = actualRole === 'admin' || userRole === 'admin';
  const accountDisplayName = currentUser?.full_name || currentUser?.username || t('nav_account');

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-slate-950 transition-colors duration-200 overflow-x-clip w-full max-w-full">
      
      {/* Desktop Website Top Navigation Bar */}
      <header className="hidden md:block sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-gray-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer group"
          >
            <img
              src="/logo.png"
              alt={t('app_title')}
              className="w-9 h-9 object-contain shrink-0"
            />
            <span className={`text-gray-900 dark:text-white group-hover:text-[#028090] dark:group-hover:text-teal-400 transition-colors whitespace-nowrap shrink-0 ${
              language === 'en'
                ? 'font-rajdhani font-bold text-xl tracking-wide'
                : 'font-title text-lg lg:text-xl pt-0.5'
            }`}>
              {language === 'en' ? 'Wat Snay Duoc' : 'វត្តស្នាយដួច'}
            </span>
          </button>

          {/* Zone 2: Horizontal Website Navigation Links */}
          <nav aria-label="Primary" className="flex items-center gap-5 lg:gap-7 h-full overflow-x-auto no-scrollbar">
            {desktopPrimaryLinks.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`relative h-full inline-flex items-center text-[14px] lg:text-[15px] font-battambang whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#028090] dark:border-teal-400 text-[#028090] dark:text-teal-400 font-semibold'
                      : 'border-transparent text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShowGlobalDonorSearch(true)}
              className={`relative h-full inline-flex items-center gap-1.5 text-[14px] lg:text-[15px] font-battambang whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                showGlobalDonorSearch
                  ? 'border-[#028090] dark:border-teal-400 text-[#028090] dark:text-teal-400 font-semibold'
                  : 'border-transparent text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>{language === 'en' ? 'Search' : 'ស្វែងរក'}</span>
            </button>
          </nav>

          {/* Zone 3: Calendar, Notifications & Account Menu */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <NetworkStatusBadge onClick={() => setShowOutboxModal(true)} />

            <button
              type="button"
              onClick={() => setShowBuddhistCalendar(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs lg:text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-700 hover:border-[#028090] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 font-battambang"
              title={language === 'en' ? 'Buddhist Calendar' : 'ប្រតិទិនពុទ្ធសាសនា'}
              aria-label={language === 'en' ? 'Buddhist Calendar' : 'ប្រតិទិនពុទ្ធសាសនា'}
            >
              <CalendarDays className="w-4 h-4 shrink-0 text-[#028090] dark:text-teal-400" />
              <span className="hidden lg:inline">{language === 'en' ? 'Calendar' : 'ប្រតិទិន'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNotifications}
              className="relative p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="ការជូនដំណឹង"
              aria-label="ការជូនដំណឹង"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-0.5 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-rajdhani font-bold px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="relative" ref={desktopMenuRef}>
              <button
                type="button"
                onClick={() => setShowDesktopMenu((prev) => !prev)}
                aria-expanded={showDesktopMenu}
                aria-haspopup="menu"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs lg:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 font-battambang ${
                  ['account', 'certificates', 'reports', 'admin_panel', 'users'].includes(activeTab)
                    ? 'border-[#028090] text-[#028090] dark:border-teal-400 dark:text-teal-400'
                    : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span className="max-w-[120px] truncate">{accountDisplayName}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${showDesktopMenu ? 'rotate-180' : ''}`} />
              </button>

              {showDesktopMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50 font-battambang"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveTab('account');
                      setShowDesktopMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                      activeTab === 'account'
                        ? 'text-[#028090] dark:text-teal-400 font-semibold'
                        : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <span>{t('nav_account')}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveTab('reports');
                      setShowDesktopMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                      activeTab === 'reports'
                        ? 'text-[#028090] dark:text-teal-400 font-semibold'
                        : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>{t('nav_reports')}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveTab('certificates');
                      setShowDesktopMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                      activeTab === 'certificates'
                        ? 'text-[#028090] dark:text-teal-400 font-semibold'
                        : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>{t('profile_certificates')}</span>
                  </button>

                  {isAdminUser && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActiveTab('admin_panel');
                        setShowDesktopMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                        activeTab === 'admin_panel' || activeTab === 'users'
                          ? 'text-[#028090] dark:text-teal-400 font-semibold'
                          : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{language === 'en' ? 'Management' : 'ផ្ទាំងគ្រប់គ្រង'}</span>
                    </button>
                  )}

                  <div className="my-1.5 border-t border-gray-100 dark:border-slate-800" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleLanguage();
                      setShowDesktopMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>{t('profile_change_lang')}</span>
                    </span>
                    <span className="text-xs font-rajdhani font-semibold text-[#028090] dark:text-teal-400">
                      {language === 'km' ? 'KM' : 'EN'}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleTheme();
                      setShowDesktopMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                      <span>{theme === 'dark' ? t('profile_theme_light_label') : t('profile_theme_dark_label')}</span>
                    </span>
                  </button>

                  <div className="my-1.5 border-t border-gray-100 dark:border-slate-800" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowDesktopMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>{t('profile_logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <header className="md:hidden fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top)] bg-[#028090] dark:bg-slate-950 shadow-[0_1px_2px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)] border-b border-[#005F73]/30 dark:border-white/5 z-50">
        <div className="h-14 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 mr-2">
            <h1 className={`text-white select-none pt-0.5 truncate ${
              language === 'en'
                ? 'font-rajdhani font-bold text-lg sm:text-xl tracking-wide uppercase'
                : 'font-title font-normal text-lg sm:text-xl tracking-normal'
            }`}>
              {t('app_title_mobile')}
            </h1>
            <NetworkStatusBadge className="text-amber-200 dark:text-amber-300" onClick={() => setShowOutboxModal(true)} />
          </div>
          <div className="relative shrink-0 flex items-center">
            <button
              onClick={() => setShowBuddhistCalendar(true)}
              className="w-11 h-11 text-white active:opacity-70 rounded-full transition-opacity flex items-center justify-center cursor-pointer"
              title={language === 'en' ? 'Buddhist Calendar' : 'ប្រតិទិនពុទ្ធសាសនា'}
              aria-label={language === 'en' ? 'Buddhist Calendar' : 'ប្រតិទិនពុទ្ធសាសនា'}
            >
              <CalendarDays className="w-5 h-5 text-white" />
            </button>

            <button 
              onClick={handleOpenNotifications}
              aria-label="ការជូនដំណឹង"
              className="relative w-11 h-11 text-white active:opacity-70 rounded-full transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-[22px] h-[22px]" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-rajdhani font-bold border border-[#028090] dark:border-slate-950 px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showNotifications && (
          <div>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/50 dark:bg-black/65 z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] bg-white dark:bg-slate-950 z-[70] shadow-2xl rounded-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-battambang text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  ការជូនដំណឹង
                  {unreadCount > 0 && (
                    <span className="text-red-500 text-xs font-bold font-rajdhani tabular-nums">
                      ({unreadCount})
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearAllNotifications}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-full transition-colors flex items-center justify-center mr-1"
                      title="លុបទាំងអស់"
                      aria-label="លុបទាំងអស់"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => setShowNotifications(false)}
                    aria-label="បិទ"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/20">
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {notifications.length > 0 ? (
                    notifications.map((notif: any) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="p-4 hover:bg-teal-50/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer bg-white dark:bg-transparent"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 text-[#028090] dark:text-teal-400 rounded-xl shrink-0 mt-0.5">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] text-gray-900 dark:text-white font-battambang leading-normal mb-1">{notif.title}</p>
                            <p className="text-[13px] text-gray-600 dark:text-slate-400 font-battambang leading-relaxed">{notif.message}</p>
                            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2.5 flex items-center gap-1.5">
                              <span>{new Date(notif.created_at).toLocaleDateString('km-KH')}</span>
                              <span>•</span>
                              <span>{new Date(notif.created_at).toLocaleTimeString('km-KH', {hour: '2-digit', minute:'2-digit'})}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 px-4 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Bell className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                      </div>
                      <p className="text-gray-500 dark:text-slate-400 text-[14px] font-battambang">មិនមានការជូនដំណឹងថ្មីទេ</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNotification && (
          <div>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="fixed inset-0 bg-black/60 z-[80]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-slate-900 z-[90] shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            >
              <div className={`p-6 pb-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between ${
                selectedNotification.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 
                selectedNotification.type === 'expense' ? 'bg-rose-50 dark:bg-rose-900/20' : 
                'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    selectedNotification.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                    selectedNotification.type === 'expense' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 
                    'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="font-battambang text-gray-900 dark:text-white text-lg">
                    {selectedNotification.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-[15px] text-gray-700 dark:text-slate-300 font-battambang leading-relaxed mb-6">
                  {selectedNotification.message}
                </p>
                
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-2">
                    ពេលវេលា៖ {new Date(selectedNotification.created_at).toLocaleDateString('km-KH')} {new Date(selectedNotification.created_at).toLocaleTimeString('km-KH', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="flex-1 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    បិទ
                  </button>
                  <button
                    onClick={() => {
                      if (selectedNotification.target_tab === 'calendar') {
                        setShowBuddhistCalendar(true);
                      } else if (selectedNotification.target_tab) {
                        setActiveTab(selectedNotification.target_tab as any);
                      }
                      setShowNotifications(false);
                      setSelectedNotification(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl text-white bg-[#028090] hover:bg-[#005F73] transition-colors shadow-lg shadow-[#028090]/25"
                  >
                    ទៅកាន់ទំព័រ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0">
        <main className={`flex-1 w-full max-w-7xl mx-auto ${activeTab === 'home' ? 'px-2.5 sm:px-6 lg:px-8' : 'px-3.5 sm:px-6 lg:px-8'} py-2.5 md:py-7`}>
          <div className="h-full">
            <Suspense fallback={
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-[#028090] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400 font-battambang">កំពុងដំណើរការ...</span>
              </div>
            }>
              {activeTab === 'home' && (
              <Dashboard 
                onNavigateTab={(tab) => setActiveTab(tab)} 
                userRole={userRole}
              />
            )}
            {activeTab === 'records' && (
              <RecordsComponent 
                userRole={userRole} 
              />
            )}
            {activeTab === 'reports' && <Reports userRole={userRole} onBack={() => setActiveTab('account')} />}
            {activeTab === 'categories' && (
              <NameLists 
                userRole={userRole}
              />
            )}
            {activeTab === 'account' && (
              <AccountProfile
                currentUser={currentUser}
                onUpdateCurrentUser={setCurrentUser}
                userRole={userRole}
                actualRole={actualRole}
                onViewModeChange={(mode) => setUserRole(mode)}
                onLogout={handleLogout}
                initialSystemLogsOpen={openSystemLogsDirectly}
                onClearInitialSystemLogsOpen={() => setOpenSystemLogsDirectly(false)}
                onManageUsers={() => setActiveTab('admin_panel')}
                onCertificates={() => setActiveTab('certificates')}
                onReports={() => setActiveTab('reports')}
              />
            )}
            
            {activeTab === 'certificates' && (
              <Certificates userRole={userRole} onBack={() => setActiveTab('account')} />
            )}

            {(activeTab === 'admin_panel' || activeTab === 'users') && (
              (actualRole === 'admin' || userRole === 'admin') ? (
                <AdminPanel 
                  initialTab="users"
                  onNavigateTab={(tab) => setActiveTab(tab as Tab)}
                  onBack={() => setActiveTab('account')}
                />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm border border-gray-100 dark:border-slate-800 my-8">
                  <Shield className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3.5" />
                  <h3 className="font-title text-xl text-gray-900 dark:text-white mb-2">
                    {language === 'en' ? 'Administrator Access Only' : 'សម្រាប់តែអ្នកគ្រប់គ្រង'}
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 text-sm font-battambang mb-6 leading-relaxed">
                    {language === 'en'
                      ? 'You do not have administrative permissions to view or manage this section. Please sign in with an administrator account.'
                      : 'គណនីនេះគ្មានសិទ្ធិអ្នកគ្រប់គ្រងទេ។ សូមចូលប្រើដោយគណនីអ្នកគ្រប់គ្រង។'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setActiveTab('home')}
                      className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-battambang text-sm transition-colors"
                    >
                      {language === 'en' ? 'Back to Home' : 'ត្រឡប់ទៅទំព័រដើម'}
                    </button>
                    <button
                      onClick={() => setActiveTab('account')}
                      className="px-5 py-2.5 rounded-xl bg-[#028090] hover:bg-[#005F73] text-white font-battambang text-sm transition-colors shadow-sm"
                    >
                      {language === 'en' ? 'Go to Account' : 'ទៅកាន់គណនី'}
                    </button>
                  </div>
                </div>
              )
            )}
            </Suspense>
          </div>
        </main>

        {/* Desktop Website Footer */}
        <footer className="hidden md:block border-t border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-7">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt={t('app_title')} className="w-9 h-9 object-contain shrink-0" />
                <div>
                  <p className="font-title text-base text-gray-900 dark:text-white leading-tight">
                    {language === 'en' ? 'Wat Snay Duoc' : 'វត្តស្នាយដួច'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-battambang mt-0.5">
                    {language === 'en'
                      ? 'Temple financial records, donor directory & Buddhist calendar'
                      : 'ប្រព័ន្ធគ្រប់គ្រងបច្ច័យ បញ្ជីសប្បុរសជន និងកាលវិភាគកម្មវិធីបុណ្យ'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs lg:text-sm font-battambang text-gray-600 dark:text-slate-300">
                {desktopPrimaryLinks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`hover:text-[#028090] dark:hover:text-teal-400 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === item.id ? 'text-[#028090] dark:text-teal-400 font-semibold' : ''
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('certificates');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`hover:text-[#028090] dark:hover:text-teal-400 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'certificates' ? 'text-[#028090] dark:text-teal-400 font-semibold' : ''
                  }`}
                >
                  {t('profile_certificates')}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 font-battambang">
              <span>
                © <span className="font-rajdhani">{new Date().getFullYear()}</span> {language === 'en' ? 'Wat Snay Duoc' : 'វត្តស្នាយដួច'}
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="hover:text-gray-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {language === 'km' ? 'ភាសាខ្មែរ · English' : 'English · ភាសាខ្មែរ'}
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="hover:text-gray-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? t('profile_theme_light_label') : t('profile_theme_dark_label')}
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-gray-200/80 dark:border-slate-800 z-40 shadow-[0_-1px_2px_0_rgba(0,0,0,0.04)] dark:shadow-[0_-1px_2px_0_rgba(0,0,0,0.3)] pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div className="flex items-center justify-around max-w-lg mx-auto px-1">
          <button
            onClick={() => handleMobileTabClick('home')}
            aria-label={t('nav_home')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[46px] py-0.5 px-1 transition-transform active:scale-95 relative ${
              activeTab === 'home' 
                ? 'text-[#028090] dark:text-teal-400' 
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-center w-10 h-7">
              <Home className={`h-[21px] w-[21px] ${activeTab === 'home' ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
            </div>
            <span className={`text-[11px] font-battambang mt-0.5 whitespace-nowrap leading-tight ${activeTab === 'home' ? 'font-semibold' : 'font-normal'}`}>
              {t('nav_home')}
            </span>
          </button>
          
          <button
            onClick={() => handleMobileTabClick('records')}
            aria-label={t('nav_finance')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[46px] py-0.5 px-0.5 transition-transform active:scale-95 relative ${
              activeTab === 'records' 
                ? 'text-[#028090] dark:text-teal-400' 
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-center w-10 h-7">
              <CircleDollarSign className={`h-[21px] w-[21px] ${activeTab === 'records' ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
            </div>
            <span className={`text-[11px] font-battambang mt-0.5 whitespace-nowrap leading-tight ${activeTab === 'records' ? 'font-semibold' : 'font-normal'}`}>
              {t('nav_finance')}
            </span>
          </button>

          <button
            onClick={() => handleMobileTabClick('categories')}
            aria-label={t('nav_list')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[46px] py-0.5 px-0.5 transition-transform active:scale-95 relative ${
              activeTab === 'categories' 
                ? 'text-[#028090] dark:text-teal-400' 
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-center w-10 h-7">
              <List className={`h-[21px] w-[21px] ${activeTab === 'categories' ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
            </div>
            <span className={`text-[11px] font-battambang mt-0.5 whitespace-nowrap leading-tight ${activeTab === 'categories' ? 'font-semibold' : 'font-normal'}`}>
              {t('nav_list')}
            </span>
          </button>

          <button
            onClick={() => setShowGlobalDonorSearch(true)}
            aria-label={language === 'en' ? 'Search' : 'ស្វែងរក'}
            className={`flex flex-col items-center justify-center flex-1 min-h-[46px] py-0.5 px-0.5 transition-transform active:scale-95 relative cursor-pointer ${
              showGlobalDonorSearch
                ? 'text-[#028090] dark:text-teal-400' 
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-center w-10 h-7">
              <Search className={`h-[21px] w-[21px] ${showGlobalDonorSearch ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
            </div>
            <span className={`text-[11px] font-battambang mt-0.5 whitespace-nowrap leading-tight ${showGlobalDonorSearch ? 'font-semibold' : 'font-normal'}`}>
              {language === 'en' ? 'Search' : 'ស្វែងរក'}
            </span>
          </button>
          
          <button
            onClick={() => handleMobileTabClick('account')}
            aria-label={t('nav_account')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[46px] py-0.5 px-0.5 transition-transform active:scale-95 relative ${
              ['account', 'users', 'certificates', 'reports', 'admin_panel'].includes(activeTab) 
                ? 'text-[#028090] dark:text-teal-400' 
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-center w-10 h-7">
              <User className={`h-[21px] w-[21px] ${['account', 'users', 'certificates', 'reports', 'admin_panel'].includes(activeTab) ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
            </div>
            <span className={`text-[11px] font-battambang mt-0.5 whitespace-nowrap leading-tight ${['account', 'users', 'certificates', 'reports', 'admin_panel'].includes(activeTab) ? 'font-semibold' : 'font-normal'}`}>
              {t('nav_account')}
            </span>
          </button>
        </div>
      </nav>
      
      <InstallPrompt />
      <OfflineOutboxModal 
        isOpen={showOutboxModal} 
        onClose={() => setShowOutboxModal(false)} 
      />

      {syncToast && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-gray-200 dark:border-slate-800 animate-slide-up text-xs font-battambang select-none">
          {syncToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span className="text-gray-900 dark:text-white font-medium">{syncToast.message}</span>
        </div>
      )}

      {showGlobalDonorSearch && (
        <Suspense fallback={null}>
          <GlobalDonorSearch
            isOpen={showGlobalDonorSearch}
            userRole={userRole}
            onClose={() => setShowGlobalDonorSearch(false)}
          />
        </Suspense>
      )}

      {showBuddhistCalendar && (
        <Suspense fallback={null}>
          <BuddhistCalendar
            isOpen={showBuddhistCalendar}
            onClose={() => setShowBuddhistCalendar(false)}
            userRole={userRole}
          />
        </Suspense>
      )}
    </div>
  );
}
