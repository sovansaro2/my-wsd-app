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

export default function AdminPanel({ initialTab = 'users', onNavigateTab, onBack }: AdminPanelProps) {
  const { language } = useLanguage();
  const [currentSubTab, setCurrentSubTab] = useState<'users' | 'invitation'>(initialTab);

  return (
    <div className="min-h-full flex flex-col">
      <div className="no-print bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-3.5 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              title="ត្រឡប់ក្រោយ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#028090] dark:text-teal-400 shrink-0" />
              <h1 className="font-title text-lg sm:text-2xl text-gray-900 dark:text-white tracking-wide">
                {language === 'en' ? 'Admin Panel' : 'ផ្ទាំងគ្រប់គ្រង Admin'}
              </h1>
            </div>
            <p className="hidden sm:block text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-battambang mt-0.5">
              {language === 'en' 
                ? 'Manage system users, access privileges, and official invitation letters' 
                : 'គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ កំណត់សិទ្ធិ និងបង្កើតលិខិតអញ្ជើញផ្លូវការ'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-1 border-b sm:border-b-0 border-gray-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setCurrentSubTab('users')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-battambang transition-colors border-b-2 sm:border-b-2 ${
              currentSubTab === 'users'
                ? 'border-[#028090] text-[#028090] dark:text-teal-400 font-bold'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>{language === 'en' ? 'User Management' : 'គ្រប់គ្រងអ្នកប្រើប្រាស់'}</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('invitation')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-battambang transition-colors border-b-2 sm:border-b-2 ${
              currentSubTab === 'invitation'
                ? 'border-[#028090] text-[#028090] dark:text-teal-400 font-bold'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'en' ? 'Invitation Letter (A5)' : 'លិខិតអញ្ជើញ'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {currentSubTab === 'users' && (
            <motion.div
              key="admin-users"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Users hideHeader={true} />
            </motion.div>
          )}

          {currentSubTab === 'invitation' && (
            <motion.div
              key="admin-invitation"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <InvitationLetter />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
