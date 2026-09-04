import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Share, 
  PlusSquare, 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  CheckCircle2, 
  MoreVertical,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../contexts/LanguageContext';
import Button from './ui/Button';

interface IntroducedGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ios' | 'android';
}

export default function IntroducedGuideModal({
  isOpen,
  onClose,
  initialTab,
}: IntroducedGuideModalProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const { t } = useLanguage();
  
  // Choose initial tab based on device, or prop
  const [platformTab, setPlatformTab] = useState<'ios' | 'android'>(
    initialTab || (isIOS ? 'ios' : 'android')
  );
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAndroidInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.45, bounce: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col border border-gray-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10 font-battambang"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white leading-snug">
                  ការណែនាំដំឡើង App (Introduced)
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-slate-400">
                  ដំឡើងកម្មវិធីវត្តស្នាយដួចលើទូរស័ព្ទដៃរបស់អ្នក
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Platform Toggle Tabs */}
          <div className="px-5 pt-4 pb-2 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setPlatformTab('android')}
              className={`flex-1 py-2 px-3 text-[14px] font-medium rounded-xl border transition-all text-center flex items-center justify-center gap-2 ${
                platformTab === 'android'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>សម្រាប់ Android</span>
            </button>

            <button
              onClick={() => setPlatformTab('ios')}
              className={`flex-1 py-2 px-3 text-[14px] font-medium rounded-xl border transition-all text-center flex items-center justify-center gap-2 ${
                platformTab === 'ios'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              <Share className="w-4 h-4" />
              <span>សម្រាប់ iOS</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-5 text-left">
            {platformTab === 'android' ? (
              /* Android Tab Content */
              <div className="space-y-4">
                {/* Status or Force Action */}
                {isInstalled ? (
                  <div className="border border-emerald-500/80 rounded-xl p-3.5 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-[14px] font-semibold text-emerald-700 dark:text-emerald-400">
                        បានដំឡើងរួចរាល់
                      </h4>
                      <p className="text-[12px] text-gray-600 dark:text-slate-300 mt-0.5">
                        កម្មវិធីកំពុងដំណើរការជា App ពេញលេញនៅលើទូរស័ព្ទរបស់អ្នក។
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                        ដំឡើងកម្មវិធីនៅលើ Android
                      </h4>
                      <p className="text-[13px] text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">
                        សូមដំឡើងកម្មវិធីវត្តស្នាយដួចនៅលើទូរស័ព្ទ Android របស់អ្នក ដើម្បីទទួលបានល្បឿនលឿន ងាយស្រួលបើកប្រើ និងដំណើរការពេញលេញ។
                      </p>
                    </div>

                    {/* Direct Install Button */}
                    <Button
                      onClick={handleAndroidInstall}
                      disabled={installing}
                    >
                      <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      <span>{installing ? 'កំពុងរៀបចំ...' : 'ដំឡើងកម្មវិធី'}</span>
                    </Button>
                  </div>
                )}

                {/* Android Manual Steps */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-3">
                  <h5 className="text-[13px] font-semibold text-gray-800 dark:text-slate-200">
                    ការណែនាំដំឡើងតាម Chrome / Samsung Internet:
                  </h5>
                  
                  <ol className="space-y-3 text-[13.5px] text-gray-700 dark:text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        បើកកម្មវិធីតាម <strong>Google Chrome</strong> ឬ <strong>Samsung Internet</strong>។
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        ចុចសញ្ញាម៉ឺនុយចុចបី <MoreVertical className="w-4 h-4 inline text-orange-500 mx-0.5" /> នៅជ្រុងខាងស្តាំខាងលើនៃ Browser។
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        ជ្រើសរើសយក <strong>"ដំឡើងកម្មវិធី"</strong> ឬ <strong>"បន្ថែមទៅអេក្រង់ដើម"</strong>។
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <div>
                        ចុចពាក្យ <strong>"ដំឡើង"</strong> ជាការស្រេច។ រូបសញ្ញាកម្មវិធីនឹងបង្ហាញលើអេក្រង់ដើមទូរស័ព្ទរបស់អ្នក។
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              /* iOS Tab Content */
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-slate-800 rounded-xl p-3.5">
                  <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Share className="w-4 h-4 text-blue-500" />
                    ការបន្ថែមទៅលើអេក្រង់ដើម
                  </h4>
                  <p className="text-[13px] text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">
                    សម្រាប់ប្រព័ន្ធ iOS (iPhone / iPad) សូមប្រើប្រាស់កម្មវិធីរុករក Safari ដើម្បីដំឡើងកម្មវិធីតាមជំហានខាងក្រោម៖
                  </p>
                </div>

                {/* Steps for iOS */}
                <ol className="space-y-3.5 text-[13.5px] text-gray-700 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      បើកគេហទំព័រនេះតាមរយៈ <strong>Safari</strong> (បើកំពុងបើកក្នុង Facebook ឬ Telegram សូមចម្លងលីងទៅបើកក្នុង Safari)។
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      ចុចលើប៊ូតុង <strong>ចែករំលែក</strong> <Share className="w-4 h-4 inline text-blue-500 mx-0.5" /> នៅរបារឧបករណ៍ខាងក្រោមអេក្រង់ Safari។
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      អូសចុះក្រោមបន្តិច រួចចុចជ្រើសរើសយក <strong>"បន្ថែមទៅអេក្រង់ដើម"</strong> <PlusSquare className="w-4 h-4 inline text-blue-500 mx-0.5" />។
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      ចុចពាក្យ <strong>"បន្ថែម"</strong> នៅជ្រុងខាងស្តាំខាងលើ។ កម្មវិធីនឹងបង្ហាញរូបសញ្ញាវត្តស្នាយដួចនៅលើអេក្រង់ដើម iPhone របស់អ្នកភ្លាមៗ!
                    </div>
                  </li>
                </ol>

                {/* Copy Link for iOS */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-4 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-800 dark:text-slate-200 rounded-xl text-[13.5px] font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          បានចម្លងតំណភ្ជាប់រួចរាល់!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                        <span>ចម្លងតំណភ្ជាប់ (Copy Link ដើម្បីបើកក្នុង Safari)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-xl text-[14px] font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              បិទ (Close)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
