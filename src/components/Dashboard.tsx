import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

import {
  CalendarDays,
  CircleDollarSign,
  List,
  Heart,
  Landmark,
} from 'lucide-react';
import ImageSlider from './ImageSlider';
import { ListSummaryCard } from './ListSummaryCard';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';

interface SeilPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  previous_balance?: number;
  is_closed?: boolean;
  status?: string;
}

interface ListCategory {
  id: string;
  name: string;
  description?: string;
  is_closed?: boolean;
  status?: string;
}

export default function Dashboard({
  onNavigateTab,
  onOpenCalendar,
}: {
  onNavigateTab?: (tab: 'records' | 'categories' | 'donations' | 'account' | 'history') => void;
  onOpenCalendar?: () => void;
  userRole?: 'admin' | 'user' | null;
}) {
  const { language } = useLanguage();
  const isKm = language === 'km';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seils, setSeils] = useState<SeilPeriod[]>([]);
  const [categories, setCategories] = useState<ListCategory[]>([]);

  useEffect(() => {
    fetchData();

    const onDataRefreshed = () => {
      fetchData();
    };

    window.addEventListener('wsd-data-refreshed', onDataRefreshed);
    return () => {
      window.removeEventListener('wsd-data-refreshed', onDataRefreshed);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seilData, categoriesData] = await Promise.all([
        api.getSeilPeriods().catch(() => []),
        api.getNameListCategories().catch(() => []),
      ]);
      setSeils(seilData || []);
      setCategories(categoriesData || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const quickActions = [
    {
      id: 'calendar',
      label: isKm ? 'ប្រតិទិន' : 'Calendar',
      icon: CalendarDays,
      onClick: () => onOpenCalendar?.(),
    },
    {
      id: 'records',
      label: isKm ? 'ហិរញ្ញវត្ថុ' : 'Finance',
      icon: CircleDollarSign,
      onClick: () => onNavigateTab?.('records'),
    },
    {
      id: 'categories',
      label: isKm ? 'បញ្ជី' : 'Lists',
      icon: List,
      onClick: () => onNavigateTab?.('categories'),
    },
    {
      id: 'donations',
      label: isKm ? 'បរិច្ចាគ' : 'Donate',
      icon: Heart,
      onClick: () => onNavigateTab?.('donations'),
    },
    {
      id: 'history',
      label: isKm ? 'អំពីវត្ត' : 'About',
      icon: Landmark,
      onClick: () => onNavigateTab?.('history'),
    },
  ];

  return (
    <div className="flex flex-col pb-6 md:pb-4 font-battambang transition-colors duration-200">
      <div className="w-full pt-1 pb-4 space-y-5 sm:space-y-6">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3.5 rounded-2xl text-sm border border-rose-200 dark:border-rose-500/20">
            {error}
          </div>
        )}

        {/* Section 1: Photo Slider Showcase */}
        <div className="w-full">
          <ImageSlider />
        </div>

        {/* Section 2: មុខងារសំខាន់ៗ (5-Card Quick Grid) */}
        <section aria-label={isKm ? 'មុខងារសំខាន់ៗ' : 'Key Features'} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-title text-xl sm:text-2xl text-[#12323A] dark:text-white">
              {isKm ? 'មុខងារសំខាន់ៗ' : 'Key Features'}
            </h3>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-3.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className="group bg-white dark:bg-[#10252C] rounded-[18px] sm:rounded-[22px] border border-[#EAE6DC] dark:border-teal-900/40 shadow-[0_2px_10px_rgba(18,50,58,0.03)] py-3.5 px-1 sm:py-5 sm:px-3 flex flex-col items-center justify-center gap-2 sm:gap-2.5 active:scale-[0.97] hover:border-[#12323A]/30 dark:hover:border-[#E2BD42]/50 transition-all cursor-pointer"
                >
                  <Icon className="w-[22px] h-[22px] sm:w-7 sm:h-7 text-[#12323A] dark:text-[#E2BD42] stroke-[1.7] group-hover:scale-105 transition-transform shrink-0" />
                  <span className="text-[11px] sm:text-sm font-semibold text-[#12323A] dark:text-slate-100 whitespace-nowrap leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3: Compact List Overview */}
        <div className="w-full">
          <ListSummaryCard
            seils={seils}
            categories={categories}
            language={language}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </div>
    </div>
  );
}
