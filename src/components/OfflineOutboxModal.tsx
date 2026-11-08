import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  Trash2, 
  CircleDollarSign, 
  CalendarDays, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CloudOff
} from 'lucide-react';
import { 
  getOutboxItems, 
  removeOutboxItem, 
  clearCompletedOutboxItems, 
  clearAllOutbox,
  subscribeOutbox, 
  type OutboxItem,
  isBrowserOnline
} from '../lib/offlineStore';
import { syncEngine } from '../lib/syncEngine';
import { useLanguage } from '../contexts/LanguageContext';

interface OfflineOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
}

export const OfflineOutboxModal: React.FC<OfflineOutboxModalProps> = ({
  isOpen,
  onClose,
  onSyncNow,
  isSyncing: propIsSyncing = false
}) => {
  const { language } = useLanguage();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [internalSyncing, setInternalSyncing] = useState<boolean>(syncEngine.isSyncing());
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  const isSyncing = propIsSyncing || internalSyncing;

  const loadItems = async () => {
    const list = await getOutboxItems();
    setItems(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribeOutbox = subscribeOutbox(() => {
      loadItems();
    });

    const handleSyncStatus = (e: any) => {
      setInternalSyncing(!!e.detail?.isSyncing);
      if (e.detail?.progress) {
        setSyncProgress(e.detail.progress);
      } else {
        setSyncProgress(null);
      }
      loadItems();
    };

    window.addEventListener('wsd-sync-status', handleSyncStatus);

    return () => {
      unsubscribeOutbox();
      window.removeEventListener('wsd-sync-status', handleSyncStatus);
    };
  }, []);

  if (!isOpen) return null;

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(id);
    try {
      await removeOutboxItem(id);
      await loadItems();
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearCompleted = async () => {
    await clearCompletedOutboxItems();
    await loadItems();
  };

  const handleClearAll = async () => {
    if (window.confirm(language === 'en' ? 'Remove all queued offline items?' : 'តើអ្នកប្រាកដជាចង់លុបទិន្នន័យរង់ចាំទាំងអស់ចោលមែនទេ?')) {
      await clearAllOutbox();
      await loadItems();
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${hours}:${mins}:${secs} (${day}/${month})`;
  };

  const pendingCount = items.filter((i) => i.status === 'pending' || i.status === 'failed').length;
  const online = isBrowserOnline();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial_record':
        return <CircleDollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />;
      case 'seil_period':
        return <CalendarDays className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />;
      case 'namelist':
        return <Users className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500 dark:text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CloudOff className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-title text-base sm:text-lg text-gray-900 dark:text-white leading-tight">
                {language === 'en' ? 'Offline Outbox Queue' : 'បញ្ជីទិន្នន័យរង់ចាំបញ្ជូន (Outbox)'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-battambang">
                {language === 'en' ? 'Stored locally in device' : 'រក្សាទុកក្នុងម៉ាស៊ីន រង់ចាំភ្ជាប់អ៊ីនធឺណិត'}
                {' • '}
                <span className="font-rajdhani font-semibold text-gray-700 dark:text-slate-300">
                  {pendingCount}
                </span>{' '}
                {language === 'en' ? 'pending' : 'ទិន្នន័យ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[160px]">
          {items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400 dark:text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 stroke-[1.5]" />
              <p className="font-battambang text-sm text-gray-600 dark:text-slate-300">
                {language === 'en' ? 'Outbox is clear' : 'គ្មានទិន្នន័យរង់ចាំបញ្ជូនឡើយ'}
              </p>
              <p className="font-battambang text-xs mt-0.5 text-gray-400 dark:text-slate-500">
                {language === 'en' 
                  ? 'All records have been synchronized with the server' 
                  : 'ទិន្នន័យទាំងអស់ត្រូវបានធ្វើបច្ចុប្បន្នភាពពេញលេញ'}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 border border-gray-100 dark:border-slate-800 rounded-xl transition-all duration-150 flex items-start justify-between gap-3 hover:border-gray-200 dark:hover:border-slate-700"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {getCategoryIcon(item.category)}
                  <div className="min-w-0 flex-1">
                    <p className="font-battambang text-sm text-gray-900 dark:text-white leading-snug break-words">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                      <span className="font-rajdhani text-gray-400 dark:text-slate-500">
                        {formatTime(item.createdAt)}
                      </span>
                      <span className="text-gray-300 dark:text-slate-600">•</span>
                      {item.status === 'pending' && (
                        <span className="font-battambang text-amber-600 dark:text-amber-400 font-medium">
                          {language === 'en' ? 'Pending' : 'រង់ចាំបញ្ជូន'}
                        </span>
                      )}
                      {item.status === 'syncing' && (
                        <span className="font-battambang text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          {language === 'en' ? 'Syncing...' : 'កំពុងបញ្ជូន...'}
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="font-battambang text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {language === 'en' ? 'Failed' : 'បញ្ជូនមិនទាន់បាន'}
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="font-battambang text-emerald-600 dark:text-emerald-400 font-medium">
                          {language === 'en' ? 'Synced' : 'បានបញ្ជូនជោគជ័យ'}
                        </span>
                      )}
                    </div>
                    {item.lastError && (
                      <p className="mt-1 text-[11px] text-rose-500 font-battambang truncate" title={item.lastError}>
                        {item.lastError}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  disabled={isDeleting === item.id || isSyncing}
                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                  title={language === 'en' ? 'Discard' : 'លុបចោល'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isSyncing}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-battambang cursor-pointer disabled:opacity-40"
              >
                {language === 'en' ? 'Clear All' : 'លុបចោលទាំងអស់'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-battambang cursor-pointer"
            >
              {language === 'en' ? 'Close' : 'បិទ'}
            </button>

            <button
              onClick={async () => {
                if (onSyncNow) {
                  await onSyncNow();
                } else {
                  await syncEngine.syncNow();
                }
                await loadItems();
              }}
              disabled={isSyncing || pendingCount === 0 || !online}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#028090] hover:bg-[#026c7a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-battambang cursor-pointer shadow-sm"
              title={!online ? (language === 'en' ? 'Connect to internet to sync' : 'សូមភ្ជាប់អ៊ីនធឺណិតដើម្បីបញ្ជូន') : undefined}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing 
                  ? (syncProgress ? `${syncProgress.current}/${syncProgress.total}` : (language === 'en' ? 'Syncing...' : 'កំពុងបញ្ជូន...'))
                  : (language === 'en' ? 'Sync Now' : 'បញ្ជូនឥឡូវនេះ')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
