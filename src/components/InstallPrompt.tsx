import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden"
        >
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm mb-0.5">
                {t('install_title') || 'ទាញយកកម្មវិធី'}
              </h4>
              <p className="text-[12px] text-gray-500 leading-tight">
                {t('install_desc') || 'ទាញយកកម្មវិធីនេះដាក់លើអេក្រង់ទូរស័ព្ទរបស់អ្នក ដើម្បីងាយស្រួលប្រើប្រាស់។'}
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 text-white text-[13px] font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
              >
                {t('install_btn') || 'ទាញយក'}
              </button>
            </div>
            
            <button 
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
