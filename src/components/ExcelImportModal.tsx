import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  FolderOpen,
  X,
  Check,
  AlertTriangle,
  Loader2,
  SlidersHorizontal,
  RefreshCw,
  FolderPlus,
  PlusCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
} from 'lucide-react';
import { api, API_BASE_URL } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import { playSuccessSound, playFailSound } from '../lib/sound';
import {
  parseExcelFilesToDrafts,
  extractRowsFromSheet,
  detectColumnMapping,
  columnIndexToLetter,
  type ParsedSheetDraft,
  type ImportTargetType,
  type ImportMode,
  type ExistingFolderRef,
  type ColumnMapping,
} from '../lib/excelImportParser';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: ImportTargetType;
  initialShowReset?: boolean;
  onImportSuccess?: () => void;
}

interface ExistingStats {
  loading: boolean;
  count: number;
  totalAmount: number;
}

interface SheetImportResult {
  sheetTitle: string;
  targetType: 'category' | 'seil';
  mode: ImportMode;
  folderId: string;
  folderName: string;
  insertedCount: number;
  skippedDuplicates: number;
  replacedOldCount: number;
  totalAmount: number;
  status: 'success' | 'error';
  error?: string;
}

interface BatchImportResponse {
  success?: boolean;
  detail?: string;
  summary?: {
    totalSheets: number;
    succeededSheets: number;
    failedSheets: number;
    totalInserted: number;
    totalSkippedDuplicates: number;
    totalReplacedOld: number;
  };
  results?: SheetImportResult[];
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  defaultTarget = 'category',
  initialShowReset = false,
  onImportSuccess,
}: ExcelImportModalProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'configure' | 'result'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState('');

  // Existing folders from DB
  const [existingCategories, setExistingCategories] = useState<ExistingFolderRef[]>([]);
  const [existingSeils, setExistingSeils] = useState<ExistingFolderRef[]>([]);
  const [existingStatsCache, setExistingStatsCache] = useState<Record<string, ExistingStats>>({});

  // Parsed sheets state
  const [drafts, setDrafts] = useState<ParsedSheetDraft[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string>('');
  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [showAllPreviewRows, setShowAllPreviewRows] = useState(false);

  // Safety confirmation & execution
  const [confirmReplaceChecked, setConfirmReplaceChecked] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResponse, setImportResponse] = useState<BatchImportResponse | null>(null);

  // Clean Slate Reset (Wipe old folders & records before fresh import)
  const [showResetPanel, setShowResetPanel] = useState(initialShowReset);
  const [resetScope, setResetScope] = useState<'all' | 'name_lists' | 'financial_records'>('all');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetUnderstoodChecked, setResetUnderstoodChecked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [resetSuccessInfo, setResetSuccessInfo] = useState<{
    name_list_records: number;
    name_list_categories: number;
    financial_records: number;
    seil_periods: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShowResetPanel(initialShowReset);
    }
  }, [isOpen, initialShowReset]);

  // Fetch existing folders when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const [cats, seils] = await Promise.all([
          api.getNameListCategories().catch(() => []),
          api.getSeilPeriods().catch(() => []),
        ]);
        if (cancelled) return;
        setExistingCategories(Array.isArray(cats) ? cats : []);
        setExistingSeils(Array.isArray(seils) ? seils : []);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Escape key & scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isImporting && !isParsing) {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, isImporting, isParsing]);

  const activeDraft = useMemo(
    () => drafts.find((d) => d.id === activeSheetId) || drafts[0] || null,
    [drafts, activeSheetId]
  );

  // Fetch existing folder stats whenever an existing targetId is selected
  useEffect(() => {
    if (!activeDraft || activeDraft.mode === 'create_new' || !activeDraft.targetId) return;
    const cacheKey = `${activeDraft.targetType}:${activeDraft.targetId}`;
    if (existingStatsCache[cacheKey]) return;

    setExistingStatsCache((prev) => ({
      ...prev,
      [cacheKey]: { loading: true, count: 0, totalAmount: 0 },
    }));

    const loadStats = async () => {
      try {
        const rows =
          activeDraft.targetType === 'category'
            ? await api.getNameListRecords(activeDraft.targetId)
            : await api.getFinancialRecords(activeDraft.targetId);
        const list = Array.isArray(rows) ? rows : [];
        const totalAmount = list.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        setExistingStatsCache((prev) => ({
          ...prev,
          [cacheKey]: { loading: false, count: list.length, totalAmount },
        }));
      } catch {
        setExistingStatsCache((prev) => ({
          ...prev,
          [cacheKey]: { loading: false, count: 0, totalAmount: 0 },
        }));
      }
    };

    loadStats();
  }, [activeDraft?.targetType, activeDraft?.targetId, activeDraft?.mode]);

  // Memoize extracted data for all drafts
  const extractedById = useMemo(() => {
    const map: Record<string, ReturnType<typeof extractRowsFromSheet>> = {};
    for (const d of drafts) {
      map[d.id] = extractRowsFromSheet(d);
    }
    return map;
  }, [drafts]);

  const selectedDrafts = useMemo(() => drafts.filter((d) => d.selected), [drafts]);

  const replaceSheets = useMemo(
    () => selectedDrafts.filter((d) => d.mode === 'replace_existing'),
    [selectedDrafts]
  );

  const totalSelectedRows = useMemo(
    () => selectedDrafts.reduce((sum, d) => sum + (extractedById[d.id]?.rows.length || 0), 0),
    [selectedDrafts, extractedById]
  );

  const totalSelectedAmount = useMemo(
    () => selectedDrafts.reduce((sum, d) => sum + (extractedById[d.id]?.totalAmount || 0), 0),
    [selectedDrafts, extractedById]
  );

  const handleResetAndClose = () => {
    setStep('upload');
    setDrafts([]);
    setActiveSheetId('');
    setParseWarnings([]);
    setGlobalError('');
    setConfirmReplaceChecked(false);
    setImportResponse(null);
    setShowMappingEditor(false);
    setShowAllPreviewRows(false);
    setShowResetPanel(false);
    setResetConfirmText('');
    setResetUnderstoodChecked(false);
    setResetSuccessInfo(null);
    onClose();
  };

  const handleDownloadQuickBackup = async () => {
    try {
      setIsDownloadingBackup(true);
      setGlobalError('');
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/backup/excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(isEn ? 'Failed to download backup' : 'មិនអាចទាញយកឯកសារ Backup បានទេ');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `WSD_PreReset_Backup_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setGlobalError(err?.message || 'Backup error');
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const isResetConfirmValid =
    resetUnderstoodChecked &&
    ['delete all', 'លុបទាំងអស់'].includes(resetConfirmText.trim().toLowerCase());

  const handleExecuteResetAll = async () => {
    if (!isResetConfirmValid) return;
    setIsResetting(true);
    setGlobalError('');
    try {
      const res = await api.resetFinancialData({
        scope: resetScope,
        confirmText: resetConfirmText.trim(),
        confirmUnderstood: true,
      });
      setResetSuccessInfo(res.deleted);
      setShowResetPanel(false);
      setResetConfirmText('');
      setResetUnderstoodChecked(false);
      setExistingStatsCache({});

      if (resetScope === 'all' || resetScope === 'name_lists') {
        setExistingCategories([]);
      }
      if (resetScope === 'all' || resetScope === 'financial_records') {
        setExistingSeils([]);
      }

      playSuccessSound();
      window.dispatchEvent(new CustomEvent('wsd-data-refreshed'));
      onImportSuccess?.();
    } catch (err: any) {
      setGlobalError(
        err?.message ||
          (isEn ? 'Failed to delete existing data.' : 'បរាជ័យក្នុងការលុបទិន្នន័យចាស់ — សូមពិនិត្យសិទ្ធិ Admin ។')
      );
      playFailSound();
    } finally {
      setIsResetting(false);
    }
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsParsing(true);
    setGlobalError('');
    setParseWarnings([]);
    setConfirmReplaceChecked(false);

    try {
      const { drafts: parsedDrafts, warnings } = await parseExcelFilesToDrafts(
        files,
        defaultTarget,
        existingCategories,
        existingSeils
      );

      setParseWarnings(warnings);

      if (parsedDrafts.length === 0) {
        setGlobalError(
          isEn
            ? 'No readable Excel (.xlsb, .xlsx, .xls) or CSV sheets were found in the selected files.'
            : 'រកមិនឃើញ Sheet ទិន្នន័យដែលអាចអានបានទេ (គាំទ្រ .xlsb, .xlsx, .xlsm, .xls, .ods និង .csv)'
        );
        playFailSound();
        return;
      }

      setDrafts(parsedDrafts);
      const firstSelected = parsedDrafts.find((d) => d.selected) || parsedDrafts[0];
      setActiveSheetId(firstSelected.id);
      setStep('configure');
    } catch (err: any) {
      setGlobalError(err?.message || (isEn ? 'Failed to read files' : 'មិនអាចអានឯកសារ Excel បានទេ'));
      playFailSound();
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const updateDraft = (id: string, patch: Partial<ParsedSheetDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
    setConfirmReplaceChecked(false);
  };

  const updateActiveMapping = (patch: Partial<ColumnMapping>) => {
    if (!activeDraft) return;
    updateDraft(activeDraft.id, {
      mapping: { ...activeDraft.mapping, ...patch },
    });
  };

  const handleHeaderRowChange = (newHeaderIdx: number) => {
    if (!activeDraft) return;
    const newMapping = detectColumnMapping(activeDraft.rawRows, newHeaderIdx, activeDraft.maxCols);
    updateDraft(activeDraft.id, {
      headerRowIndex: newHeaderIdx,
      mapping: newMapping,
    });
  };

  const handleTargetTypeChange = (newType: ImportTargetType) => {
    if (!activeDraft) return;
    const list = newType === 'category' ? existingCategories : existingSeils;
    const norm = activeDraft.newFolderName.trim().toLowerCase().replace(/\s+/g, ' ');
    const matched = list.find((item) => item.name.trim().toLowerCase().replace(/\s+/g, ' ') === norm);
    updateDraft(activeDraft.id, {
      targetType: newType,
      targetId: matched ? matched.id : '',
      mode: matched ? 'append_new' : 'create_new',
    });
  };

  const validateBeforeImport = (): string | null => {
    if (!navigator.onLine) {
      return isEn
        ? 'You are currently offline. Excel batch import requires an active internet connection.'
        : 'សូមភ្ជាប់អ៊ីនធឺណិតជាមុនសិន ដើម្បីនាំចូលទិន្នន័យ Excel ដោយសុវត្ថិភាព។';
    }
    if (selectedDrafts.length === 0) {
      return isEn ? 'Please select at least one sheet to import.' : 'សូមធីកជ្រើសរើសយ៉ាងតិច ១ Sheet ដើម្បីនាំចូល។';
    }
    if (selectedDrafts.length > 25) {
      return isEn
        ? 'Maximum 25 sheets can be imported at once.'
        : 'អាចនាំចូលច្រើនបំផុត 25 Sheet ក្នុងមួយដង។ សូមបំបែកនាំចូលជាដំណាក់កាល។';
    }

    for (const d of selectedDrafts) {
      const ext = extractedById[d.id];
      if (!ext || ext.rows.length === 0) {
        return isEn
          ? `Sheet "${d.sheetName}" has 0 valid rows. Please check its column mapping or uncheck it.`
          : `Sheet «${d.sheetName}» មិនមានជួរទិន្នន័យត្រឹមត្រូវទេ — សូមពិនិត្យការផ្គូផ្គងជួរឈរ ឬដកធីកចេញ។`;
      }
      if (d.mode === 'create_new' && !d.newFolderName.trim()) {
        return isEn
          ? `Please enter a folder name for sheet "${d.sheetName}".`
          : `សូមបញ្ចូលឈ្មោះ Folder ថ្មីសម្រាប់ Sheet «${d.sheetName}»។`;
      }
      if ((d.mode === 'append_new' || d.mode === 'replace_existing') && !d.targetId) {
        return isEn
          ? `Please select an existing target folder for sheet "${d.sheetName}".`
          : `សូមជ្រើសរើស Folder គោលដៅដែលមានស្រាប់សម្រាប់ Sheet «${d.sheetName}»។`;
      }
    }

    if (replaceSheets.length > 0 && !confirmReplaceChecked) {
      return isEn
        ? 'Please tick the safety confirmation checkbox before replacing existing folder data.'
        : 'សូមធីកប្រអប់បញ្ជាក់សុវត្ថិភាពខាងក្រោម មុននឹងជំនួសទិន្នន័យចាស់។';
    }

    return null;
  };

  const handleExecuteImport = async () => {
    const validationErr = validateBeforeImport();
    if (validationErr) {
      setGlobalError(validationErr);
      playFailSound();
      return;
    }

    setGlobalError('');
    setIsImporting(true);

    try {
      const payload = {
        confirmReplace: replaceSheets.length > 0 ? confirmReplaceChecked : false,
        sheets: selectedDrafts.map((d) => {
          const ext = extractedById[d.id];
          return {
            sheetTitle: d.sheetName,
            sourceFileName: d.sourceFileName,
            targetType: d.targetType,
            mode: d.mode,
            targetId: d.mode === 'create_new' ? undefined : d.targetId,
            newFolderName: d.newFolderName.trim() || d.sheetName,
            dateRangeText: d.targetType === 'seil' ? d.dateRangeText.trim() : undefined,
            previousBalance: d.targetType === 'seil' ? Number(d.previousBalance) || 0 : undefined,
            rows: ext.rows.map((r) => ({
              name: r.name,
              amount: r.amount,
              note: r.note || null,
              referrer: r.referrer || null,
              type: r.type,
              record_date: r.record_date,
            })),
          };
        }),
      };

      const res: BatchImportResponse = await api.importExcelBatch(payload);
      setImportResponse(res);
      setStep('result');
      playSuccessSound();
      window.dispatchEvent(new CustomEvent('wsd-data-refreshed'));
      onImportSuccess?.();
    } catch (err: any) {
      setGlobalError(
        err?.message ||
          (isEn
            ? 'Import failed. Please check your admin permissions and try again.'
            : 'ការនាំចូលមិនជោគជ័យទេ — សូមពិនិត្យសិទ្ធិអ្នកគ្រប់គ្រង និងការតភ្ជាប់អ៊ីនធឺណិត។')
      );
      playFailSound();
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const activeExtracted = activeDraft ? extractedById[activeDraft.id] : null;
  const activeExistingList = activeDraft?.targetType === 'seil' ? existingSeils : existingCategories;
  const activeStatsKey =
    activeDraft && activeDraft.mode !== 'create_new' && activeDraft.targetId
      ? `${activeDraft.targetType}:${activeDraft.targetId}`
      : '';
  const activeStats = activeStatsKey ? existingStatsCache[activeStatsKey] : undefined;

  const columnOptions = activeDraft
    ? Array.from({ length: activeDraft.maxCols }, (_, idx) => {
        const headerVal =
          activeDraft.headerRowIndex >= 0 ? activeDraft.rawRows[activeDraft.headerRowIndex]?.[idx] : '';
        const sampleVal =
          activeDraft.rawRows[(activeDraft.headerRowIndex >= 0 ? activeDraft.headerRowIndex : -1) + 1]?.[idx] || '';
        const letter = columnIndexToLetter(idx);
        const label = headerVal
          ? `${letter} — ${headerVal}`
          : sampleVal
          ? `${letter} (${sampleVal.slice(0, 22)})`
          : `${letter}`;
        return { idx, label };
      })
    : [];

  const modalWidthClass =
    step === 'configure' ? 'max-w-6xl' : step === 'result' ? 'max-w-2xl' : 'max-w-xl';

  return (
    <div
      onClick={() => !isImporting && !isParsing && !isResetting && handleResetAndClose()}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs font-battambang"
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Excel Import' : 'នាំចូល Excel'}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${modalWidthClass} max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-[max-width] duration-200`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-[#028090] dark:text-teal-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-title text-gray-900 dark:text-white truncate">
              {isEn ? 'Import Excel' : 'នាំចូលទិន្នន័យ Excel'}
            </h2>
            <span className="hidden sm:inline text-[11px] font-rajdhani font-semibold text-gray-400 dark:text-slate-500 tracking-wide">
              .xlsb • .xlsx • .xls • .csv
            </span>
          </div>

          <button
            type="button"
            disabled={isImporting || isResetting}
            onClick={handleResetAndClose}
            aria-label={isEn ? 'Close' : 'បិទ'}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Step Bar */}
        <div className="px-5 py-2 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 text-xs shrink-0 bg-gray-50/50 dark:bg-slate-950/30">
          {[
            { id: 'upload', num: '01', labelEn: 'Upload', labelKm: 'ជ្រើសរើស' },
            { id: 'configure', num: '02', labelEn: 'Preview', labelKm: 'ពិនិត្យ' },
            { id: 'result', num: '03', labelEn: 'Done', labelKm: 'រួចរាល់' },
          ].map((item, idx) => {
            const isActive = step === item.id;
            const activeColor =
              item.id === 'result'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-[#028090] dark:text-teal-400 font-semibold';
            return (
              <React.Fragment key={item.id}>
                {idx > 0 && <span className="text-gray-300 dark:text-slate-700">/</span>}
                <span
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
                    isActive ? activeColor : 'text-gray-400 dark:text-slate-500'
                  }`}
                >
                  <span className="font-rajdhani font-bold">{item.num}</span>
                  <span>{isEn ? item.labelEn : item.labelKm}</span>
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* Alerts */}
        {(globalError || parseWarnings.length > 0) && (
          <div className="px-5 pt-3 space-y-2 shrink-0">
            {globalError && (
              <div className="px-3 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{globalError}</span>
                <button
                  type="button"
                  onClick={() => setGlobalError('')}
                  className="text-rose-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {parseWarnings.length > 0 && (
              <div className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                {parseWarnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 1: UPLOAD */}
        {/* ============================================================ */}
        {step === 'upload' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Reset Success Notice */}
            {resetSuccessInfo && (
              <div className="px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="flex-1">
                  {isEn ? (
                    <>
                      Cleaned{' '}
                      <strong className="font-rajdhani">
                        {resetSuccessInfo.name_list_categories + resetSuccessInfo.seil_periods}
                      </strong>{' '}
                      folders (
                      <strong className="font-rajdhani">
                        {resetSuccessInfo.name_list_records + resetSuccessInfo.financial_records}
                      </strong>{' '}
                      rows). Ready for fresh import.
                    </>
                  ) : (
                    <>
                      សម្អាតរួចរាល់៖{' '}
                      <strong className="font-rajdhani">
                        {resetSuccessInfo.name_list_categories + resetSuccessInfo.seil_periods}
                      </strong>{' '}
                      Folder (
                      <strong className="font-rajdhani">
                        {resetSuccessInfo.name_list_records + resetSuccessInfo.financial_records}
                      </strong>{' '}
                      ជួរ) — រួចរាល់សម្រាប់នាំចូលថ្មី។
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Main Upload Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) {
                  processFiles(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-2xl px-6 py-9 text-center transition-colors ${
                isDragging
                  ? 'border-[#028090] bg-teal-50/30 dark:bg-teal-950/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-[#028090]/70'
              }`}
            >
              {isParsing ? (
                <div className="flex flex-col items-center gap-2.5 py-4">
                  <Loader2 className="w-8 h-8 text-[#028090] dark:text-teal-400 animate-spin" />
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                    {isEn ? 'Reading Excel sheets...' : 'កំពុងអានឯកសារ Excel...'}
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-[#028090] dark:text-teal-400 mx-auto mb-3" strokeWidth={1.75} />
                  <h3 className="text-base font-title text-gray-900 dark:text-white mb-1">
                    {isEn ? 'Drop Excel files or choose below' : 'អូសទម្លាក់ ឬជ្រើសរើសឯកសារ Excel'}
                  </h3>
                  <p className="text-xs font-rajdhani text-gray-400 dark:text-slate-500 mb-5">
                    .xlsb • .xlsx • .xlsm • .xls • .ods • .csv
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#028090] hover:bg-[#005F73] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isEn ? 'Choose Files' : 'ជ្រើសរើស File'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-[#028090] text-gray-700 dark:text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-[#028090] dark:text-teal-400" />
                      <span>{isEn ? 'Choose Folder' : 'ជ្រើសរើស Folder'}</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsb,.xlsx,.xlsm,.xls,.ods,.csv"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    className="hidden"
                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                  />
                </>
              )}
            </div>

            {/* Compact Database Utility Bar (Existing Count + Backup + Clean Slate Reset) */}
            <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{isEn ? 'In Database:' : 'ក្នុងប្រព័ន្ធ៖'}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">
                    <span className="font-rajdhani">{existingCategories.length}</span>{' '}
                    {isEn ? 'Lists' : 'បញ្ជីឈ្មោះ'}
                  </span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">
                    <span className="font-rajdhani">{existingSeils.length}</span>{' '}
                    {isEn ? 'Seil' : 'ចំណូល-ចំណាយ'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isDownloadingBackup}
                    onClick={handleDownloadQuickBackup}
                    className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer disabled:opacity-50"
                  >
                    {isDownloadingBackup ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isEn ? 'Backup' : 'Backup'}</span>
                  </button>

                  <span className="text-gray-300 dark:text-slate-700">|</span>

                  <button
                    type="button"
                    onClick={() => setShowResetPanel((v) => !v)}
                    className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Clear Old Data' : 'លុបទិន្នន័យចាស់'}</span>
                    {showResetPanel ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {showResetPanel && (
                <div className="px-4 py-3.5 border-t border-rose-200/70 dark:border-rose-900/50 space-y-3">
                  {/* Scope pills */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'all' as const, labelEn: 'All Data', labelKm: 'លុបទាំងអស់' },
                      { value: 'name_lists' as const, labelEn: 'Name Lists', labelKm: 'បញ្ជីឈ្មោះ' },
                      { value: 'financial_records' as const, labelEn: 'Income/Exp', labelKm: 'ចំណូល-ចំណាយ' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setResetScope(opt.value)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-center transition-colors cursor-pointer ${
                          resetScope === opt.value
                            ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-semibold'
                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                        }`}
                      >
                        {isEn ? opt.labelEn : opt.labelKm}
                      </button>
                    ))}
                  </div>

                  {/* Confirm input + button */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                      placeholder={isEn ? 'Type DELETE ALL' : 'វាយពាក្យ "លុបទាំងអស់" ឬ DELETE ALL'}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      disabled={!isResetConfirmValid || isResetting}
                      onClick={handleExecuteResetAll}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      {isResetting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isEn ? 'Delete Now' : 'លុបឥឡូវនេះ'}</span>
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={resetUnderstoodChecked}
                      onChange={(e) => setResetUnderstoodChecked(e.target.checked)}
                      className="accent-rose-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>
                      {isEn
                        ? 'Confirm permanent delete (User accounts are kept safe)'
                        : 'យល់ព្រមលុប Folder ចាស់ទាំងអស់ (គណនីអ្នកប្រើប្រាស់ត្រូវរក្សាទុកដដែល)'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: CONFIGURE & PREVIEW */}
        {/* ============================================================ */}
        {step === 'configure' && activeDraft && activeExtracted && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left Sidebar: Sheet List */}
            <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-slate-800 flex flex-col max-h-44 lg:max-h-none shrink-0 bg-gray-50/40 dark:bg-slate-950/30">
              <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 dark:text-slate-300">
                  Sheet (<span className="font-rajdhani font-bold">{selectedDrafts.length}/{drafts.length}</span>)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = selectedDrafts.length === drafts.length;
                    setDrafts((prev) => prev.map((d) => ({ ...d, selected: !allSelected })));
                    setConfirmReplaceChecked(false);
                  }}
                  className="text-[#028090] dark:text-teal-400 hover:underline cursor-pointer"
                >
                  {selectedDrafts.length === drafts.length
                    ? isEn
                      ? 'Clear'
                      : 'ដកទាំងអស់'
                    : isEn
                    ? 'All'
                    : 'រើសទាំងអស់'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                {drafts.map((d) => {
                  const ext = extractedById[d.id];
                  const isActive = d.id === activeDraft.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setActiveSheetId(d.id);
                        setShowAllPreviewRows(false);
                      }}
                      className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-start gap-2.5 ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 border-l-3 border-[#028090]'
                          : 'hover:bg-white/70 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={d.selected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateDraft(d.id, { selected: e.target.checked })}
                        className="mt-0.5 accent-[#028090] w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {d.sheetName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">
                          <span className="font-rajdhani font-semibold tabular-nums">
                            {ext?.rows.length || 0} {isEn ? 'rows' : 'ជួរ'}
                          </span>
                          <span>•</span>
                          <span className="font-rajdhani font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {(ext?.totalAmount || 0).toLocaleString()}៛
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Sheet Settings & Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-w-0">
              {/* Sheet Header + Target & Mode Row */}
              <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 p-3.5 sm:p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <h3 className="font-title text-base text-gray-900 dark:text-white truncate">
                      {activeDraft.sheetName}
                    </h3>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 font-rajdhani truncate">
                      {activeDraft.sourceFileName}
                    </p>
                  </div>

                  {/* Target Type Segmented Toggle */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('category')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        activeDraft.targetType === 'category'
                          ? 'border-[#028090] text-[#028090] dark:text-teal-400 font-semibold'
                          : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {isEn ? 'Name List' : 'បញ្ជីឈ្មោះ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('seil')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        activeDraft.targetType === 'seil'
                          ? 'border-[#028090] text-[#028090] dark:text-teal-400 font-semibold'
                          : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {isEn ? 'Income / Expense' : 'ចំណូល-ចំណាយ'}
                    </button>
                  </div>
                </div>

                {/* Compact Mode Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateDraft(activeDraft.id, { mode: 'create_new' })}
                    className={`px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      activeDraft.mode === 'create_new'
                        ? 'border-[#028090] text-[#028090] dark:text-teal-400 font-semibold'
                        : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{isEn ? 'New Folder' : 'Folder ថ្មី'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateDraft(activeDraft.id, {
                        mode: 'append_new',
                        targetId: activeDraft.targetId || activeExistingList[0]?.id || '',
                      })
                    }
                    className={`px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      activeDraft.mode === 'append_new'
                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{isEn ? 'Append New' : 'បន្ថែមថ្មី'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateDraft(activeDraft.id, {
                        mode: 'replace_existing',
                        targetId: activeDraft.targetId || activeExistingList[0]?.id || '',
                      })
                    }
                    className={`px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      activeDraft.mode === 'replace_existing'
                        ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-semibold'
                        : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{isEn ? 'Replace (Sync)' : 'ជំនួស (Sync)'}</span>
                  </button>
                </div>

                {/* Folder Name / Existing Folder Picker */}
                {activeDraft.mode === 'create_new' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                        {isEn ? 'Folder Name *' : 'ឈ្មោះ Folder *'}
                      </label>
                      <input
                        type="text"
                        value={activeDraft.newFolderName}
                        onChange={(e) => updateDraft(activeDraft.id, { newFolderName: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                      />
                    </div>

                    {activeDraft.targetType === 'seil' && (
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                          {isEn ? 'Date Range' : 'កាលបរិច្ឆេទ'}
                        </label>
                        <input
                          type="text"
                          value={activeDraft.dateRangeText}
                          onChange={(e) => updateDraft(activeDraft.id, { dateRangeText: e.target.value })}
                          placeholder="ឧ. ១២-២០ កញ្ញា"
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={activeDraft.targetId}
                      onChange={(e) => updateDraft(activeDraft.id, { targetId: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                    >
                      <option value="">{isEn ? '-- Select folder --' : '-- ជ្រើសរើស Folder --'}</option>
                      {activeExistingList.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.date_range_text ? `${item.name} (${item.date_range_text})` : item.name}
                        </option>
                      ))}
                    </select>

                    {activeDraft.targetId && activeStats && (
                      <div
                        className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          activeDraft.mode === 'replace_existing'
                            ? 'border-amber-300 dark:border-amber-800/70 text-amber-800 dark:text-amber-300'
                            : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300'
                        }`}
                      >
                        {activeStats.loading ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{isEn ? 'Checking...' : 'កំពុងពិនិត្យ...'}</span>
                          </span>
                        ) : (
                          <>
                            <span>
                              {isEn ? 'Old:' : 'ចាស់៖'}{' '}
                              <strong className="font-rajdhani tabular-nums">
                                {activeStats.count} ({activeStats.totalAmount.toLocaleString()}៛)
                              </strong>
                            </span>
                            <span>→</span>
                            <span>
                              {isEn ? 'New:' : 'ថ្មី៖'}{' '}
                              <strong className="font-rajdhani tabular-nums text-[#028090] dark:text-teal-400">
                                {activeExtracted.rows.length} ({activeExtracted.totalAmount.toLocaleString()}៛)
                              </strong>
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Column Mapping (Collapsible) */}
              <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowMappingEditor((prev) => !prev)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-200">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#028090] dark:text-teal-400" />
                    <span>{isEn ? 'Column Mapping' : 'ផ្គូផ្គងជួរឈរ'}</span>
                  </div>
                  {showMappingEditor ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {showMappingEditor && (
                  <div className="p-3.5 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="block text-gray-500 dark:text-slate-400 mb-1">
                        {isEn ? 'Header Row' : 'ក្បាលតារាង'}
                      </label>
                      <select
                        value={activeDraft.headerRowIndex}
                        onChange={(e) => handleHeaderRowChange(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value={-1}>{isEn ? 'Row 1 (No header)' : 'គ្មាន (ជួរទី 1)'}</option>
                        {activeDraft.rawRows.slice(0, 15).map((r, idx) => (
                          <option key={idx} value={idx}>
                            Row {idx + 1}: {r.filter(Boolean).slice(0, 2).join(' | ').slice(0, 30)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-500 dark:text-slate-400 mb-1">
                        {isEn ? 'Name *' : 'ឈ្មោះ / បរិយាយ *'}
                      </label>
                      <select
                        value={activeDraft.mapping.nameCol}
                        onChange={(e) => updateActiveMapping({ nameCol: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value={-1}>-- {isEn ? 'None' : 'មិនប្រើ'} --</option>
                        {columnOptions.map((c) => (
                          <option key={c.idx} value={c.idx}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-500 dark:text-slate-400 mb-1">
                        {isEn ? 'Amount *' : 'ទឹកប្រាក់ *'}
                      </label>
                      <select
                        value={activeDraft.mapping.amountCol}
                        onChange={(e) => updateActiveMapping({ amountCol: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value={-1}>-- {isEn ? 'None' : 'មិនប្រើ'} --</option>
                        {columnOptions.map((c) => (
                          <option key={c.idx} value={c.idx}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {activeDraft.targetType === 'seil' && (
                      <>
                        <div>
                          <label className="block text-gray-500 dark:text-slate-400 mb-1">
                            {isEn ? 'Income' : 'ចំណូល'}
                          </label>
                          <select
                            value={activeDraft.mapping.incomeCol}
                            onChange={(e) => updateActiveMapping({ incomeCol: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          >
                            <option value={-1}>-- {isEn ? 'None' : 'មិនប្រើ'} --</option>
                            {columnOptions.map((c) => (
                              <option key={c.idx} value={c.idx}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-500 dark:text-slate-400 mb-1">
                            {isEn ? 'Expense' : 'ចំណាយ'}
                          </label>
                          <select
                            value={activeDraft.mapping.expenseCol}
                            onChange={(e) => updateActiveMapping({ expenseCol: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          >
                            <option value={-1}>-- {isEn ? 'None' : 'មិនប្រើ'} --</option>
                            {columnOptions.map((c) => (
                              <option key={c.idx} value={c.idx}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-500 dark:text-slate-400 mb-1">
                            {isEn ? 'Default Type' : 'ប្រភេទ'}
                          </label>
                          <select
                            value={activeDraft.defaultRecordType}
                            onChange={(e) =>
                              updateDraft(activeDraft.id, {
                                defaultRecordType: e.target.value as 'income' | 'expense',
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          >
                            <option value="income">{isEn ? 'Income' : 'ចំណូល'}</option>
                            <option value="expense">{isEn ? 'Expense' : 'ចំណាយ'}</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-gray-500 dark:text-slate-400 mb-1">
                        {isEn ? 'Note' : 'កំណត់ចំណាំ'}
                      </label>
                      <select
                        value={activeDraft.mapping.noteCol}
                        onChange={(e) => updateActiveMapping({ noteCol: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value={-1}>-- {isEn ? 'None' : 'មិនប្រើ'} --</option>
                        {columnOptions.map((c) => (
                          <option key={c.idx} value={c.idx}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-500 dark:text-slate-400 mb-1">
                        {isEn ? 'Date' : 'កាលបរិច្ឆេទ'}
                      </label>
                      <select
                        value={activeDraft.mapping.dateCol}
                        onChange={(e) => updateActiveMapping({ dateCol: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value={-1}>-- {isEn ? 'None' : 'មិនប្រើ'} --</option>
                        {columnOptions.map((c) => (
                          <option key={c.idx} value={c.idx}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {activeDraft.targetType === 'category' && (
                      <div>
                        <label className="block text-gray-500 dark:text-slate-400 mb-1">
                          {isEn ? 'Referrer' : 'អ្នកណែនាំ'}
                        </label>
                        <select
                          value={activeDraft.mapping.referrerCol}
                          onChange={(e) => updateActiveMapping({ referrerCol: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        >
                          <option value={-1}>-- {isEn ? 'None' : 'មិនប្រើ'} --</option>
                          {columnOptions.map((c) => (
                            <option key={c.idx} value={c.idx}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-gray-800 dark:text-white">
                      <span className="font-rajdhani text-[#028090] dark:text-teal-400 tabular-nums">
                        {activeExtracted.rows.length}
                      </span>{' '}
                      {isEn ? 'rows' : 'ជួរ'}
                    </span>
                    <span className="text-gray-300 dark:text-slate-700">•</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-rajdhani tabular-nums">
                      {activeExtracted.totalAmount.toLocaleString()} ៛
                    </span>
                    {activeExtracted.skippedSummaryRows > 0 && (
                      <>
                        <span className="text-gray-300 dark:text-slate-700">•</span>
                        <span className="text-gray-400 dark:text-slate-500">
                          {isEn ? 'Skipped:' : 'កាត់សរុប៖'}{' '}
                          <span className="font-rajdhani">{activeExtracted.skippedSummaryRows}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {activeExtracted.rows.length > 30 && (
                    <button
                      type="button"
                      onClick={() => setShowAllPreviewRows((p) => !p)}
                      className="text-[#028090] dark:text-teal-400 hover:underline cursor-pointer font-medium"
                    >
                      {showAllPreviewRows
                        ? isEn
                          ? 'Top 30'
                          : '30 ជួរដំបូង'
                        : isEn
                        ? `All (${activeExtracted.rows.length})`
                        : `ទាំងអស់ (${activeExtracted.rows.length})`}
                    </button>
                  )}
                </div>

                {activeExtracted.rows.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500 dark:text-slate-400 space-y-1.5">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                    <p>
                      {isEn
                        ? 'No rows detected — adjust Column Mapping above.'
                        : 'រកមិនឃើញទិន្នន័យ — សូមបើក «ផ្គូផ្គងជួរឈរ» ខាងលើ។'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead className="sticky top-0 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-xs">
                        <tr>
                          <th className="py-2 px-3 w-10 font-rajdhani">#</th>
                          <th className="py-2 px-3">{isEn ? 'Name' : 'ឈ្មោះ / បរិយាយ'}</th>
                          {activeDraft.targetType === 'seil' && (
                            <th className="py-2 px-3 w-20">{isEn ? 'Type' : 'ប្រភេទ'}</th>
                          )}
                          <th className="py-2 px-3 text-right">{isEn ? 'Amount' : 'ទឹកប្រាក់'}</th>
                          <th className="py-2 px-3">{isEn ? 'Note' : 'ចំណាំ'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                        {(showAllPreviewRows ? activeExtracted.rows : activeExtracted.rows.slice(0, 30)).map(
                          (row, idx) => (
                            <tr key={`${row.rowNumber}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2 px-3 font-rajdhani text-gray-400 tabular-nums">{idx + 1}</td>
                              <td className="py-2 px-3 text-gray-900 dark:text-white font-medium">{row.name}</td>
                              {activeDraft.targetType === 'seil' && (
                                <td className="py-2 px-3 text-xs font-semibold">
                                  <span
                                    className={
                                      row.type === 'expense'
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }
                                  >
                                    {row.type === 'expense'
                                      ? isEn
                                        ? 'Expense'
                                        : 'ចំណាយ'
                                      : isEn
                                      ? 'Income'
                                      : 'ចំណូល'}
                                  </span>
                                </td>
                              )}
                              <td className="py-2 px-3 text-right font-rajdhani font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                {row.amount.toLocaleString()} ៛
                              </td>
                              <td className="py-2 px-3 text-xs text-gray-500 dark:text-slate-400">
                                {[row.note, row.record_date].filter(Boolean).join(' • ') || '—'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: RESULT */}
        {/* ============================================================ */}
        {step === 'result' && importResponse && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="text-center py-2 space-y-1.5">
              {importResponse.summary && importResponse.summary.failedSheets === 0 ? (
                <CheckCircle2 className="w-11 h-11 text-emerald-500 mx-auto" />
              ) : (
                <AlertTriangle className="w-11 h-11 text-amber-500 mx-auto" />
              )}
              <h3 className="text-lg font-title text-gray-900 dark:text-white">
                {isEn ? 'Import Complete' : 'នាំចូលរួចរាល់'}
              </h3>
              {importResponse.summary && (
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                  <span>
                    {isEn ? 'Added:' : 'បញ្ចូលថ្មី៖'}{' '}
                    <strong className="font-rajdhani font-bold text-emerald-600 dark:text-emerald-400">
                      +{importResponse.summary.totalInserted}
                    </strong>
                  </span>
                  {importResponse.summary.totalSkippedDuplicates > 0 && (
                    <span>
                      {isEn ? 'Skipped:' : 'រំលងស្ទួន៖'}{' '}
                      <strong className="font-rajdhani font-bold text-[#028090] dark:text-teal-400">
                        {importResponse.summary.totalSkippedDuplicates}
                      </strong>
                    </span>
                  )}
                  {importResponse.summary.totalReplacedOld > 0 && (
                    <span>
                      {isEn ? 'Replaced:' : 'ជំនួស៖'}{' '}
                      <strong className="font-rajdhani font-bold text-amber-600 dark:text-amber-400">
                        {importResponse.summary.totalReplacedOld}
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              {(importResponse.results || []).map((r, idx) => (
                <div
                  key={`${r.sheetTitle}-${idx}`}
                  className="px-4 py-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {r.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {r.folderName}
                      </p>
                      {r.error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{r.error}</p>}
                    </div>
                  </div>

                  {r.status === 'success' && (
                    <span className="font-rajdhani text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                      +{r.insertedCount} • {r.totalAmount.toLocaleString()}៛
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2.5">
          {step === 'configure' && replaceSheets.length > 0 && (
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmReplaceChecked}
                onChange={(e) => setConfirmReplaceChecked(e.target.checked)}
                className="accent-amber-600 w-4 h-4 shrink-0 cursor-pointer"
              />
              <span>
                {isEn
                  ? `Confirm replacing ${replaceSheets.length} existing folder(s)`
                  : `យល់ព្រមជំនួសទិន្នន័យចាស់ក្នុង ${replaceSheets.length} Folder`}
              </span>
            </label>
          )}

          <div className="flex items-center justify-between gap-3">
            {step === 'configure' ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={() => {
                      setStep('upload');
                      setGlobalError('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isEn ? 'Back' : 'ត្រឡប់'}</span>
                  </button>
                  <span className="hidden sm:inline text-xs font-rajdhani font-semibold text-gray-500 dark:text-slate-400 truncate tabular-nums">
                    {selectedDrafts.length} Sheet • {totalSelectedRows} {isEn ? 'rows' : 'ជួរ'} •{' '}
                    {totalSelectedAmount.toLocaleString()}៛
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleResetAndClose}
                    className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                  >
                    {isEn ? 'Cancel' : 'បោះបង់'}
                  </button>
                  <button
                    type="button"
                    disabled={
                      isImporting ||
                      selectedDrafts.length === 0 ||
                      (replaceSheets.length > 0 && !confirmReplaceChecked)
                    }
                    onClick={handleExecuteImport}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#028090] hover:bg-[#005F73] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isEn ? 'Importing...' : 'កំពុងនាំចូល...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          {isEn ? `Import (${totalSelectedRows})` : `នាំចូល (${totalSelectedRows} ជួរ)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : step === 'result' ? (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2 rounded-xl bg-[#028090] hover:bg-[#005F73] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  {isEn ? 'Done' : 'រួចរាល់'}
                </button>
              </div>
            ) : (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                >
                  {isEn ? 'Close' : 'បិទ'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
