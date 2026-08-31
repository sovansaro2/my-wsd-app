import { useState, useEffect } from 'react';
import { Download, Trash2, Loader2, Search, X, ArrowLeft, FileText, Eye } from 'lucide-react';
import { getCertificates, deleteCertificate, SavedCertificate, shareOrDownloadCertificate } from '../lib/certificateUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface CertificatesProps {
  onBack?: () => void;
  userRole?: string;
}

export default function Certificates({ onBack, userRole = 'user' }: CertificatesProps) {
  const { t } = useLanguage();
  const [certificates, setCertificates] = useState<SavedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [certToDelete, setCertToDelete] = useState<string | null>(null);
  const [previewCert, setPreviewCert] = useState<SavedCertificate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const saved = await getCertificates();
      setCertificates(saved);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (cert: SavedCertificate) => {
    if (!cert.blob) return;
    try {
      await shareOrDownloadCertificate(cert.blob, `${cert.title}.png`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCertificate(id);
      await loadCertificates();
      setCertToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 pb-20 font-battambang">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 sm:px-6 sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-700 dark:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl  text-gray-900 dark:text-white font-title">{t('cert_title')}</h1>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
            {t('cert_total', { count: certificates.length })}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('cert_search_ph')}
            className="w-full bg-gray-100/80 dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 rounded-xl pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-battambang transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full">
        {filteredCertificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-slate-500">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-zinc-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium">{searchQuery ? t('cert_not_found') : t('cert_empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredCertificates.map((cert) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2.5 hover:border-blue-200 dark:hover:border-slate-700 transition-colors"
              >
                {/* Image Preview / Click to view */}
                {cert.blob && (
                  <div 
                    onClick={() => setPreviewCert(cert)}
                    className="w-full aspect-[1.414] bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700/80 relative cursor-pointer group"
                    title={t('cert_btn_view')}
                  >
                    <img 
                      src={URL.createObjectURL(cert.blob)} 
                      alt={cert.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded-full p-2 backdrop-blur-sm shadow-md">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col flex-1 min-w-0 w-full">
                  <h3 className="font-medium text-sm sm:text-[15px] text-gray-900 dark:text-white font-battambang line-clamp-2" title={cert.title}>
                    {cert.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                    {formatDate(cert.date)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-gray-100 dark:border-slate-800/80">
                  {/* View Button */}
                  <button
                    onClick={() => setPreviewCert(cert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-xl transition-colors font-battambang active:scale-95"
                    title={t('cert_btn_view')}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('cert_btn_view')}</span>
                  </button>

                  {/* Admin Only Actions (Download & Delete) */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(cert)}
                        className="p-1.5 sm:p-2 text-gray-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95"
                        title={t('cert_btn_download')}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCertToDelete(cert.id)}
                        className="p-1.5 sm:p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-colors active:scale-95"
                        title={t('cert_btn_delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewCert && previewCert.blob && (
          <div 
            onClick={() => setPreviewCert(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm flex-shrink-0">
                <div className="min-w-0 flex-1 pr-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white font-battambang truncate" title={previewCert.title}>
                    {previewCert.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {formatDate(previewCert.date)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() => handleDownload(previewCert)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm font-battambang active:scale-95"
                      title={t('cert_btn_download')}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('cert_btn_download')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewCert(null)}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Image Body */}
              <div className="p-3 sm:p-6 overflow-auto flex items-center justify-center bg-gray-50/70 dark:bg-slate-950/60 min-h-[250px] max-h-[calc(90vh-70px)]">
                <img
                  src={URL.createObjectURL(previewCert.blob)}
                  alt={previewCert.title}
                  className="w-auto h-auto max-h-[72vh] max-w-full object-contain rounded-xl shadow-lg border border-gray-200/80 dark:border-slate-800"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {certToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-gray-100 dark:border-slate-800"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg text-gray-900 dark:text-white mb-2 font-battambang">
                  {t('cert_delete_confirm_title')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-battambang">
                  {t('cert_delete_confirm_desc')}
                </p>
              </div>
              <div className="flex border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => setCertToDelete(null)}
                  className="flex-1 px-4 py-3.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-battambang"
                >
                  {t('list_cancel')}
                </button>
                <div className="w-[1px] bg-gray-100 dark:border-slate-800" />
                <button
                  onClick={() => handleDelete(certToDelete)}
                  className="flex-1 px-4 py-3.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-battambang"
                >
                  {t('cert_btn_delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

