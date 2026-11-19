import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users as UsersIcon, FileText, Shield, ArrowLeft } from 'lucide-react';
import Users from './Users';
import InvitationLetter from './InvitationLetter';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminPanelProps {
  initialTab?: 'users' | 'invitation';
  onNavigateTab?: (tab: string) => void;
  onBack?: () => void;
}

export default function AdminPanel({ initialTab = 'users', onBack }: AdminPanelProps) {
  const { language } = useLanguage();
  const [currentSubTab, setCurrentSubTab] = useState<'users' | 'invitation'>(initialTab);

  return (
    <div className="min-h-full flex flex-col max-w-6xl mx-auto w-full">
      <div className="no-print bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-xl px-4 sm:px-6 py-3.5 sm:py-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 -ml-1 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title={language === 'en' ? 'Back' : 'ត្រឡប់'}
              aria-label={language === 'en' ? 'Back' : 'ត្រឡប់'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#028090] dark:text-teal-400 shrink-0" />
              <h1 className="font-title text-lg sm:text-xl text-gray-900 dark:text-white truncate">
                {language === 'en' ? 'Management' : 'ផ្ទាំងគ្រប់គ្រង'}
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-battambang mt-0.5 truncate">
              {language === 'en'
                ? 'Accounts, roles, and invitation letters'
                : 'គណនី សិទ្ធិ និងលិខិតអញ្ជើញ'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:inline-flex items-center p-1 rounded-lg bg-gray-100/90 dark:bg-slate-800/80 border border-gray-200/70 dark:border-slate-700/70 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentSubTab('users')}
            className={`flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-battambang rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              currentSubTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UsersIcon className="w-4 h-4 shrink-0" />
            <span>{language === 'en' ? 'Users' : 'អ្នកប្រើប្រាស់'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('invitation')}
            className={`flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-battambang rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              currentSubTab === 'invitation'
                ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{language === 'en' ? 'Letters' : 'លិខិតអញ្ជើញ'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {currentSubTab === 'users' && (
            <motion.div
              key="admin-users"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
            >
              <Users hideHeader={true} />
            </motion.div>
          )}

          {currentSubTab === 'invitation' && (
            <motion.div
              key="admin-invitation"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
            >
              <InvitationLetter />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
