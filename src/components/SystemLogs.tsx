import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Search, 
  RefreshCw,
  HardDrive,
  Filter
} from 'lucide-react';
import { systemLogger, LogEntry, getDeviceSpecs, DeviceSpecs } from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';

interface SystemLogsProps {
  onBack: () => void;
}

export default function SystemLogs({ onBack }: SystemLogsProps) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO'>('ALL');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDeviceSpecs, setShowDeviceSpecs] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deviceSpecs, setDeviceSpecs] = useState<DeviceSpecs>(getDeviceSpecs());
  const [storageUsage, setStorageUsage] = useState(systemLogger.getStorageUsage());
  const [isReloading, setIsReloading] = useState(false);

  const refreshLogs = () => {
    setIsReloading(true);
    setLogs(systemLogger.getLogs());
    setDeviceSpecs(getDeviceSpecs());
    setStorageUsage(systemLogger.getStorageUsage());
    setTimeout(() => setIsReloading(false), 500);
  };

  useEffect(() => {
    refreshLogs();
    const unsubscribe = systemLogger.subscribe((updated) => {
      setLogs(updated);
      setStorageUsage(systemLogger.getStorageUsage());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleClearLogs = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
      return;
    }
    systemLogger.clearLogs();
    setLogs([]);
    setStorageUsage(systemLogger.getStorageUsage());
    setShowClearConfirm(false);
  };

  const handleCopyAll = async () => {
    try {
      const logsJson = JSON.stringify(logs, null, 2);
      await navigator.clipboard.writeText(logsJson);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleCopySingle = async (log: LogEntry) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleExportJson = () => {
    try {
      const logsJson = JSON.stringify(logs, null, 2);
      const blob = new Blob([logsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `wsd-system-logs-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-950/40 border border-red-800/60';
      case 'WARN': return 'text-yellow-400 bg-yellow-950/40 border border-yellow-800/60';
      case 'INFO': return 'text-sky-400 bg-sky-950/40 border border-sky-800/60';
      default: return 'text-gray-300 bg-gray-800/40 border border-gray-700';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesLevel;
    const matchesMsg = log.message.toLowerCase().includes(q);
    const matchesDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
    return matchesLevel && (matchesMsg || matchesDetails);
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden font-battambang -mx-3.5 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-gray-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between p-3.5 sm:p-4 border-b border-gray-200 dark:border-slate-800 shrink-0 gap-2 bg-white dark:bg-slate-900 z-10">
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={onBack}
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors focus:outline-none"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div>
            <h2 className="text-[16px] sm:text-[17px] font-semibold text-gray-900 dark:text-white leading-tight">
              {t('profile_syslog_menu')}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-rajdhani tabular-nums">
                <HardDrive className="w-3 h-3 text-[#028090] dark:text-teal-400" />
                {storageUsage.formatted} ({storageUsage.logCount})
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={refreshLogs}
            className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors text-xs cursor-pointer"
            title="Reload Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin text-[#028090] dark:text-teal-400' : ''}`} />
          </button>

          <button
            onClick={() => setShowDeviceSpecs(!showDeviceSpecs)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors font-rajdhani font-semibold border cursor-pointer ${
              showDeviceSpecs 
                ? 'border-[#028090] text-[#028090] dark:border-teal-400 dark:text-teal-400'
                : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
            title="Device Specs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Specs</span>
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg transition-colors font-rajdhani font-semibold cursor-pointer"
              title="Copy JSON"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedAll ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {logs.length > 0 && (
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors font-rajdhani font-semibold cursor-pointer"
              title="Download Logs as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors font-rajdhani font-semibold border cursor-pointer ${
                showClearConfirm 
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                  : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:border-red-500'
              }`}
              title="Clear Logs from local storage"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{showClearConfirm ? 'Confirm?' : 'Clear'}</span>
            </button>
          )}
        </div>
      </div>

      {showDeviceSpecs && (
        <div className="p-3 border-b border-gray-200 dark:border-slate-800 text-xs font-rajdhani tabular-nums text-slate-700 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-gray-400 dark:text-slate-500">Platform: </span>
            <span className="font-semibold">{deviceSpecs.platform}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-slate-500">Screen: </span>
            <span className="font-semibold">{deviceSpecs.screenWidth}x{deviceSpecs.screenHeight} px</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-slate-500">Network: </span>
            <span className={deviceSpecs.isOnline ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
              {deviceSpecs.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-slate-500">Lang / Cores: </span>
            <span className="font-semibold">{deviceSpecs.language} ({deviceSpecs.cores ?? 1} cores)</span>
          </div>
        </div>
      )}

      <div className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរក Logs..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#028090] font-battambang"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-rajdhani font-semibold">
          {(['ALL', 'ERROR', 'WARN', 'INFO'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-[#028090] text-white font-bold'
                  : 'text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-gray-300'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 bg-[#0d1117] overflow-y-auto w-full select-text">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
            <Terminal className="w-12 h-12 mb-3 opacity-30 text-gray-400" />
            <p className="font-rajdhani text-sm text-gray-400">No logs found.</p>
          </div>
        ) : (
          <div className="font-rajdhani text-[12px] sm:text-[13px] leading-relaxed space-y-2 tabular-nums">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="hover:bg-white/[0.04] p-2.5 rounded-lg border border-white/5 transition-all group relative bg-black/20"
              >
                <button
                  onClick={() => handleCopySingle(log)}
                  className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-200 bg-gray-800/80 hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Copy"
                >
                  {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <div className="flex flex-wrap items-center gap-2 pr-6">
                  <span className="text-gray-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-gray-200 break-words font-battambang text-[13px]">
                    {log.message}
                  </span>
                </div>

                {log.details && (
                  <div className="mt-1.5 pl-2 border-l border-gray-700/60 text-gray-400 text-[11.5px] overflow-x-auto whitespace-pre-wrap break-all py-1">
                    {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details.toString()}
                  </div>
                )}

                {log.device && (
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity font-rajdhani">
                    <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-gray-400" /> {log.device.platform}</span>
                    <span>• {log.device.screenWidth}x{log.device.screenHeight}</span>
                    <span>• {log.device.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
