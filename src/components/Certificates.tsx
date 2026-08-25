import { useState, useEffect } from 'react';
import { Download, Trash2, Loader2, Image as ImageIcon, Search, X } from 'lucide-react';
import { getCertificates, deleteCertificate, SavedCertificate, shareOrDownloadCertificate } from '../lib/certificateUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface CertificatesProps {
  onBack?: () => void;
}

export default function Certificates({ onBack }: CertificatesProps) {
  const { t } = useLanguage();
  const [certificates, setCertificates] = useState<SavedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [certToDelete, setCertToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4 sm:px-6 shadow-md z-10 sticky top-0 flex flex-col items-center rounded-b-3xl relative">
        <div className="w-full relative flex items-center justify-center">
          {onBack && (
            <button 
              onClick={onBack}
              className="absolute left-0 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <h1 className="text-xl font-bold font-battambang py-1">លិខិតថ្លែងអំណរគុណ</h1>
        </div>
        
        {/* Search Bar */}
        <div className="w-full max-w-md mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះ..."
            className="w-full bg-white/10 text-white placeholder-blue-200 border border-white/20 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/50 font-battambang"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        {filteredCertificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-slate-500">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-zinc-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium">{searchQuery ? 'រកមិនឃើញលិខិតដែលស្វែងរកទេ' : 'មិនទាន់មានលិខិតថ្លែងអំណរគុណទេ'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <>
              {filteredCertificates.map((cert) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col gap-3"
                >
                  {/* Image Preview */}
                  {cert.blob && (
                    <div className="w-full aspect-[1.414] bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 relative">
                      <img 
                        src={URL.createObjectURL(cert.blob)} 
                        alt={cert.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 gap-2">
                    <div className="flex flex-col flex-1 min-w-0 w-full">
                      <h3 className="font-bold text-[15px] text-gray-900 dark:text-white truncate font-battambang" title={cert.title}>
                        {cert.title}
                      </h3>
                      <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5">
                        {formatDate(cert.date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDownload(cert)}
                        className="p-2 sm:p-2.5 text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 rounded-xl transition-colors"
                        title="ទាញយក"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCertToDelete(cert.id)}
                        className="p-2 sm:p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-colors"
                        title="លុប"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <>
        {certToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-battambang">លុបលិខិតថ្លែងអំណរគុណ?</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-battambang">
                  តើអ្នកពិតជាចង់លុបលិខិតនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
                </p>
              </div>
              <div className="flex border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => setCertToDelete(null)}
                  className="flex-1 px-4 py-3.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-battambang"
                >
                  បោះបង់
                </button>
                <div className="w-[1px] bg-gray-100 dark:bg-slate-800" />
                <button
                  onClick={() => handleDelete(certToDelete)}
                  className="flex-1 px-4 py-3.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-battambang"
                >
                  លុប
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </>
    </div>
  );
}
