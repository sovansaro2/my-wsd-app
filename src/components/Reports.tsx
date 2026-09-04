import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, FileImage, FileSpreadsheet, File as FileIcon, AlertTriangle, X } from 'lucide-react';
import { getReports, deleteReport, SavedReport, shareOrDownloadFile } from '../lib/reportUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Reports({ userRole }: { userRole: 'admin' | 'user' | null }) {
  const { t } = useLanguage();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Image preview state
  const [previewReport, setPreviewReport] = useState<SavedReport | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const loadReports = async () => {
    try {
      const saved = await getReports();
      setReports(saved);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (report: SavedReport) => {
    if (!report.blob) return;
    const ext = report.type === 'application/pdf' ? 'pdf' : 
                report.type === 'image/png' ? 'png' : 
                report.type === 'image/jpeg' ? 'jpg' : 'xlsx';
    await shareOrDownloadFile(report.blob, `${report.title}.${ext}`);
  };

  const handlePreviewReport = (report: SavedReport) => {
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
    }

    if (report.blob) {
      const url = URL.createObjectURL(report.blob);
      setPreviewImageUrl(url);
      setPreviewReport(report);
    } else if (report.dataUrl) {
      setPreviewImageUrl(report.dataUrl);
      setPreviewReport(report);
    } else {
      setPreviewImageUrl(null);
      setPreviewReport(report);
    }
  };

  const closePreview = () => {
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl(null);
    setPreviewReport(null);
  };

  const confirmDelete = async () => {
    if (reportToDelete) {
      if (previewReport && previewReport.id === reportToDelete) {
        closePreview();
      }
      await deleteReport(reportToDelete);
      setReportToDelete(null);
      loadReports();
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('spreadsheet')) return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    return <FileIcon className="w-8 h-8 text-gray-500" />;
  };

  const formatReportDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB') + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-battambang">{t('common_loading')}</div>;

  return (
    <div className="max-w-6xl mx-auto w-full p-2 sm:p-4 space-y-4">
      <h2 className="text-xl text-gray-900 dark:text-white font-title">{t('reports_saved_title')}</h2>
      
      <div className="relative">
        {userRole !== 'admin' && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer" 
            onClick={() => setShowAccessDenied(true)}
          />
        )}
        
        <div className={userRole !== 'admin' ? 'opacity-50 pointer-events-none select-none filter grayscale-[30%]' : ''}>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 font-battambang">
              {t('reports_empty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {reports.map(report => (
                <div 
                  key={report.id}
                  onClick={() => handlePreviewReport(report)}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                    <div className="shrink-0">{getIcon(report.type)}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-normal text-[15px] text-gray-900 dark:text-white font-battambang truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={report.title}>
                        {report.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-rajdhani tracking-wide">
                        {formatReportDate(report.date)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons: No background container colors, clean & direct */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleDownload(report)} 
                      className="p-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors bg-transparent" 
                      title={t('reports_download')}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setReportToDelete(report.id)} 
                      className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors bg-transparent" 
                      title={t('reports_delete')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal (Lightbox) */}
      <AnimatePresence>
        {previewReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePreview}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="shrink-0">{getIcon(previewReport.type)}</div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-base sm:text-lg text-gray-900 dark:text-white font-battambang truncate">
                      {previewReport.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-rajdhani">
                      {formatReportDate(previewReport.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(previewReport)}
                    className="p-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors bg-transparent"
                    title={t('reports_download')}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closePreview}
                    className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-transparent"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image Preview Body */}
              <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center bg-gray-50/50 dark:bg-slate-950/50 min-h-[250px]">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt={previewReport.title}
                    className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl select-none"
                  />
                ) : (
                  <div className="text-center py-12 px-4">
                    <FileText className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-battambang mb-4">
                      {t('reports_empty')}
                    </p>
                    <button
                      onClick={() => handleDownload(previewReport)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-600/40 dark:border-emerald-500/40 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors font-battambang"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('reports_download')}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Access Denied Modal */}
      <AnimatePresence>
        {showAccessDenied && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccessDenied(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm z-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="w-10 h-10 text-orange-500 mb-3" />
                <h3 className="text-lg text-gray-900 dark:text-white mb-2 font-battambang">មិនមានសិទ្ធិអនុញ្ញាត</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-battambang leading-relaxed">
                  ទំព័រនេះសម្រាប់តែអ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ។
                </p>
                <button
                  onClick={() => setShowAccessDenied(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-white bg-orange-600 hover:bg-orange-700 transition-colors font-battambang"
                >
                  យល់ព្រម
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {reportToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportToDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm z-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                <h3 className="text-lg text-gray-900 dark:text-white mb-2 font-battambang">
                  {t('reports_delete_confirm_title')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-battambang">
                  {t('reports_delete_confirm_msg')}
                </p>
                <div className="flex w-full space-x-3">
                  <button
                    onClick={() => setReportToDelete(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-battambang"
                  >
                    {t('reports_cancel')}
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 px-4 rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors font-battambang"
                  >
                    {t('reports_delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

