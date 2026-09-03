import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Share, 
  MoreVertical, 
  PlusSquare, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  Download, 
  Smartphone, 
  Sparkles 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInAppBrowser, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // If running in standalone (installed app), never show prompt
    if (isInstalled) {
      setShowPrompt(false);
      return;
    }

    if (isInAppBrowser) {
      setShowPrompt(true);
      return;
    }

    // Android: Enforce installation prompt whenever opened in browser
    if (isAndroid) {
      // For Android, prompt directly without 7-day cooldown
      setShowPrompt(true);
      return;
    }

    // iOS: Check 3-day cooldown so it doesn't overly annoy iOS users while reminding them
    if (isIOS) {
      const dismissedStr = localStorage.getItem('pwa_ios_prompt_dismissed');
      if (dismissedStr) {
        const dismissedAt = parseInt(dismissedStr, 10);
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedAt < threeDays) {
          return;
        }
      }
      setShowPrompt(true);
      return;
    }

    // Desktop/Other browsers with installability
    if (isInstallable) {
      setShowPrompt(true);
    }
  }, [isInstalled, isAndroid, isIOS, isInAppBrowser, isInstallable]);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const success = await install();
      if (success) {
        setShowPrompt(false);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    if (isIOS) {
      localStorage.setItem('pwa_ios_prompt_dismissed', Date.now().toString());
    }
    // For Android, temporary close for this session only (not 7 days), enforcing re-prompt
    sessionStorage.setItem('pwa_android_prompt_session_dismissed', 'true');
    setShowPrompt(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <AnimatePresence>
      {isInAppBrowser ? (
        /* In-App Browser Modal (Facebook, Telegram, etc.) */
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm z-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xl overflow-hidden font-battambang"
          >
            <div className="p-6 flex flex-col items-center justify-center text-center border-b border-gray-100 dark:border-slate-800">
              <button 
                onClick={handleClose}
                className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <Globe className="w-10 h-10 text-orange-500 mb-3" />
              <h3 className="text-gray-900 dark:text-white text-base font-semibold">
                សូមបើកជាមួយ Browser ក្រៅ
              </h3>
              <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">
                ដើម្បីអាចដំឡើង App មកលើអេក្រង់ដើមបាន (Safari ឬ Chrome)
              </p>
            </div>
            
            <div className="p-5 space-y-4">
              <ol className="space-y-3 text-[13.5px] text-gray-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>ចុចសញ្ញាចុចបី ឬ <strong>Share</strong> នៅជ្រុងអេក្រង់</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>ជ្រើសរើសយក <strong>Open in Safari</strong> (iOS) ឬ <strong>Open in Chrome</strong> (Android)</span>
                </li>
              </ol>

              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button 
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 dark:text-emerald-400">បានចម្លងលីងរួចរាល់</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      <span>ចម្លងលីង (Copy Link)</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 border border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors"
                >
                  បិទ (Close)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : isAndroid ? (
        /* Android Modal - Enforced / Direct Installation Prompt */
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm z-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xl overflow-hidden font-battambang"
          >
            <div className="p-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-slate-800 relative">
              <button 
                onClick={handleClose}
                className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-2xl overflow-hidden mb-3 border border-gray-200 dark:border-slate-700 shadow-sm">
                <img src="/icon.png" alt="App Icon" className="w-full h-full object-cover" />
              </div>

              <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>តម្រូវឲ្យដំឡើង App លើ Android</span>
              </div>

              <h3 className="text-gray-900 dark:text-white text-lg font-semibold leading-snug">
                ដំឡើងកម្មវិធី វត្តស្នាយដួច
              </h3>
              <p className="text-gray-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
                ដើម្បីទទួលបានបទពិសោធន៍រហ័ស ពេញលេញ និងងាយស្រួល សូមដំឡើងកម្មវិធីនេះនៅលើទូរស័ព្ទ Android របស់អ្នក។
              </p>
            </div>

            <div className="p-5 space-y-3.5">
              {/* Force Install Primary Button */}
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[14px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                <Download className="w-5 h-5" />
                <span>{isInstalling ? 'កំពុងដំណើរការ...' : 'ដំឡើងកម្មវិធីឥឡូវនេះ (Install App)'}</span>
              </button>

              {/* Instructions if already prompted or Chrome 3-dot */}
              <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-3 text-left">
                <p className="text-[11.5px] text-gray-500 dark:text-slate-400 mb-1.5 font-medium">
                  វិធីដំឡើងដោយផ្ទាល់ (Google Chrome / Samsung):
                </p>
                <ol className="space-y-1 text-[12px] text-gray-600 dark:text-slate-300">
                  <li className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-600 text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span>ចុចសញ្ញាចុចបី <MoreVertical className="w-3.5 h-3.5 inline text-orange-500" /> នៅជ្រុងខាងស្តាំលើ</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-600 text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span>ជ្រើសរើស <strong>"ដំឡើងកម្មវិធី"</strong> ឬ <strong>"Install app"</strong></span>
                  </li>
                </ol>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl text-xs transition-colors"
              >
                បន្តប្រើប្រាស់បណ្ដោះអាសន្ន
              </button>
            </div>
          </motion.div>
        </div>
      ) : isIOS ? (
        /* iOS Modal View - Add to Home Screen Instructions */
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm z-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xl overflow-hidden font-battambang"
          >
            <div className="p-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-slate-800 relative">
              <button 
                onClick={handleClose}
                className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-2xl overflow-hidden mb-3 border border-gray-200 dark:border-slate-700 shadow-sm">
                <img src="/icon.png" alt="App Icon" className="w-full h-full object-cover" />
              </div>

              <h3 className="text-gray-900 dark:text-white text-base font-semibold leading-snug">
                បន្ថែមទៅអេក្រង់ដើម (iOS)
              </h3>
              <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">
                សម្រាប់ iPhone / iPad សូមធ្វើតាមជំហានងាយៗខាងក្រោម៖
              </p>
            </div>
            
            <div className="p-5 space-y-4">
              <ol className="space-y-3 text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>បើកកម្មវិធីក្នុង <strong>Safari</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>ចុចលើប៊ូតុង <strong>ចែករំលែក (Share)</strong> <Share className="w-4 h-4 inline text-blue-500 mx-0.5" /> នៅខាងក្រោមអេក្រង់ Safari</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>អូសចុះក្រោម រួចជ្រើសរើស <strong>"Add to Home Screen"</strong> <PlusSquare className="w-4 h-4 inline text-blue-500 mx-0.5" /></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <span>ចុច <strong>"Add"</strong> នៅជ្រុងខាងស្តាំខាងលើ ជាការស្រេច</span>
                </li>
              </ol>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                <button 
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 dark:text-emerald-400">បានចម្លងលីងរួចរាល់</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      <span>ចម្លងលីង (Copy Link)</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  យល់ព្រម (Got it)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* Desktop or generic web banner */
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xl overflow-hidden font-battambang max-w-lg mx-auto"
        >
          <div className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shrink-0">
              <img src="/icon.png" alt="App Icon" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <h4 className="text-gray-900 dark:text-white text-sm font-semibold mb-0.5">
                {t('install_title') || 'ដំឡើងកម្មវិធីវត្តស្នាយដួច'}
              </h4>
              <p className="text-[12px] text-gray-500 dark:text-slate-400 leading-normal">
                {t('install_desc') || 'ទាញយកកម្មវិធីនេះដាក់លើអេក្រង់ទូរស័ព្ទរបស់អ្នក ដើម្បីងាយស្រួលប្រើប្រាស់។'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>ដំឡើង</span>
              </button>
              
              <button 
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
