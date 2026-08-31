import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, FileImage, FileSpreadsheet, File as FileIcon, AlertTriangle } from 'lucide-react';
import { getReports, deleteReport, SavedReport, shareOrDownloadFile } from '../lib/reportUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Reports({ userRole }: { userRole: 'admin' | 'user' | null }) {
  const { t } = useLanguage();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

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

  const confirmDelete = async () => {
    if (reportToDelete) {
      await deleteReport(reportToDelete);
      setReportToDelete(null);
      loadReports();
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('spreadsheet')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    return <FileIcon className="w-8 h-8 text-gray-500" />;
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">{t('common_loading')}</div>;

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
            <div className="text-center py-12 text-gray-500 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
              {t('reports_empty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {reports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                    <div className="shrink-0">{getIcon(report.type)}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-normal text-[15px] text-gray-900 dark:text-white font-battambang truncate">{report.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{new Date(report.date).toLocaleString('en-GB')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDownload(report)} className="p-2 text-orange-500 bg-orange-50 dark:bg-orange-950/40 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setReportToDelete(report.id)} className="p-2 text-red-500 bg-red-50 dark:bg-red-950/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Access Denied Modal */}
      <>
        {showAccessDenied && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccessDenied(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[101] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl  text-gray-900 dark:text-white mb-2 font-battambang">មិនមានសិទ្ធិអនុញ្ញាត</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 font-battambang leading-relaxed">
                  ទំព័រនេះសម្រាប់តែអ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ។
                </p>
                <button
                  onClick={() => setShowAccessDenied(false)}
                  className="w-full py-3 px-4 rounded-xl  text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 font-battambang"
                >
                  យល់ព្រម
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </>

      {/* Delete Confirmation Modal */}
      <>
        {reportToDelete && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportToDelete(null)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[101] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl  text-gray-900 dark:text-white mb-2">បញ្ជាក់ការលុប</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  តើអ្នកពិតជាចង់លុបរបាយការណ៍នេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
                </p>
                <div className="flex w-full space-x-3">
                  <button
                    onClick={() => setReportToDelete(null)}
                    className="flex-1 py-3 px-4 rounded-xl  text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    បោះបង់
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-4 rounded-xl  text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                  >
                    លុប
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </>
    </div>
  );
}
