import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, MoreHorizontal, PlusSquare, ChevronDown, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
    
    // Detect In-App Browser (Facebook, Messenger, Telegram, Line, etc.)
    const inAppRegex = /FBAN|FBAV|Instagram|LinkedInApp|Snapchat|Viber|Line|MicroMessenger|Telegram|Twitter|Threads/i;
    if (inAppRegex.test(userAgent)) {
      setIsInAppBrowser(true);
      setShowPrompt(true);
      return; // Stop here for in-app browsers
    }

    // Check if it's already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://');
    
    if (isStandalone) {
      return; // Do not show if already installed
    }

    // Check localStorage for 7-day cooldown
    const dismissedStr = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedStr) {
      const dismissedAt = parseInt(dismissedStr, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < sevenDays) {
        return; // Still in cooldown period
      }
    }

    // Detect iOS
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent.toLowerCase());
    
    if (isIosDevice) {
      setIsIOS(true);
      setShowPrompt(true);
    } else {
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
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      handleClose();
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    // Set dismissal time in localStorage
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {showPrompt && (
        isInAppBrowser ? (
          // In-App Browser Modal (Facebook, Telegram, etc.)
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[101] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-indigo-600 p-6 flex flex-col items-center justify-center relative">
                <button 
                  onClick={handleClose}
                  className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3 overflow-hidden text-indigo-600">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-white font-bold text-lg text-center font-battambang leading-tight">
                  សូមបើកជាមួយ Browser ក្រៅ
                </h3>
                <p className="text-indigo-100 text-[13px] text-center mt-2 font-battambang">
                  ដើម្បីអាចដំឡើង App មកលើអេក្រង់ដើមបាន (Safari ឬ Chrome)
                </p>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4 font-battambang">
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">1</div>
                    <p>ចុចសញ្ញាចុចបី <MoreHorizontal className="w-4 h-4 inline-block mx-0.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded" /> ឬ <strong>Share</strong> <Share className="w-4 h-4 inline-block mx-0.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded p-0.5" /> នៅជ្រុងអេក្រង់</p>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">2</div>
                    <p>ជ្រើសរើសយក <strong>Open in Safari</strong> <ExternalLink className="w-4 h-4 inline-block mx-0.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded p-0.5" /> (iOS) ឬ <strong>Open in Chrome</strong> (Android)</p>
                  </li>
                </ul>

                <div className="mt-6 flex flex-col gap-3">
                  <button 
                    onClick={handleCopyLink}
                    className={`w-full py-3 px-4 flex items-center justify-center gap-2 font-bold rounded-xl transition-colors font-battambang ${
                      copied 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400'
                    }`}
                  >
                    {copied ? (
                      <div>
                        <Check className="w-5 h-5" /> បានចម្លងលីងរួចរាល់
                      </div>
                    ) : (
                      <div>
                        <Copy className="w-5 h-5" /> ចម្លងលីង (Copy Link)
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={handleClose}
                    className="w-full py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-bold rounded-xl transition-colors font-battambang"
                  >
                    យល់ព្រម
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : isIOS ? (
          // iOS Modal View
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[101] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-blue-600 p-6 flex flex-col items-center justify-center relative">
                <button 
                  onClick={handleClose}
                  className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3 overflow-hidden">
                  <img src="/icon.png" alt="App Icon" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-white font-bold text-lg text-center font-battambang">
                  ដំឡើងកម្មវិធី "វត្តស្នាយដួច"
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm text-center mt-1 font-battambang">
                  ដើម្បីងាយស្រួលប្រើប្រាស់ សូមដំឡើងលើទូរស័ព្ទ
                </p>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4 font-battambang">
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">1</div>
                    <p>ចុចសញ្ញាចុចបី <MoreHorizontal className="w-4 h-4 inline-block mx-0.5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded" /> នៅជ្រុងខាងស្តាំក្រោម</p>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">2</div>
                    <p>ចុចលើប៊ូតុង <strong>Share</strong> <Share className="w-4 h-4 inline-block mx-0.5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded p-0.5" /></p>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">3</div>
                    <p>អូសចុះក្រោមបន្តិច ឬចុចលើ <strong>View More</strong> <ChevronDown className="w-4 h-4 inline-block mx-0.5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded p-0.5" /></p>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">4</div>
                    <p>ជ្រើសរើស <strong>Add to Home Screen</strong> <PlusSquare className="w-4 h-4 inline-block mx-0.5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded p-0.5" /> រួចចុច <strong>Add</strong></p>
                  </li>
                </ul>

                <button 
                  onClick={handleClose}
                  className="w-full mt-6 py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-bold rounded-xl transition-colors font-battambang"
                >
                  យល់ព្រម
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          // Android / Desktop Banner View
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                <img src="/icon.png" alt="Icon" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5 font-battambang">
                  {t('install_title') || 'ដំឡើងកម្មវិធី'}
                </h4>
                <p className="text-[12px] text-gray-500 dark:text-slate-400 leading-tight font-battambang">
                  {t('install_desc') || 'ទាញយកកម្មវិធីនេះដាក់លើអេក្រង់ទូរស័ព្ទរបស់អ្នក ដើម្បីងាយស្រួលប្រើប្រាស់។'}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="bg-blue-600 text-white text-[13px] font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-battambang"
                >
                  {t('install_btn') || 'ដំឡើងឥឡូវនេះ'}
                </button>
              </div>
              
              <button 
                onClick={handleClose}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:text-slate-300 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )
      )}
    </>
  );
}
