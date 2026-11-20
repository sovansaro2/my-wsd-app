import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkPlus,
  BookmarkCheck,
  Clock,
  MapPin,
  Phone,
  Users,
  CheckCircle2,
  Search,
  Edit,
  Trash2,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Plus,
  Bell,
  BellRing,
  BellOff,
  CalendarPlus,
  Send,
} from 'lucide-react';
import { api } from '../lib/apiClient';
import { playSuccessSound, playFailSound } from '../lib/sound';
import {
  calculateKhmerLunar,
  toKhmerNumber,
  getNextSeilDate,
  KhmerLunarDate,
} from '../lib/khmerCalendar';
import {
  downloadEventICS,
  downloadLunarDayICS,
  downloadUpcomingEventsICS,
} from '../lib/icsCalendar';
import {
  getPushStatus,
  enableCalendarNotifications,
  disableCalendarNotifications,
  sendTestCalendarNotification,
  checkAndNotifyUpcomingLocally,
  type PushStatus,
} from '../lib/pushNotifications';
import { MonasteryEvent, EventType, ApproachingAlert } from '../types/calendar';

interface BuddhistCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'admin' | 'user' | null;
}

const KHMER_SOLAR_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
];

const WEEKDAYS_SHORT = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍'];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
  const parts = (dateStr || '').split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date();
}

export default function BuddhistCalendar({ isOpen, onClose, userRole }: BuddhistCalendarProps) {
  const isAdmin = userRole === 'admin';
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const todayDateStr = useMemo(() => formatDateKey(today), [today]);

  // Default to Calendar (Lunar + Solar first)
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'history'>('calendar');

  // Month navigation & selected date
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Events state
  const [events, setEvents] = useState<MonasteryEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');

  // Inline Quick Bookmark / Holiday Note state (for clicked date)
  const [quickOpen, setQuickOpen] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickType, setQuickType] = useState<EventType>('monastery');
  const [quickShowDetails, setQuickShowDetails] = useState<boolean>(false);
  const [quickTime, setQuickTime] = useState<string>('07:00');
  const [quickHost, setQuickHost] = useState<string>('');
  const [quickPhone, setQuickPhone] = useState<string>('');
  const [quickLocation, setQuickLocation] = useState<string>('');
  const [quickMonks, setQuickMonks] = useState<number>(4);
  const [quickNote, setQuickNote] = useState<string>('');
  const [quickSaving, setQuickSaving] = useState<boolean>(false);
  const [quickError, setQuickError] = useState<string>('');
  const quickInputRef = useRef<HTMLInputElement>(null);
  const quickPanelRef = useRef<HTMLDivElement>(null);

  // Edit / Full Event Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<MonasteryEvent | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<MonasteryEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Modal Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EventType>('monastery');
  const [formHostName, setFormHostName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('07:00');
  const [formMonksCount, setFormMonksCount] = useState<number>(4);
  const [formDescription, setFormDescription] = useState('');

  // Lock Screen Push & Phone Calendar Reminder state
  const [showReminderBar, setShowReminderBar] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Reset to Calendar tab and load events + push status whenever opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab('calendar');
      setPushFeedback(null);
      fetchEvents();
      getPushStatus().then(setPushStatus).catch(() => {});
    }
  }, [isOpen]);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDeleteEvent) {
          setConfirmDeleteEvent(null);
        } else if (isModalOpen) {
          setIsModalOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isModalOpen, confirmDeleteEvent, onClose]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents();
      if (Array.isArray(data)) {
        setEvents(data);
        checkAndNotifyUpcomingLocally(data);
        try {
          localStorage.setItem('cached_monastery_events', JSON.stringify(data));
        } catch {}
      }
    } catch {
      try {
        const cached = localStorage.getItem('cached_monastery_events');
        if (cached) {
          setEvents(JSON.parse(cached));
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  // Group events by YYYY-MM-DD for O(1) calendar lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, MonasteryEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.event_date);
      if (list) list.push(ev);
      else map.set(ev.event_date, [ev]);
    }
    return map;
  }, [events]);

  // Upcoming vs History & Approaching Alerts
  const { upcomingEvents, historyEvents, approachingAlerts } = useMemo(() => {
    const upcoming: MonasteryEvent[] = [];
    const history: MonasteryEvent[] = [];
    const alerts: ApproachingAlert[] = [];

    const todayStart = today.getTime();

    events.forEach((ev) => {
      const evDate = parseLocalDate(ev.event_date).getTime();
      const diffDays = Math.round((evDate - todayStart) / (1000 * 60 * 60 * 24));

      if (diffDays < 0 || ev.is_completed) {
        history.push(ev);
      } else {
        upcoming.push(ev);
        if (diffDays >= 0 && diffDays <= 3) {
          const urgency: 'today' | 'tomorrow' | 'soon' =
            diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'soon';
          alerts.push({ event: ev, daysDiff: diffDays, urgency });
        }
      }
    });

    upcoming.sort((a, b) => {
      const cmp = a.event_date.localeCompare(b.event_date);
      return cmp !== 0 ? cmp : (a.event_time || '').localeCompare(b.event_time || '');
    });

    history.sort((a, b) => {
      const cmp = b.event_date.localeCompare(a.event_date);
      return cmp !== 0 ? cmp : (b.event_time || '').localeCompare(a.event_time || '');
    });

    alerts.sort((a, b) => a.daysDiff - b.daysDiff);

    return { upcomingEvents: upcoming, historyEvents: history, approachingAlerts: alerts };
  }, [events, today]);

  const nextSeil = useMemo(() => getNextSeilDate(today), [today]);
  const selectedLunar = useMemo(() => calculateKhmerLunar(selectedDate), [selectedDate]);
  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDateKey) || [],
    [eventsByDate, selectedDateKey]
  );

  // Calendar month header Lunar summary (Buddhist Era + Lunar month(s) spanned)
  const monthLunarInfo = useMemo(() => {
    const first = calculateKhmerLunar(new Date(currentYear, currentMonth, 1));
    const last = calculateKhmerLunar(new Date(currentYear, currentMonth + 1, 0));
    const months =
      first.lunarMonthStr === last.lunarMonthStr
        ? `ខែ${first.lunarMonthStr}`
        : `ខែ${first.lunarMonthStr} - ${last.lunarMonthStr}`;
    const be =
      first.buddhistEra === last.buddhistEra
        ? `ព.ស. ${toKhmerNumber(first.buddhistEra)}`
        : `ព.ស. ${toKhmerNumber(first.buddhistEra)}-${toKhmerNumber(last.buddhistEra)}`;
    return { months, be };
  }, [currentYear, currentMonth]);

  // Calendar grid cells (35 or 42 days)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      lunar: KhmerLunarDate;
      events: MonasteryEvent[];
    }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthTotalDays - i);
      const dateKey = formatDateKey(d);
      days.push({
        date: d,
        dateKey,
        isCurrentMonth: false,
        lunar: calculateKhmerLunar(d),
        events: eventsByDate.get(dateKey) || [],
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateKey = formatDateKey(d);
      days.push({
        date: d,
        dateKey,
        isCurrentMonth: true,
        lunar: calculateKhmerLunar(d),
        events: eventsByDate.get(dateKey) || [],
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const dateKey = formatDateKey(d);
      days.push({
        date: d,
        dateKey,
        isCurrentMonth: false,
        lunar: calculateKhmerLunar(d),
        events: eventsByDate.get(dateKey) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  };

  const handleSelectDay = (date: Date, isCurrentMonth: boolean) => {
    setSelectedDate(date);
    setQuickError('');
    if (!isCurrentMonth) {
      setCurrentYear(date.getFullYear());
      setCurrentMonth(date.getMonth());
    }
  };

  // Trigger quick bookmark directly from a calendar cell icon
  const handleStartQuickBookmark = (date: Date, isCurrentMonth: boolean, presetTitle?: string) => {
    handleSelectDay(date, isCurrentMonth);
    setQuickOpen(true);
    setQuickError('');
    if (presetTitle !== undefined) {
      setQuickTitle(presetTitle);
    }
    requestAnimationFrame(() => {
      quickInputRef.current?.focus();
      if (window.innerWidth < 1024) {
        quickPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  };

  const resetQuickForm = () => {
    setQuickTitle('');
    setQuickType('monastery');
    setQuickShowDetails(false);
    setQuickTime('07:00');
    setQuickHost('');
    setQuickPhone('');
    setQuickLocation('');
    setQuickMonks(4);
    setQuickNote('');
    setQuickError('');
  };

  // Save inline quick holiday/event bookmark to clicked date
  const handleSaveQuickBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) {
      setQuickError('សូមបញ្ចូលឈ្មោះថ្ងៃបុណ្យ ឬ កំណត់ចំណាំ');
      playFailSound();
      quickInputRef.current?.focus();
      return;
    }

    setQuickSaving(true);
    setQuickError('');
    try {
      await api.createEvent({
        title: trimmed,
        event_type: quickType,
        host_name: quickHost.trim(),
        phone: quickPhone.trim(),
        location: quickLocation.trim(),
        event_date: selectedDateKey,
        event_time: quickShowDetails ? quickTime : '',
        monks_count: quickShowDetails ? Number(quickMonks) || 1 : 0,
        description: quickNote.trim(),
      });
      playSuccessSound();
      resetQuickForm();
      setQuickOpen(false);
      await fetchEvents();
    } catch (err: any) {
      playFailSound();
      setQuickError(err.message || 'រក្សាទុកមិនបានសម្រេច');
    } finally {
      setQuickSaving(false);
    }
  };

  // One-click bookmark of a built-in Buddhist holiday on the selected date
  const handleQuickSaveBuiltInHoliday = async (holidayTitle: string) => {
    setQuickSaving(true);
    setQuickError('');
    try {
      await api.createEvent({
        title: holidayTitle,
        event_type: 'monastery',
        host_name: '',
        phone: '',
        location: '',
        event_date: selectedDateKey,
        event_time: '',
        monks_count: 0,
        description: '',
      });
      playSuccessSound();
      await fetchEvents();
    } catch (err: any) {
      playFailSound();
      setQuickError(err.message || 'រក្សាទុកមិនបានសម្រេច');
    } finally {
      setQuickSaving(false);
    }
  };

  // Full Add / Edit Modal handlers
  const handleOpenAddModal = (presetDate?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormType('monastery');
    setFormHostName('');
    setFormPhone('');
    setFormLocation('');
    setFormDate(presetDate || selectedDateKey || todayDateStr);
    setFormTime('07:00');
    setFormMonksCount(4);
    setFormDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ev: MonasteryEvent) => {
    setEditingEvent(ev);
    setFormTitle(ev.title || '');
    setFormType(ev.event_type || 'monastery');
    setFormHostName(ev.host_name || '');
    setFormPhone(ev.phone || '');
    setFormLocation(ev.location || '');
    setFormDate(ev.event_date || todayDateStr);
    setFormTime(ev.event_time || '');
    setFormMonksCount(ev.monks_count || 0);
    setFormDescription(ev.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveModalEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('សូមបញ្ចូលឈ្មោះកម្មវិធី');
      playFailSound();
      return;
    }
    if (!formDate) {
      setFormError('សូមជ្រើសរើសថ្ងៃខែ');
      playFailSound();
      return;
    }

    setModalLoading(true);
    setFormError('');

    const payload = {
      title: formTitle.trim(),
      event_type: formType,
      host_name: formHostName.trim(),
      phone: formPhone.trim(),
      location: formLocation.trim(),
      event_date: formDate,
      event_time: formTime.trim(),
      monks_count: Number(formMonksCount) || 0,
      description: formDescription.trim(),
    };

    try {
      if (editingEvent) {
        await api.updateEvent(editingEvent.id, payload);
      } else {
        await api.createEvent(payload);
      }
      playSuccessSound();
      setIsModalOpen(false);
      await fetchEvents();
    } catch (err: any) {
      playFailSound();
      setFormError(err.message || 'រក្សាទុកមិនបានសម្រេច');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleComplete = async (ev: MonasteryEvent) => {
    try {
      await api.updateEvent(ev.id, { is_completed: !ev.is_completed });
      playSuccessSound();
      await fetchEvents();
    } catch {
      playFailSound();
    }
  };

  const handleConfirmDeleteEvent = async () => {
    if (!confirmDeleteEvent) return;
    setDeleteLoading(true);
    try {
      await api.deleteEvent(confirmDeleteEvent.id);
      playSuccessSound();
      setConfirmDeleteEvent(null);
      await fetchEvents();
    } catch {
      playFailSound();
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleJumpToDateOnCalendar = (dateStr: string) => {
    const target = parseLocalDate(dateStr);
    setCurrentYear(target.getFullYear());
    setCurrentMonth(target.getMonth());
    setSelectedDate(target);
    setActiveTab('calendar');
  };

  // Filtered lists for Upcoming & History
  const filteredUpcoming = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return upcomingEvents.filter((ev) => {
      const matchesType = typeFilter === 'all' || ev.event_type === typeFilter;
      const matchesSearch =
        !term ||
        ev.title.toLowerCase().includes(term) ||
        (ev.host_name && ev.host_name.toLowerCase().includes(term)) ||
        (ev.location && ev.location.toLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }, [upcomingEvents, typeFilter, searchTerm]);

  const filteredHistory = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return historyEvents.filter((ev) => {
      const matchesType = typeFilter === 'all' || ev.event_type === typeFilter;
      const matchesSearch =
        !term ||
        ev.title.toLowerCase().includes(term) ||
        (ev.host_name && ev.host_name.toLowerCase().includes(term)) ||
        (ev.location && ev.location.toLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }, [historyEvents, typeFilter, searchTerm]);

  const alreadyBookmarkedHoliday = useMemo(() => {
    if (!selectedLunar.holidayName) return true;
    return selectedDateEvents.some(
      (ev) => ev.title.trim() === selectedLunar.holidayName?.trim()
    );
  }, [selectedLunar.holidayName, selectedDateEvents]);

  const handleTogglePush = async () => {
    setPushBusy(true);
    setPushFeedback(null);
    try {
      if (pushStatus?.enabled) {
        await disableCalendarNotifications();
        playSuccessSound();
        setPushFeedback({ text: 'បានបិទការជូនដំណឹងលើឧបករណ៍នេះ' });
      } else {
        const res = await enableCalendarNotifications();
        if (res.ok) {
          playSuccessSound();
          setPushFeedback({ text: res.message });
        } else {
          playFailSound();
          setPushFeedback({ text: res.message, isError: true });
        }
      }
      const next = await getPushStatus();
      setPushStatus(next);
    } catch (err: any) {
      playFailSound();
      setPushFeedback({ text: err?.message || 'មានបញ្ហាក្នុងការកំណត់ការជូនដំណឹង', isError: true });
    } finally {
      setPushBusy(false);
    }
  };

  const handleSendTestAlert = async () => {
    setPushBusy(true);
    setPushFeedback(null);
    try {
      const res = await sendTestCalendarNotification();
      if (res.ok) {
        playSuccessSound();
        setPushFeedback({ text: res.message });
      } else {
        playFailSound();
        setPushFeedback({ text: res.message, isError: true });
      }
    } catch (err: any) {
      playFailSound();
      setPushFeedback({ text: err?.message || 'មិនអាចផ្ញើសារសាកល្បងបានទេ', isError: true });
    } finally {
      setPushBusy(false);
    }
  };

  const handleBroadcastReminders = async () => {
    setPushBusy(true);
    setPushFeedback(null);
    try {
      const res = await api.triggerPushReminders();
      if (!res?.configured) {
        playFailSound();
        setPushFeedback({ text: 'មិនទាន់កំណត់ VAPID Key លើ Server នៅឡើយទេ', isError: true });
      } else if (res.remindersCount === 0) {
        playSuccessSound();
        setPushFeedback({ text: 'ថ្ងៃនេះ និងស្អែកមិនមានថ្ងៃសីល ឬបុណ្យជិតមកដល់ទេ' });
      } else {
        playSuccessSound();
        setPushFeedback({
          text: `បានផ្ញើរំលឹក ${res.sent} ដង ទៅកាន់ឧបករណ៍ ${res.subscribersCount}`,
        });
      }
    } catch (err: any) {
      playFailSound();
      setPushFeedback({ text: err?.message || 'ផ្ញើរំលឹកមិនបានសម្រេច', isError: true });
    } finally {
      setPushBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="ប្រតិទិនខ្មែរ"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl h-[88vh] sm:h-[680px] max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Compact Top Bar: Title + 3-Tab Switcher + Close */}
        <div className="px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarIcon className="w-5 h-5 text-[#028090] dark:text-teal-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-title text-gray-900 dark:text-white whitespace-nowrap">
              ប្រតិទិនខ្មែរ
            </h2>
          </div>

          {/* Segmented View Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/90 dark:bg-slate-800/80 order-3 sm:order-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs sm:text-sm font-battambang transition-colors whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              ប្រតិទិន
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs sm:text-sm font-battambang transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>ជិតមកដល់</span>
              <span
                className={`font-rajdhani font-bold tabular-nums text-xs ${
                  approachingAlerts.length > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-400 dark:text-slate-500'
                }`}
              >
                {upcomingEvents.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs sm:text-sm font-battambang transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>ប្រវត្តិ</span>
              <span className="font-rajdhani font-bold tabular-nums text-xs text-gray-400 dark:text-slate-500">
                {historyEvents.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 order-2 sm:order-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowReminderBar((v) => !v)}
              title="ការជូនដំណឹងលើទូរស័ព្ទ & Lock Screen"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-battambang font-bold transition-colors cursor-pointer whitespace-nowrap ${
                pushStatus?.enabled
                  ? 'border-[#028090]/40 dark:border-teal-500/40 text-[#028090] dark:text-teal-400'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {pushStatus?.enabled ? (
                <BellRing className="w-4 h-4 shrink-0" />
              ) : (
                <Bell className="w-4 h-4 shrink-0" />
              )}
              <span>រំលឹក</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="បិទ"
              className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Lock Screen Push & Phone Calendar Bar */}
        {showReminderBar && (
          <div className="px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 shrink-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-battambang font-bold text-gray-900 dark:text-white">
                  ការជូនដំណឹងលើទូរស័ព្ទ និង Lock Screen
                </p>
                <p className="text-[11px] font-battambang text-gray-500 dark:text-slate-400">
                  {pushStatus?.needsHomeScreenInstall
                    ? 'iPhone៖ ចុច Share → Add to Home Screen ដើម្បីទទួលសារលើ Lock Screen'
                    : pushStatus?.enabled
                    ? pushStatus.serverPushActive
                      ? 'បានបើក Web Push ២៤ ម៉ោង (រំលឹកមុន ១ ថ្ងៃ និងព្រឹកថ្ងៃបុណ្យ/ថ្ងៃសីល)'
                      : 'បានបើកការជូនដំណឹងលើឧបករណ៍នេះ'
                    : 'រំលឹកថ្ងៃសីល និងថ្ងៃបុណ្យមុន ១ ថ្ងៃ និងព្រឹកថ្ងៃនោះ'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={pushBusy}
                  onClick={handleTogglePush}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-battambang font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                    pushStatus?.enabled
                      ? 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                      : 'bg-[#028090] hover:bg-[#026a77] text-white'
                  }`}
                >
                  {pushStatus?.enabled ? (
                    <>
                      <BellOff className="w-3.5 h-3.5" />
                      <span>បិទ</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="w-3.5 h-3.5" />
                      <span>បើកការជូនដំណឹង</span>
                    </>
                  )}
                </button>

                {pushStatus?.enabled && (
                  <button
                    type="button"
                    disabled={pushBusy}
                    onClick={handleSendTestAlert}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-xs font-battambang font-bold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>សាកល្បង</span>
                  </button>
                )}

                {upcomingEvents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      downloadUpcomingEventsICS(upcomingEvents);
                      playSuccessSound();
                      setPushFeedback({
                        text: `បានទាញយកប្រតិទិន (${upcomingEvents.length} កម្មវិធី) សម្រាប់ Apple / Google Calendar`,
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-xs font-battambang font-bold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-[#028090] dark:text-teal-400" />
                    <span>ដាក់ចូលប្រតិទិនទូរស័ព្ទ (.ics)</span>
                  </button>
                )}

                {isAdmin && pushStatus?.serverConfigured && (
                  <button
                    type="button"
                    disabled={pushBusy}
                    onClick={handleBroadcastReminders}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#028090]/40 text-xs font-battambang font-bold text-[#028090] dark:text-teal-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>ផ្ញើរំលឹកឥឡូវ</span>
                  </button>
                )}
              </div>
            </div>

            {pushFeedback && (
              <p
                className={`text-xs font-battambang ${
                  pushFeedback.isError
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-[#028090] dark:text-teal-400'
                }`}
              >
                {pushFeedback.text}
              </p>
            )}
          </div>
        )}

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ================= TAB 1: LUNAR + SOLAR CALENDAR (DEFAULT) ================= */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-full">
              {/* Left: Monthly Lunar & Solar Calendar Grid */}
              <div className="p-3 sm:p-5 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-800">
                {/* Month Bar + Next Seil Inline */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-title text-gray-900 dark:text-white whitespace-nowrap">
                        ខែ{KHMER_SOLAR_MONTHS[currentMonth]}{' '}
                        <span className="font-rajdhani font-bold tabular-nums">{currentYear}</span>
                      </h3>
                      <span className="text-xs font-battambang text-gray-500 dark:text-slate-400">
                        {monthLunarInfo.months} · {monthLunarInfo.be}
                      </span>
                    </div>
                    <div className="text-xs font-battambang text-amber-700 dark:text-amber-400 mt-0.5">
                      ថ្ងៃសីលបន្ទាប់៖{' '}
                      <span className="font-rajdhani font-bold tabular-nums">
                        {nextSeil.date.getDate()}
                      </span>{' '}
                      {KHMER_SOLAR_MONTHS[nextSeil.date.getMonth()]} ({nextSeil.lunar.lunarDayStr})
                      {nextSeil.daysRemaining === 0
                        ? ' · ថ្ងៃនេះ'
                        : nextSeil.daysRemaining === 1
                        ? ' · ស្អែក'
                        : ` · សល់ ${nextSeil.daysRemaining} ថ្ងៃ`}
                    </div>
                  </div>

                  {/* Month Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      aria-label="ខែមុន"
                      className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToday}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-battambang font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      ថ្ងៃនេះ
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      aria-label="ខែបន្ទាប់"
                      className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-t border-l border-r border-gray-200 dark:border-slate-800 rounded-t-xl overflow-hidden bg-gray-50/80 dark:bg-slate-800/40">
                  {WEEKDAYS_SHORT.map((day, idx) => (
                    <div
                      key={day}
                      className={`py-2 text-center text-[11px] sm:text-xs font-battambang font-bold border-b border-gray-200 dark:border-slate-800 ${
                        idx === 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-gray-600 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 border-l border-gray-200 dark:border-slate-800 rounded-b-xl overflow-hidden">
                  {calendarDays.map((cell) => {
                    const isToday = cell.dateKey === todayDateStr;
                    const isSelected = cell.dateKey === selectedDateKey;
                    const isSunday = cell.date.getDay() === 0;
                    const hasSaved = cell.events.length > 0;
                    const firstEvent = cell.events[0];

                    return (
                      <div
                        key={cell.dateKey}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectDay(cell.date, cell.isCurrentMonth)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectDay(cell.date, cell.isCurrentMonth);
                          }
                        }}
                        className={`group relative min-h-[72px] sm:min-h-[86px] p-1.5 sm:p-2 border-r border-b border-gray-200 dark:border-slate-800 flex flex-col justify-between text-left transition-colors cursor-pointer select-none ${
                          !cell.isCurrentMonth
                            ? 'bg-gray-50/50 dark:bg-slate-900/40 opacity-45'
                            : isSelected
                            ? 'bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-inset ring-[#028090] dark:ring-teal-500'
                            : 'bg-white dark:bg-slate-900 hover:bg-gray-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Top row: Solar Date + Bookmark Status / Quick Save Icon */}
                        <div className="flex items-start justify-between gap-1">
                          <span
                            className={`text-sm sm:text-base font-rajdhani font-bold leading-none tabular-nums ${
                              isToday
                                ? 'text-[#028090] dark:text-teal-400 underline decoration-2 underline-offset-4'
                                : isSunday
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-gray-900 dark:text-slate-100'
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {hasSaved && (
                              <span
                                title={`មានកំណត់ចំណាំ ${cell.events.length}`}
                                className="inline-flex items-center text-[#028090] dark:text-teal-400"
                              >
                                <Bookmark className="w-3.5 h-3.5 fill-current" />
                                {cell.events.length > 1 && (
                                  <span className="text-[10px] font-rajdhani font-bold tabular-nums ml-0.5">
                                    {cell.events.length}
                                  </span>
                                )}
                              </span>
                            )}

                            {/* Direct Quick-Save Bookmark Icon on Selected Cell (or Hover on Desktop) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartQuickBookmark(cell.date, cell.isCurrentMonth);
                              }}
                              title="ចំណាំថ្ងៃបុណ្យ"
                              aria-label={`ចំណាំថ្ងៃទី ${cell.date.getDate()}`}
                              className={`p-0.5 rounded text-[#028090] dark:text-teal-400 hover:text-[#026370] dark:hover:text-teal-300 transition-opacity cursor-pointer ${
                                isSelected
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                              }`}
                            >
                              <BookmarkPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Middle/Bottom: Lunar Day + Seil / Built-in Holiday / Saved Note */}
                        <div className="mt-1 space-y-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[10px] sm:text-[11px] font-battambang leading-tight truncate ${
                                cell.lunar.isSeil
                                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                                  : 'text-gray-500 dark:text-slate-400'
                              }`}
                            >
                              {cell.lunar.lunarDayStr}
                            </span>
                            {cell.lunar.isSeil && (
                              <span className="text-[9px] sm:text-[10px] font-battambang font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                សីល
                              </span>
                            )}
                          </div>

                          {cell.lunar.shortHoliday && (
                            <p className="text-[9px] sm:text-[10px] font-battambang font-bold text-rose-600 dark:text-rose-400 truncate leading-tight">
                              {cell.lunar.shortHoliday}
                            </p>
                          )}

                          {firstEvent && (
                            <p className="text-[9px] sm:text-[10px] font-battambang font-bold text-[#028090] dark:text-teal-300 truncate leading-tight">
                              {firstEvent.title}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Minimal Inline Legend (Unboxed) */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-battambang text-gray-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <span>សីល</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500 dark:text-slate-400">ថ្ងៃសីល</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#028090] dark:text-teal-400">
                    <Bookmark className="w-3 h-3 fill-current" />
                    <span className="text-gray-500 dark:text-slate-400">បានចំណាំ</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-500 dark:text-slate-400">
                    <BookmarkPlus className="w-3.5 h-3.5 text-[#028090] dark:text-teal-400" />
                    <span>ចុចលើថ្ងៃ រួចចុចសញ្ញានេះដើម្បីរក្សាទុក</span>
                  </span>
                </div>
              </div>

              {/* Right Side Panel: Selected Date (Solar + Lunar) + Direct Quick Bookmark */}
              <div
                ref={quickPanelRef}
                className="p-4 sm:p-5 flex flex-col bg-gray-50/40 dark:bg-slate-900/60"
              >
                {/* Selected Date Summary */}
                <div className="pb-3.5 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-battambang text-gray-500 dark:text-slate-400">
                        {selectedDateKey === todayDateStr ? 'ថ្ងៃនេះ' : 'ថ្ងៃដែលបានជ្រើស'}
                      </p>
                      <h4 className="text-base sm:text-lg font-title text-gray-900 dark:text-white mt-0.5 leading-snug">
                        {selectedLunar.dayOfWeekKhmer} ទី{' '}
                        <span className="font-rajdhani font-bold tabular-nums">
                          {selectedDate.getDate()}
                        </span>{' '}
                        {KHMER_SOLAR_MONTHS[selectedDate.getMonth()]}{' '}
                        <span className="font-rajdhani font-bold tabular-nums">
                          {selectedDate.getFullYear()}
                        </span>
                      </h4>
                      <p className="text-xs font-battambang text-gray-600 dark:text-slate-300 mt-1">
                        {selectedLunar.lunarDayStr} ខែ{selectedLunar.lunarMonthStr} ឆ្នាំ
                        {selectedLunar.lunarYearStr} · ព.ស.{' '}
                        {toKhmerNumber(selectedLunar.buddhistEra)}
                      </p>
                    </div>

                    {/* Direct Bookmark Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setQuickOpen((prev) => !prev);
                        setQuickError('');
                        if (!quickOpen) {
                          requestAnimationFrame(() => quickInputRef.current?.focus());
                        }
                      }}
                      title="ចំណាំថ្ងៃបុណ្យ"
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-battambang font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        quickOpen
                          ? 'text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-700'
                          : 'bg-[#028090] hover:bg-[#026a77] text-white'
                      }`}
                    >
                      {quickOpen ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>បិទ</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4" />
                          <span>ចំណាំ</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Seil / Traditional Holiday line + 1-tap Phone Calendar Export */}
                  {(selectedLunar.isSeil || selectedLunar.holidayName) && (
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs font-battambang">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                        {selectedLunar.isSeil && (
                          <span className="font-bold text-amber-700 dark:text-amber-400">
                            {selectedLunar.seilTitle}
                          </span>
                        )}
                        {selectedLunar.isSeil && selectedLunar.holidayName && (
                          <span className="text-gray-300 dark:text-slate-700">·</span>
                        )}
                        {selectedLunar.holidayName && (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {selectedLunar.holidayName}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          downloadLunarDayICS(selectedDateKey, selectedLunar);
                          playSuccessSound();
                        }}
                        title="ដាក់ថ្ងៃនេះចូលប្រតិទិនទូរស័ព្ទ (.ics)"
                        className="shrink-0 inline-flex items-center gap-1 text-[11px] font-battambang font-bold text-[#028090] dark:text-teal-400 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>ប្រតិទិន</span>
                      </button>
                    </div>
                  )}

                  {/* One-click Save Built-in Buddhist Holiday if not yet bookmarked */}
                  {selectedLunar.holidayName && !alreadyBookmarkedHoliday && (
                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={() => handleQuickSaveBuiltInHoliday(selectedLunar.holidayName!)}
                      className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-dashed border-[#028090]/50 dark:border-teal-500/40 text-xs font-battambang font-bold text-[#028090] dark:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">រក្សាទុក «{selectedLunar.holidayName}»</span>
                    </button>
                  )}
                </div>

                {/* Quick Holiday / Event Bookmark Form */}
                {quickOpen && (
                  <form
                    onSubmit={handleSaveQuickBookmark}
                    className="py-3.5 border-b border-gray-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={quickInputRef}
                        type="text"
                        value={quickTitle}
                        onChange={(e) => {
                          setQuickTitle(e.target.value);
                          if (quickError) setQuickError('');
                        }}
                        placeholder="ឈ្មោះថ្ងៃបុណ្យ ឬ កំណត់ចំណាំ..."
                        className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm font-battambang bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#028090]"
                      />
                      <button
                        type="submit"
                        disabled={quickSaving}
                        title="រក្សាទុក"
                        className="px-3 py-2 rounded-lg bg-[#028090] hover:bg-[#026a77] text-white text-xs font-battambang font-bold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <BookmarkCheck className="w-4 h-4" />
                        <span>{quickSaving ? '...' : 'រក្សាទុក'}</span>
                      </button>
                    </div>

                    {/* Type Switch + Optional Details Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 p-0.5 rounded-md bg-gray-200/70 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => setQuickType('monastery')}
                          className={`px-2 py-1 rounded text-[11px] font-battambang transition-colors cursor-pointer ${
                            quickType === 'monastery'
                              ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold'
                              : 'text-gray-600 dark:text-slate-400'
                          }`}
                        >
                          បុណ្យវត្ត
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickType('devotee_invitation')}
                          className={`px-2 py-1 rounded text-[11px] font-battambang transition-colors cursor-pointer ${
                            quickType === 'devotee_invitation'
                              ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold'
                              : 'text-gray-600 dark:text-slate-400'
                          }`}
                        >
                          និមន្ត
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setQuickShowDetails((v) => !v)}
                        className="inline-flex items-center gap-1 text-[11px] font-battambang text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <span>ព័ត៌មានបន្ថែម</span>
                        {quickShowDetails ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {quickShowDetails && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <input
                          type="time"
                          value={quickTime}
                          onChange={(e) => setQuickTime(e.target.value)}
                          className="px-2.5 py-1.5 text-xs font-rajdhani font-semibold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                        />
                        <input
                          type="number"
                          min={0}
                          value={quickMonks}
                          onChange={(e) => setQuickMonks(parseInt(e.target.value, 10) || 0)}
                          placeholder="ចំនួនអង្គ"
                          className="px-2.5 py-1.5 text-xs font-rajdhani font-semibold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                        />
                        <input
                          type="text"
                          value={quickHost}
                          onChange={(e) => setQuickHost(e.target.value)}
                          placeholder="ម្ចាស់ដើមបុណ្យ"
                          className="col-span-2 px-2.5 py-1.5 text-xs font-battambang bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                        />
                        <input
                          type="text"
                          value={quickPhone}
                          onChange={(e) => setQuickPhone(e.target.value)}
                          placeholder="លេខទូរស័ព្ទ"
                          className="px-2.5 py-1.5 text-xs font-rajdhani font-semibold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                        />
                        <input
                          type="text"
                          value={quickLocation}
                          onChange={(e) => setQuickLocation(e.target.value)}
                          placeholder="ទីតាំង"
                          className="px-2.5 py-1.5 text-xs font-battambang bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                        />
                        <input
                          type="text"
                          value={quickNote}
                          onChange={(e) => setQuickNote(e.target.value)}
                          placeholder="កំណត់សម្គាល់..."
                          className="col-span-2 px-2.5 py-1.5 text-xs font-battambang bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                        />
                      </div>
                    )}

                    {quickError && (
                      <p className="text-xs font-battambang text-rose-600 dark:text-rose-400">
                        {quickError}
                      </p>
                    )}
                  </form>
                )}

                {/* Saved Notes / Events List for Selected Date */}
                <div className="pt-3.5 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-battambang font-bold text-gray-600 dark:text-slate-300">
                      កំណត់ចំណាំថ្ងៃនេះ{' '}
                      <span className="font-rajdhani font-bold tabular-nums text-gray-400 dark:text-slate-500">
                        ({selectedDateEvents.length})
                      </span>
                    </span>
                  </div>

                  {loading ? (
                    <div className="space-y-2 py-2">
                      <div className="h-10 rounded-lg bg-gray-200/60 dark:bg-slate-800 animate-pulse" />
                      <div className="h-10 rounded-lg bg-gray-200/60 dark:bg-slate-800 animate-pulse" />
                    </div>
                  ) : selectedDateEvents.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs font-battambang text-gray-400 dark:text-slate-500">
                        មិនទាន់មានកំណត់ចំណាំទេ
                      </p>
                      {!quickOpen && (
                        <button
                          type="button"
                          onClick={() => handleStartQuickBookmark(selectedDate, true)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-battambang font-bold text-[#028090] dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>បន្ថែមចំណាំថ្ងៃនេះ</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200/80 dark:divide-slate-800">
                      {selectedDateEvents.map((ev) => (
                        <div key={ev.id} className="py-2.5 first:pt-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Bookmark
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    ev.is_completed
                                      ? 'text-gray-400 dark:text-slate-500'
                                      : 'text-[#028090] dark:text-teal-400 fill-current'
                                  }`}
                                />
                                <p
                                  className={`text-sm font-battambang font-bold truncate ${
                                    ev.is_completed
                                      ? 'line-through text-gray-400 dark:text-slate-500'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {ev.title}
                                </p>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-battambang text-gray-500 dark:text-slate-400">
                                <span>
                                  {ev.event_type === 'devotee_invitation' ? 'និមន្ត' : 'បុណ្យវត្ត'}
                                </span>
                                {ev.event_time && (
                                  <>
                                    <span>·</span>
                                    <span className="font-rajdhani font-semibold tabular-nums">
                                      {ev.event_time}
                                    </span>
                                  </>
                                )}
                                {ev.monks_count ? (
                                  <>
                                    <span>·</span>
                                    <span className="font-rajdhani font-semibold tabular-nums">
                                      {ev.monks_count} អង្គ
                                    </span>
                                  </>
                                ) : null}
                              </div>

                              {(ev.host_name || ev.location || ev.phone) && (
                                <p className="mt-0.5 text-[11px] font-battambang text-gray-500 dark:text-slate-400 truncate">
                                  {[ev.host_name, ev.location, ev.phone].filter(Boolean).join(' · ')}
                                </p>
                              )}

                              {ev.description && (
                                <p className="mt-0.5 text-[11px] font-battambang text-gray-500 dark:text-slate-400 line-clamp-2">
                                  {ev.description}
                                </p>
                              )}
                            </div>

                            {/* Action Icons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  downloadEventICS(ev, selectedLunar);
                                  playSuccessSound();
                                }}
                                title="ដាក់ចូលប្រតិទិនទូរស័ព្ទ (.ics)"
                                className="p-1 text-gray-400 hover:text-[#028090] dark:hover:text-teal-400 transition-colors cursor-pointer"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleComplete(ev)}
                                title={ev.is_completed ? 'ដាក់ជិតមកដល់វិញ' : 'បញ្ចប់'}
                                className={`p-1 transition-colors cursor-pointer ${
                                  ev.is_completed
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                                }`}
                              >
                                {ev.is_completed ? (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(ev)}
                                title="កែប្រែ"
                                className="p-1 text-gray-400 hover:text-[#028090] dark:hover:text-teal-400 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteEvent(ev)}
                                  title="លុប"
                                  className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2 & TAB 3: UPCOMING & HISTORY ================= */}
          {(activeTab === 'upcoming' || activeTab === 'history') && (
            <div className="p-4 sm:p-5 min-h-full flex flex-col gap-4">
              {/* Compact Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ស្វែងរក..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm font-battambang bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100 dark:bg-slate-800">
                    {(
                      [
                        { id: 'all', label: 'ទាំងអស់' },
                        { id: 'monastery', label: 'បុណ្យវត្ត' },
                        { id: 'devotee_invitation', label: 'និមន្ត' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTypeFilter(opt.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-battambang transition-colors cursor-pointer whitespace-nowrap ${
                          typeFilter === opt.id
                            ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold shadow-xs'
                            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'upcoming' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#028090] hover:bg-[#026a77] text-white text-xs font-battambang font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>បន្ថែម</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Event Rows */}
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-lg bg-gray-100 dark:bg-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : (activeTab === 'upcoming' ? filteredUpcoming : filteredHistory).length === 0 ? (
                <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-6">
                  <p className="text-sm font-battambang text-gray-400 dark:text-slate-500">
                    {activeTab === 'upcoming' ? 'មិនមានកម្មវិធីជិតមកដល់ទេ' : 'មិនមានប្រវត្តិកម្មវិធីទេ'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  {(activeTab === 'upcoming' ? filteredUpcoming : filteredHistory).map((ev) => {
                    const evDateObj = parseLocalDate(ev.event_date);
                    const evLunar = calculateKhmerLunar(evDateObj);
                    const diffDays = Math.round(
                      (evDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const urgencyText =
                      activeTab === 'upcoming'
                        ? diffDays === 0
                          ? 'ថ្ងៃនេះ'
                          : diffDays === 1
                          ? 'ស្អែក'
                          : diffDays <= 3
                          ? `សល់ ${diffDays} ថ្ងៃ`
                          : null
                        : null;

                    return (
                      <div
                        key={ev.id}
                        className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Clickable Date Block */}
                        <button
                          type="button"
                          onClick={() => handleJumpToDateOnCalendar(ev.event_date)}
                          title="មើលលើប្រតិទិន"
                          className="shrink-0 w-14 text-left cursor-pointer group"
                        >
                          <div className="text-lg font-rajdhani font-bold leading-none tabular-nums text-[#028090] dark:text-teal-400 group-hover:underline">
                            {evDateObj.getDate()}
                          </div>
                          <div className="text-[11px] font-battambang text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                            {KHMER_SOLAR_MONTHS[evDateObj.getMonth()]}
                          </div>
                          <div className="text-[10px] font-battambang text-gray-400 dark:text-slate-500 truncate">
                            {evLunar.lunarDayStr}
                          </div>
                        </button>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm sm:text-base font-title truncate ${
                                ev.is_completed
                                  ? 'line-through text-gray-400 dark:text-slate-500'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {ev.title}
                            </h4>
                            {urgencyText && (
                              <span
                                className={`text-[11px] font-battambang font-bold whitespace-nowrap ${
                                  diffDays === 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {urgencyText}
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs font-battambang text-gray-500 dark:text-slate-400">
                            <span>
                              {ev.event_type === 'devotee_invitation' ? 'និមន្ត' : 'បុណ្យវត្ត'}
                            </span>
                            {ev.event_time && (
                              <span className="inline-flex items-center gap-1 font-rajdhani font-semibold tabular-nums">
                                <Clock className="w-3 h-3" />
                                {ev.event_time}
                              </span>
                            )}
                            {ev.monks_count ? (
                              <span className="inline-flex items-center gap-1 font-rajdhani font-semibold tabular-nums">
                                <Users className="w-3 h-3" />
                                {ev.monks_count} អង្គ
                              </span>
                            ) : null}
                            {ev.host_name && <span>· {ev.host_name}</span>}
                            {ev.location && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{ev.location}</span>
                              </span>
                            )}
                            {ev.phone && (
                              <span className="inline-flex items-center gap-1 font-rajdhani font-semibold tabular-nums">
                                <Phone className="w-3 h-3 shrink-0" />
                                {ev.phone}
                              </span>
                            )}
                          </div>

                          {ev.description && (
                            <p className="mt-1 text-xs font-battambang text-gray-500 dark:text-slate-400 line-clamp-1">
                              {ev.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              downloadEventICS(ev, evLunar);
                              playSuccessSound();
                            }}
                            title="ដាក់ចូលប្រតិទិនទូរស័ព្ទ (.ics)"
                            className="p-1.5 text-gray-400 hover:text-[#028090] dark:hover:text-teal-400 transition-colors cursor-pointer"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(ev)}
                            title={ev.is_completed ? 'ដាក់ជិតមកដល់វិញ' : 'បញ្ចប់'}
                            className={`p-1.5 transition-colors cursor-pointer ${
                              ev.is_completed
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                          >
                            {ev.is_completed ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ev)}
                            title="កែប្រែ"
                            className="p-1.5 text-gray-400 hover:text-[#028090] dark:hover:text-teal-400 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteEvent(ev)}
                              title="លុប"
                              className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD / EDIT EVENT MODAL ================= */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-title text-gray-900 dark:text-white">
                {editingEvent ? 'កែប្រែកំណត់ចំណាំ' : 'បន្ថែមថ្ងៃបុណ្យ'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalEvent} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                  ឈ្មោះថ្ងៃបុណ្យ / កម្មវិធី *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="ឧ. បុណ្យកឋិនទាន"
                  className="w-full px-3 py-2 text-sm font-battambang bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                    ប្រភេទ
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as EventType)}
                    className="w-full px-3 py-2 text-sm font-battambang bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                  >
                    <option value="monastery">បុណ្យវត្ត</option>
                    <option value="devotee_invitation">និមន្ត</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                    ថ្ងៃខែ *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-rajdhani font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                    ម៉ោង
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-rajdhani font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                    ចំនួនអង្គ
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMonksCount}
                    onChange={(e) => setFormMonksCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm font-rajdhani font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                    ម្ចាស់ដើមបុណ្យ
                  </label>
                  <input
                    type="text"
                    value={formHostName}
                    onChange={(e) => setFormHostName(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-battambang bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                    ទូរស័ព្ទ
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-rajdhani font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                  ទីតាំង
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-battambang bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090]"
                />
              </div>

              <div>
                <label className="block text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 mb-1">
                  កំណត់សម្គាល់
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-battambang bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#028090] resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs font-battambang text-rose-600 dark:text-rose-400">
                  {formError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-lg bg-[#028090] hover:bg-[#026a77] text-white text-xs font-battambang font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>{modalLoading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {confirmDeleteEvent && (
        <div
          onClick={() => !deleteLoading && setConfirmDeleteEvent(null)}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-5"
          >
            <h3 className="text-base font-title text-gray-900 dark:text-white">
              បញ្ជាក់ការលុប
            </h3>
            <p className="mt-2 text-sm font-battambang text-gray-600 dark:text-slate-300">
              តើអ្នកពិតជាចង់លុប «<span className="font-bold">{confirmDeleteEvent.title}</span>» មែនទេ?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setConfirmDeleteEvent(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-battambang font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDeleteEvent}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-battambang font-bold cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? 'កំពុងលុប...' : 'លុប'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
