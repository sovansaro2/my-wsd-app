import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { api } from '../lib/apiClient';
import { playSuccessSound, playFailSound } from '../lib/sound';
import {
  calculateKhmerLunar,
  toKhmerNumber,
  KhmerLunarDate,
} from '../lib/khmerCalendar';
import { checkAndNotifyUpcomingLocally } from '../lib/pushNotifications';
import { MonasteryEvent, EventType } from '../types/calendar';
import { useLanguage } from '../contexts/LanguageContext';

interface BuddhistCalendarProps {
  onBack?: () => void;
  onYearChange?: (year: number) => void;
  userRole?: 'admin' | 'user' | null;
}

const KHMER_SOLAR_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
];

const WEEKDAYS_COMPACT = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];

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

function getEventTypeLabel(type: EventType, isKm: boolean): string {
  if (type === 'ceremony') return isKm ? 'ពិធីបុណ្យប្រចាំឆ្នាំ' : 'Annual Ceremony';
  if (type === 'devotee_invitation') return isKm ? 'កម្មវិធីនិមន្ត' : 'Devotee Invitation';
  return isKm ? 'កម្មវិធីពិសេស' : 'Monastery Event';
}

export default function BuddhistCalendar({ onBack, onYearChange, userRole }: BuddhistCalendarProps) {
  const { language } = useLanguage();
  const isKm = language === 'km';
  const isAdmin = userRole === 'admin';

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const todayDateStr = useMemo(() => formatDateKey(today), [today]);

  // Month navigation & selected date
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  useEffect(() => {
    onYearChange?.(currentYear);
  }, [currentYear, onYearChange]);

  // Events state
  const [events, setEvents] = useState<MonasteryEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [eventsView, setEventsView] = useState<'upcoming' | 'history'>('upcoming');

  // Admin Add / Edit / Delete Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<MonasteryEvent | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<MonasteryEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Modal form fields
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EventType>('ceremony');
  const [formHostName, setFormHostName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('07:00');
  const [formMonksCount, setFormMonksCount] = useState<number>(4);
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

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

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, MonasteryEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.event_date);
      if (list) list.push(ev);
      else map.set(ev.event_date, [ev]);
    }
    return map;
  }, [events]);

  // Split upcoming vs history
  const { upcomingEvents, historyEvents } = useMemo(() => {
    const upcoming: MonasteryEvent[] = [];
    const history: MonasteryEvent[] = [];
    const todayStart = today.getTime();

    events.forEach((ev) => {
      const evDate = parseLocalDate(ev.event_date).getTime();
      const diffDays = Math.round((evDate - todayStart) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || ev.is_completed) {
        history.push(ev);
      } else {
        upcoming.push(ev);
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

    return { upcomingEvents: upcoming, historyEvents: history };
  }, [events, today]);

  const selectedLunar = useMemo(() => calculateKhmerLunar(selectedDate), [selectedDate]);
  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDateKey) || [],
    [eventsByDate, selectedDateKey]
  );

  // Calendar grid cells (clean current + adjacent month padding)
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

  const isViewingTodayMonth =
    currentYear === today.getFullYear() &&
    currentMonth === today.getMonth() &&
    selectedDateKey === todayDateStr;

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
    if (!isCurrentMonth) {
      setCurrentYear(date.getFullYear());
      setCurrentMonth(date.getMonth());
    }
  };

  const handleJumpToDate = (dateStr: string) => {
    const target = parseLocalDate(dateStr);
    setCurrentYear(target.getFullYear());
    setCurrentMonth(target.getMonth());
    setSelectedDate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Add / Edit Modal handlers
  const handleOpenAddModal = (presetDate?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormType('ceremony');
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

  const displayedEventsList = eventsView === 'upcoming' ? upcomingEvents : historyEvents;

  return (
    <div className="flex flex-col pb-8 md:pb-4 font-battambang transition-colors duration-200">
      <div className="w-full space-y-6">
        {/* Section 1: ប្រតិទិនកម្មវិធី */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between gap-3 px-1">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label={isKm ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to Home'}
                className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-[#12323A] dark:text-[#E2BD42] hover:opacity-75 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-5 h-5 shrink-0" />
                <span>{isKm ? 'ទំព័រដើម' : 'Home'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {!isViewingTodayMonth && (
                <button
                  type="button"
                  onClick={handleGoToday}
                  className="text-xs font-semibold text-[#9A7B1C] dark:text-[#E2BD42] hover:opacity-80 cursor-pointer"
                >
                  {isKm ? 'ថ្ងៃនេះ' : 'Today'}
                </button>
              )}
              <h2 className="hidden md:block font-title text-[24px] text-[#12323A] dark:text-white leading-tight">
                {isKm ? `ប្រតិទិនខ្មែរ ឆ្នាំ${toKhmerNumber(currentYear)}` : `Khmer Calendar ${currentYear}`}
              </h2>
            </div>
          </div>

          {/* Crisp Minimalist Calendar Card */}
          <div className="bg-white dark:bg-[#10252C] rounded-[28px] border border-[#EAE6DC] dark:border-teal-900/40 shadow-[0_2px_12px_rgba(18,50,58,0.035)] p-5 sm:p-6">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-title text-xl sm:text-2xl text-[#12323A] dark:text-white leading-tight">
                {isKm
                  ? `${KHMER_SOLAR_MONTHS[currentMonth]} ${toKhmerNumber(currentYear)}`
                  : new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label={isKm ? 'ខែមុន' : 'Previous month'}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#12323A] dark:text-slate-200 hover:bg-[#F8F6F0] dark:hover:bg-teal-950/50 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label={isKm ? 'ខែបន្ទាប់' : 'Next month'}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#12323A] dark:text-slate-200 hover:bg-[#F8F6F0] dark:hover:bg-teal-950/50 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Weekday Header Row */}
            <div className="grid grid-cols-7 mb-2 text-center">
              {WEEKDAYS_COMPACT.map((day, idx) => (
                <div
                  key={day + idx}
                  className={`py-1.5 text-xs sm:text-[13px] font-medium ${
                    idx === 0
                      ? 'text-[#B68D18] dark:text-[#E2BD42]'
                      : 'text-[#8A9497] dark:text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Clean 7-Column Days Grid with Khmer Lunar Days (កើត / រោច) */}
            <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
              {calendarDays.map((cell) => {
                const isSelected = cell.dateKey === selectedDateKey;
                const isTodayCell = cell.dateKey === todayDateStr;
                const hasEvents = cell.events.length > 0;
                const isSeil = cell.lunar.isSeil;
                const isHoliday = !!cell.lunar.holidayName;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => handleSelectDay(cell.date, cell.isCurrentMonth)}
                    className={`w-full py-1.5 sm:py-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#163F48] text-white shadow-sm'
                        : isTodayCell
                          ? 'ring-1.5 ring-[#163F48] dark:ring-[#E2BD42] text-[#12323A] dark:text-white'
                          : cell.isCurrentMonth
                            ? 'text-[#12323A] dark:text-slate-100 hover:bg-[#F8F6F0] dark:hover:bg-teal-950/40'
                            : 'text-[#C2C8CA] dark:text-slate-600'
                    }`}
                  >
                    <span
                      className={`font-rajdhani text-[15px] sm:text-base leading-none tabular-nums ${
                        isSelected
                          ? 'font-bold text-white'
                          : !cell.isCurrentMonth
                            ? 'font-medium text-[#C2C8CA] dark:text-slate-600'
                            : isSeil || isHoliday
                              ? 'font-bold text-[#9A7B1C] dark:text-[#E2BD42]'
                              : isTodayCell
                                ? 'font-bold'
                                : 'font-semibold'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    <span
                      className={`text-[9.5px] sm:text-[10.5px] leading-tight mt-1 whitespace-nowrap ${
                        isSelected
                          ? 'text-[#E2BD42] font-medium'
                          : !cell.isCurrentMonth
                            ? 'text-[#CFD4D6] dark:text-slate-700'
                            : isSeil || isHoliday
                              ? 'text-[#9A7B1C] dark:text-[#E2BD42] font-medium'
                              : 'text-[#7D878A] dark:text-slate-400'
                      }`}
                    >
                      {cell.lunar.lunarDayStr}
                    </span>

                    <div
                      className={`h-1.5 mt-0.5 flex items-center justify-center gap-1 ${
                        !cell.isCurrentMonth && !isSelected ? 'opacity-35' : ''
                      }`}
                    >
                      {isSeil && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-[#E2BD42]' : 'bg-[#D4AE32]'
                          }`}
                        />
                      )}
                      {hasEvents && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-[#163F48] dark:bg-teal-400'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quiet Selected-Date Lunar Info Footer */}
            <div className="mt-5 pt-4 border-t border-[#F0ECE2] dark:border-teal-900/40 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs sm:text-sm text-[#12323A] dark:text-slate-100 font-medium">
                  ថ្ងៃ{selectedLunar.dayOfWeekKhmer} {selectedLunar.lunarDayStr} ខែ{selectedLunar.lunarMonthStr} ព.ស.{' '}
                  {toKhmerNumber(selectedLunar.buddhistEra)}
                </p>

                {(selectedLunar.holidayName || selectedLunar.isSeil) && (
                  <span className="text-xs font-semibold text-[#9A7B1C] dark:text-[#E2BD42]">
                    {selectedLunar.holidayName || selectedLunar.seilTitle || 'ថ្ងៃសីល'}
                  </span>
                )}
              </div>

              {selectedDateEvents.length > 0 && (
                <div className="pt-1.5 space-y-1.5">
                  {selectedDateEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between gap-2 text-xs sm:text-sm text-[#163F48] dark:text-teal-200"
                    >
                      <span className={`font-semibold truncate ${ev.is_completed ? 'line-through opacity-60' : ''}`}>
                        • {ev.title}
                      </span>
                      {ev.event_time && (
                        <span className="font-rajdhani font-semibold tabular-nums text-[#6B7477] dark:text-slate-400 shrink-0">
                          {ev.event_time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: ព្រឹត្តិការណ៍ និងពិធីបុណ្យ */}
        <section aria-label={isKm ? 'ព្រឹត្តិការណ៍ និងពិធីបុណ្យ' : 'Events & Ceremonies'} className="space-y-3.5">
          <div className="px-1 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-title text-[21px] sm:text-[26px] text-[#12323A] dark:text-white leading-tight whitespace-nowrap">
                {isKm ? 'ព្រឹត្តិការណ៍ និងពិធីបុណ្យ' : 'Events & Ceremonies'}
              </h2>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#163F48] dark:text-[#E2BD42] hover:opacity-80 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>{isKm ? 'បន្ថែម' : 'Add'}</span>
                </button>
              )}
            </div>

            {historyEvents.length > 0 && (
              <div className="flex items-center gap-5 border-b border-[#EAE6DC] dark:border-teal-900/40">
                <button
                  type="button"
                  onClick={() => setEventsView('upcoming')}
                  className={`pb-2 text-xs sm:text-sm whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                    eventsView === 'upcoming'
                      ? 'border-[#12323A] text-[#12323A] dark:border-[#E2BD42] dark:text-[#E2BD42] font-semibold'
                      : 'border-transparent text-[#7D878A] dark:text-slate-400 hover:text-[#12323A] dark:hover:text-slate-200'
                  }`}
                >
                  {isKm ? 'ខាងមុខ' : 'Upcoming'}
                </button>
                <button
                  type="button"
                  onClick={() => setEventsView('history')}
                  className={`pb-2 text-xs sm:text-sm whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                    eventsView === 'history'
                      ? 'border-[#12323A] text-[#12323A] dark:border-[#E2BD42] dark:text-[#E2BD42] font-semibold'
                      : 'border-transparent text-[#7D878A] dark:text-slate-400 hover:text-[#12323A] dark:hover:text-slate-200'
                  }`}
                >
                  {isKm ? 'ប្រវត្តិ' : 'Past'}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 p-8 text-center text-sm text-[#7D878A]">
              {isKm ? 'កំពុងផ្ទុកកម្មវិធីបុណ្យ...' : 'Loading events...'}
            </div>
          ) : displayedEventsList.length === 0 ? (
            <div className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 p-8 text-center space-y-2">
              <CalendarIcon className="w-7 h-7 text-[#B4BCBE] dark:text-slate-600 mx-auto" />
              <p className="text-sm text-[#6B7477] dark:text-slate-400">
                {eventsView === 'upcoming'
                  ? isKm
                    ? 'មិនទាន់មានព្រឹត្តិការណ៍ ឬពិធីបុណ្យខាងមុខទេ។'
                    : 'No upcoming events scheduled.'
                  : isKm
                    ? 'មិនទាន់មានប្រវត្តិកម្មវិធីបុណ្យទេ។'
                    : 'No past events recorded.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {displayedEventsList.map((ev) => {
                const evDate = parseLocalDate(ev.event_date);
                const evLunar = calculateKhmerLunar(evDate);
                return (
                  <article
                    key={ev.id}
                    onClick={() => handleJumpToDate(ev.event_date)}
                    className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 shadow-[0_2px_10px_rgba(18,50,58,0.03)] p-5 sm:p-6 hover:border-[#12323A]/25 dark:hover:border-[#E2BD42]/45 transition-colors cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#9A7B1C] dark:text-[#E2BD42]">
                        {getEventTypeLabel(ev.event_type, isKm)}
                      </span>
                      <span className="text-xs font-rajdhani font-semibold tabular-nums text-[#6B7477] dark:text-slate-400">
                        {isKm
                          ? `${toKhmerNumber(evDate.getDate())} ${KHMER_SOLAR_MONTHS[evDate.getMonth()]} ${toKhmerNumber(evDate.getFullYear())}`
                          : ev.event_date}
                      </span>
                    </div>

                    <h3 className={`font-title text-lg sm:text-xl text-[#12323A] dark:text-white leading-snug ${ev.is_completed ? 'line-through opacity-60' : ''}`}>
                      {ev.title}
                    </h3>

                    <p className="text-xs text-[#6B7477] dark:text-slate-400">
                      ថ្ងៃ{evLunar.dayOfWeekKhmer} {evLunar.lunarDayStr} ខែ{evLunar.lunarMonthStr}
                      {ev.event_time ? ` · ម៉ោង ${ev.event_time}` : ''}
                    </p>

                    {(ev.description || ev.location || ev.host_name) && (
                      <p className="text-xs sm:text-sm text-[#5C6669] dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {ev.description || [ev.location, ev.host_name].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {isAdmin && (
                      <div
                        className="pt-2 border-t border-[#F0ECE2] dark:border-teal-900/40 flex items-center justify-end gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(ev)}
                          title={ev.is_completed ? 'មិនទាន់រួច' : 'បានបញ្ចប់'}
                          className={`cursor-pointer ${ev.is_completed ? 'text-emerald-600' : 'text-[#7D878A] hover:text-emerald-600'}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(ev)}
                          title={isKm ? 'កែប្រែ' : 'Edit'}
                          className="text-[#163F48] dark:text-[#E2BD42] hover:opacity-75 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteEvent(ev)}
                          title={isKm ? 'លុប' : 'Delete'}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Admin Add / Edit Event Modal */}
        {isModalOpen && (
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#10252C] border border-[#EAE6DC] dark:border-teal-900/50 rounded-[24px] w-full max-w-lg max-h-[88dvh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-[#F0ECE2] dark:border-teal-900/40 flex items-center justify-between">
                <h3 className="font-title text-lg text-[#12323A] dark:text-white">
                  {editingEvent
                    ? isKm
                      ? 'កែប្រែកម្មវិធីបុណ្យ'
                      : 'Edit Event'
                    : isKm
                      ? 'បន្ថែមកម្មវិធីបុណ្យថ្មី'
                      : 'Add New Event'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-[#7D878A] hover:text-[#12323A] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModalEvent} className="p-5 space-y-3.5 overflow-y-auto">
                {formError && (
                  <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                    {isKm ? 'ឈ្មោះកម្មវិធី / ពិធីបុណ្យ' : 'Event Title'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={isKm ? 'ឧ. ពិធីបុណ្យភ្ជុំបិណ្ឌ, បុណ្យកឋិនទាន...' : 'e.g. Pchum Ben Ceremony...'}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white focus:outline-none focus:border-[#12323A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                      {isKm ? 'ប្រភេទកម្មវិធី' : 'Event Type'}
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as EventType)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white"
                    >
                      <option value="ceremony">{isKm ? 'ពិធីបុណ្យប្រចាំឆ្នាំ' : 'Ceremony'}</option>
                      <option value="monastery">{isKm ? 'កម្មវិធីពិសេស' : 'Monastery Event'}</option>
                      <option value="devotee_invitation">{isKm ? 'កម្មវិធីនិមន្ត' : 'Devotee Invitation'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                      {isKm ? 'កាលបរិច្ឆេទ' : 'Date'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-rajdhani bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                      {isKm ? 'ម៉ោង' : 'Time'}
                    </label>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-rajdhani bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                      {isKm ? 'ចំនួនព្រះសង្ឃ (អង្គ)' : 'Monks Count'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMonksCount}
                      onChange={(e) => setFormMonksCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-sm font-rajdhani bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                      {isKm ? 'ម្ចាស់បុណ្យ / អ្នកនិមន្ត' : 'Host Name'}
                    </label>
                    <input
                      type="text"
                      value={formHostName}
                      onChange={(e) => setFormHostName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                      {isKm ? 'លេខទូរស័ព្ទ' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-rajdhani bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                    {isKm ? 'ទីតាំង' : 'Location'}
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder={isKm ? 'ឧ. សាលាឆាន់វត្តស្នាយដួច...' : 'e.g. Wat Snay Duoc Hall...'}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                    {isKm ? 'ព័ត៌មានលម្អិត' : 'Description'}
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white"
                  />
                </div>

                <div className="pt-3 border-t border-[#F0ECE2] dark:border-teal-900/40 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={modalLoading}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-[#6B7477] hover:text-[#12323A] cursor-pointer"
                  >
                    {isKm ? 'បោះបង់' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 rounded-xl bg-[#163F48] hover:bg-[#12323A] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {modalLoading ? (isKm ? 'កំពុងរក្សាទុក...' : 'Saving...') : isKm ? 'រក្សាទុក' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Event Confirmation Modal */}
        {confirmDeleteEvent && (
          <div
            onClick={() => setConfirmDeleteEvent(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#10252C] border border-[#EAE6DC] dark:border-teal-900/50 rounded-[24px] w-full max-w-md p-6 text-center shadow-2xl space-y-4"
            >
              <h3 className="font-title text-lg text-[#12323A] dark:text-white">
                {isKm ? 'បញ្ជាក់ការលុបកម្មវិធី' : 'Confirm Delete Event'}
              </h3>
              <p className="text-sm text-[#5C6669] dark:text-slate-300 leading-relaxed">
                {isKm
                  ? `តើអ្នកពិតជាចង់លុបកម្មវិធី «${confirmDeleteEvent.title}» មែនទេ?`
                  : `Are you sure you want to delete "${confirmDeleteEvent.title}"?`}
              </p>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteEvent(null)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm text-[#6B7477] hover:text-[#12323A] cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteEvent}
                  disabled={deleteLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  {deleteLoading ? (isKm ? 'កំពុងលុប...' : 'Deleting...') : isKm ? 'លុបចេញ' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
