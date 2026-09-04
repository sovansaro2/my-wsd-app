import React, { useState } from 'react';
import { Database, FileSpreadsheet, FileCode, Download, Check, X, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataBackupModal({ isOpen, onClose }: DataBackupModalProps) {
  const { language } = useLanguage();
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      setError(null);
      setStatusMessage(null);

      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/backup/excel', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate Excel backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `WSD_Full_Backup_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage(language === 'en' ? 'Excel backup downloaded successfully!' : 'បានទាញយកទិន្នន័យ Excel ដោយជោគជ័យ!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error downloading Excel backup');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadJson = async () => {
    try {
      setDownloadingJson(true);
      setError(null);
      setStatusMessage(null);

      const data = await api.get<any>('/api/backup/data');
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const a = document.createElement('a');
      a.href = jsonString;
      const today = new Date().toISOString().split('T')[0];
      a.download = `WSD_Raw_Backup_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatusMessage(language === 'en' ? 'JSON backup downloaded successfully!' : 'បានទាញយកទិន្នន័យ JSON ដោយជោគជ័យ!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error downloading JSON backup');
    } finally {
      setDownloadingJson(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs font-battambang animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-orange-500 shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'en' ? 'System Data Backup' : 'ការបម្រុងទុកទិន្នន័យប្រព័ន្ធ'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {statusMessage && (
            <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Backup Option Cards (No background container colors, clean & direct) */}
          <div className="space-y-3 pt-2">
            {/* Excel (.xlsx) Option */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    {language === 'en' ? 'Full Excel Backup (.xlsx)' : 'ឯកសារ Excel'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {language === 'en'
                      ? 'Formatted multi-sheet workbook for financial & donor audits'
                      : 'សៀវភៅបញ្ជីពហុផ្ទាំង រៀបចំរួចស្រេចសម្រាប់ពិនិត្យ និងបោះពុម្ព'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-lg transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {downloadingExcel ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Generating...' : 'កំពុងបង្កើត...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{language === 'en' ? 'Download Excel' : 'ទាញយក Excel'}</span>
                  </>
                )}
              </button>
            </div>

            {/* JSON (.json) Raw Option */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <FileCode className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    {language === 'en' ? 'Raw Database Backup (.json)' : 'ទិន្នន័យដើម JSON'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {language === 'en'
                      ? 'Complete database snapshot for technical restore & archival'
                      : 'ទិន្នន័យដើមសរុបសម្រាប់រក្សាទុក ឬផ្ទេរចូលប្រព័ន្ធថ្មី'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadJson}
                disabled={downloadingJson}
                className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {downloadingJson ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Exporting...' : 'កំពុងនាំចេញ...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{language === 'en' ? 'Download JSON' : 'ទាញយក JSON'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'បិទ'}
          </button>
        </div>
      </div>
    </div>
  );
}
