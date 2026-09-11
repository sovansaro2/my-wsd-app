import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Phone, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  X, 
  Share2, 
  Check, 
  BellRing,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/apiClient';
import { sound, playSuccessSound, playFailSound } from '../lib/sound';
import { 
  calculateKhmerLunar, 
  toKhmerNumber, 
  getNextSeilDate, 
  KhmerLunarDate 
} from '../lib/khmerCalendar';
import { MonasteryEvent, EventType, ApproachingAlert } from '../types/calendar';

interface BuddhistCalendarProps {
  userRole?: 'admin' | 'user' | null;
  onBackToHome?: () => void;
}

const KHMER_SOLAR_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

export default function BuddhistCalendar({ userRole }: BuddhistCalendarProps) {
  const isAdmin = userRole === 'admin';
  const today = useMemo(() => new Date(), []);
  
  // Active subview: 'calendar' | 'upcoming' | 'history'
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'history'>('upcoming');

  // Month navigation for calendar grid
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Events state
  const [events, setEvents] = useState<MonasteryEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<MonasteryEvent | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EventType>('devotee_invitation');
  const [formHostName, setFormHostName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('07:00');
  const [formMonksCount, setFormMonksCount] = useState<number>(4);
  const [formDescription, setFormDescription] = useState('');

  // Today's YYYY-MM-DD in local time
  const todayDateStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Load events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents();
      if (Array.isArray(data)) {
        setEvents(data);
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

  // Separation into Upcoming vs History (Auto-archive logic)
  const { upcomingEvents, historyEvents, approachingAlerts } = useMemo(() => {
    const upcoming: MonasteryEvent[] = [];
    const history: MonasteryEvent[] = [];
    const alerts: ApproachingAlert[] = [];

    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    events.forEach((ev) => {
      const parts = ev.event_date.split('-');
      if (parts.length === 3) {
        const evDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
        const diffDays = Math.ceil((evDate - todayStart) / (1000 * 60 * 60 * 24));

        // Auto-archive rule: If date has passed (< 0) or manually marked completed, it goes to History
        if (diffDays < 0 || ev.is_completed) {
          history.push(ev);
        } else {
          upcoming.push(ev);
          // Approaching alert: Today (0), Tomorrow (1), or within 3 days (<= 3)
          if (diffDays >= 0 && diffDays <= 3) {
            const urgency: 'today' | 'tomorrow' | 'soon' = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'soon';
            alerts.push({ event: ev, daysDiff: diffDays, urgency });
          }
        }
      } else {
        upcoming.push(ev);
      }
    });

    // Sort upcoming: soonest first
    upcoming.sort((a, b) => {
      const cmp = a.event_date.localeCompare(b.event_date);
      if (cmp !== 0) return cmp;
      return (a.event_time || '').localeCompare(b.event_time || '');
    });

    // Sort history: most recent first
    history.sort((a, b) => {
      const cmp = b.event_date.localeCompare(a.event_date);
      if (cmp !== 0) return cmp;
      return (b.event_time || '').localeCompare(a.event_time || '');
    });

    // Sort alerts: most urgent first
    alerts.sort((a, b) => a.daysDiff - b.daysDiff);

    return { upcomingEvents: upcoming, historyEvents: history, approachingAlerts: alerts };
  }, [events, today]);

  // Next Seil calculation
  const nextSeil = useMemo(() => getNextSeilDate(today), [today]);

  // Current selected lunar date info
  const selectedLunar = useMemo(() => calculateKhmerLunar(selectedDate), [selectedDate]);

  // Days in calendar month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; lunar: KhmerLunarDate; events: MonasteryEvent[] }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthTotalDays - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayStr}`;
      const dayEvents = events.filter(e => e.event_date === dateKey);
      days.push({
        date: d,
        isCurrentMonth: false,
        lunar: calculateKhmerLunar(d),
        events: dayEvents
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayStr}`;
      const dayEvents = events.filter(e => e.event_date === dateKey);
      days.push({
        date: d,
        isCurrentMonth: true,
        lunar: calculateKhmerLunar(d),
        events: dayEvents
      });
    }

    // Next month padding to fill complete grid of 35 or 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayStr}`;
      const dayEvents = events.filter(e => e.event_date === dateKey);
      days.push({
        date: d,
        isCurrentMonth: false,
        lunar: calculateKhmerLunar(d),
        events: dayEvents
      });
    }

    return days;
  }, [currentYear, currentMonth, events]);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  };

  // Open Add Modal
  const handleOpenAddModal = (presetDate?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormType('devotee_invitation');
    setFormHostName('');
    setFormPhone('');
    setFormLocation('ភូមិ...');
    setFormDate(presetDate || todayDateStr);
    setFormTime('07:00');
    setFormMonksCount(4);
    setFormDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ev: MonasteryEvent) => {
    setEditingEvent(ev);
    setFormTitle(ev.title || '');
    setFormType(ev.event_type || 'devotee_invitation');
    setFormHostName(ev.host_name || '');
    setFormPhone(ev.phone || '');
    setFormLocation(ev.location || '');
    setFormDate(ev.event_date || todayDateStr);
    setFormTime(ev.event_time || '07:00');
    setFormMonksCount(ev.monks_count || 4);
    setFormDescription(ev.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('សូមបញ្ចូលឈ្មោះកម្មវិធី ឬ ពិធីបុណ្យ');
      playFailSound();
      return;
    }
    if (!formDate) {
      setFormError('សូមជ្រើសរើសកាលបរិច្ឆេទ');
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
      event_time: formTime,
      monks_count: Number(formMonksCount) || 1,
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
      setFormError(err.message || 'មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle Completed status
  const handleToggleComplete = async (ev: MonasteryEvent) => {
    try {
      const nextStatus = !ev.is_completed;
      await api.updateEvent(ev.id, { is_completed: nextStatus });
      playSuccessSound();
      await fetchEvents();
    } catch {
      playFailSound();
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('តើលោកអ្នកពិតជាចង់លុបកម្មវិធីនេះមែនទេ?')) return;
    try {
      await api.deleteEvent(id);
      playSuccessSound();
      await fetchEvents();
    } catch {
      playFailSound();
    }
  };

  // Filtered lists for upcoming and history tabs
  const filteredUpcoming = useMemo(() => {
    return upcomingEvents.filter(ev => {
      const matchesType = typeFilter === 'all' || ev.event_type === typeFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        ev.title.toLowerCase().includes(term) ||
        (ev.host_name && ev.host_name.toLowerCase().includes(term)) ||
        (ev.location && ev.location.toLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }, [upcomingEvents, typeFilter, searchTerm]);

  const filteredHistory = useMemo(() => {
    return historyEvents.filter(ev => {
      const matchesType = typeFilter === 'all' || ev.event_type === typeFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        ev.title.toLowerCase().includes(term) ||
        (ev.host_name && ev.host_name.toLowerCase().includes(term)) ||
        (ev.location && ev.location.toLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }, [historyEvents, typeFilter, searchTerm]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    return events.filter(e => e.event_date === dateKey);
  }, [selectedDate, events]);

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-6 h-6 text-[#028090] dark:text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-title text-gray-900 dark:text-white">
              ប្រតិទិនពុទ្ធសាសនា & កាលវិភាគបុណ្យ
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-battambang">
            ចន្ទគតិខ្មែរ ថ្ងៃសីល និងកាលវិភាគបុណ្យ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#028090] hover:bg-[#005F73] text-white font-battambang text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            កត់ត្រាកម្មវិធីបុណ្យ
          </button>
        </div>
      </div>

      {/* Approaching Events Alert Banner (លោតសារជូនដំណឹងជិតដល់ថ្ងៃ) */}
      {approachingAlerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-l-4 border-amber-500 bg-white dark:bg-slate-900 rounded-r-2xl border-y border-r border-gray-200/80 dark:border-slate-800 p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-battambang">
                  ការជូនដំណឹងកាលវិភាគជិតដល់ថ្ងៃ ({toKhmerNumber(approachingAlerts.length)})
                </span>
              </div>
              <div className="space-y-2">
                {approachingAlerts.map(({ event: ev, daysDiff }) => {
                  const lunar = calculateKhmerLunar(new Date(ev.event_date));
                  const isToday = daysDiff === 0;
                  const isTomorrow = daysDiff === 1;
                  return (
                    <div 
                      key={ev.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm border-b border-gray-100 dark:border-slate-800/80 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold font-battambang ${
                            isToday 
                              ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                              : isTomorrow 
                              ? 'text-amber-600 dark:text-amber-400' 
                              : 'text-teal-600 dark:text-teal-400'
                          }`}>
                            {isToday ? '• ថ្ងៃនេះ!' : isTomorrow ? '• ថ្ងៃស្អែក' : `• នៅសល់ ${toKhmerNumber(daysDiff)} ថ្ងៃទៀត`}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white font-battambang">
                            {ev.title}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400 font-battambang">
                            ({ev.event_type === 'devotee_invitation' ? 'ពុទ្ធបរិស័ទនិមន្ត' : 'បុណ្យក្នុងវត្ត'})
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-3 mt-0.5 flex-wrap font-battambang">
                          <span className="font-rajdhani">{ev.event_date}</span>
                          <span>• {lunar.lunarDayStr} ខែ{lunar.lunarMonthStr}</span>
                          {ev.event_time && <span className="font-rajdhani">• ម៉ោង {ev.event_time}</span>}
                          {ev.host_name && <span>• ម្ចាស់បុណ្យ: {ev.host_name}</span>}
                          {ev.location && <span>• ទីតាំង: {ev.location}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ev.phone && (
                          <a
                            href={`tel:${ev.phone}`}
                            className="inline-flex items-center gap-1 text-xs text-[#028090] dark:text-teal-400 font-rajdhani hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {ev.phone}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-battambang text-emerald-700 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          គូសថាចប់
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Tab Navigation Buttons */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-3 text-sm font-semibold font-battambang border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-[#028090] dark:border-teal-400 text-[#028090] dark:text-teal-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          កាលវិភាគជិតមកដល់
          <span className="text-xs font-rajdhani font-bold px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
            {upcomingEvents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 px-3 text-sm font-semibold font-battambang border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'border-[#028090] dark:border-teal-400 text-[#028090] dark:text-teal-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          ប្រតិទិនចន្ទគតិ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 text-sm font-semibold font-battambang border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-[#028090] dark:border-teal-400 text-[#028090] dark:text-teal-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          ប្រវត្តិកាលវិភាគបុណ្យ (កន្លងហួស)
          <span className="text-xs font-rajdhani font-bold px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
            {historyEvents.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UPCOMING SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          {/* Quick Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរកឈ្មោះបុណ្យ ម្ចាស់បុណ្យ ឬទីតាំង..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl font-battambang text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#028090]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-battambang whitespace-nowrap transition-colors cursor-pointer border ${
                  typeFilter === 'all'
                    ? 'border-[#028090] text-[#028090] dark:text-teal-400'
                    : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                ទាំងអស់ ({upcomingEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('devotee_invitation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-battambang whitespace-nowrap transition-colors cursor-pointer border ${
                  typeFilter === 'devotee_invitation'
                    ? 'border-[#028090] text-[#028090] dark:text-teal-400'
                    : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                ពុទ្ធបរិស័ទនិមន្ត
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('monastery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-battambang whitespace-nowrap transition-colors cursor-pointer border ${
                  typeFilter === 'monastery'
                    ? 'border-[#028090] text-[#028090] dark:text-teal-400'
                    : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                បុណ្យក្នុងវត្ត
              </button>
            </div>
          </div>

          {/* List of upcoming events */}
          {filteredUpcoming.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-8 sm:p-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="font-title text-base sm:text-lg text-gray-800 dark:text-slate-200 mb-1">
                មិនមានកាលវិភាគបុណ្យខាងមុខនៅឡើយទេ
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-battambang max-w-md mx-auto mb-4">
                នៅពេលមានពុទ្ធបរិស័ទនិមន្ត ឬមានកម្មវិធីបុណ្យក្នុងវត្ត លោកអ្នកអាចកត់ត្រាទុកដើម្បីងាយស្រួលរំលឹក និងគ្រប់គ្រង។
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#028090] hover:bg-[#005F73] text-white font-battambang text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                កត់ត្រាកម្មវិធីបុណ្យថ្មី
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUpcoming.map((ev) => {
                const lunar = calculateKhmerLunar(new Date(ev.event_date));
                const parts = ev.event_date.split('-');
                const evTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                const diffDays = Math.ceil((evTime - todayStart) / (1000 * 60 * 60 * 24));
                const isToday = diffDays === 0;
                const isTomorrow = diffDays === 1;

                return (
                  <div
                    key={ev.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-[#028090]/50 transition-colors shadow-sm"
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-semibold text-[#028090] dark:text-teal-400 font-battambang">
                              {ev.event_type === 'devotee_invitation' ? 'ពុទ្ធបរិស័ទនិមន្ត' : 'បុណ្យក្នុងវត្ត'}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className={`text-xs font-bold font-battambang ${
                              isToday 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : isTomorrow 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : 'text-gray-600 dark:text-slate-400'
                            }`}>
                              {isToday ? 'ថ្ងៃនេះ' : isTomorrow ? 'ថ្ងៃស្អែក' : `នៅសល់ ${toKhmerNumber(diffDays)} ថ្ងៃ`}
                            </span>
                          </div>
                          <h3 className="font-title text-base sm:text-lg text-gray-900 dark:text-white leading-snug">
                            {ev.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ev)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="កែប្រែ"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="លុប"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Date & Lunar Time Info */}
                      <div className="border-t border-b border-gray-100 dark:border-slate-800/80 py-2.5 my-3 space-y-1.5 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-gray-800 dark:text-slate-200">
                          <CalendarIcon className="w-4 h-4 text-[#028090] dark:text-teal-400 shrink-0" />
                          <span className="font-rajdhani font-semibold">{ev.event_date}</span>
                          <span className="text-gray-500 font-battambang">
                            ({lunar.dayOfWeekKhmer}, {lunar.lunarDayStr} ខែ{lunar.lunarMonthStr} ឆ្នាំ{lunar.lunarYearStr})
                          </span>
                        </div>

                        {ev.event_time && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="font-battambang">វេលាម៉ោង</span>
                            <span className="font-rajdhani font-semibold">{ev.event_time}</span>
                          </div>
                        )}

                        {ev.monks_count && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span className="font-battambang">និមន្តព្រះសង្ឃ:</span>
                            <span className="font-rajdhani font-bold">{ev.monks_count}</span>
                            <span className="font-battambang">អង្គ</span>
                          </div>
                        )}
                      </div>

                      {/* Devotee Host / Location Info */}
                      <div className="space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-slate-400 font-battambang">
                        {ev.host_name && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">ម្ចាស់បុណ្យ:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{ev.host_name}</span>
                          </div>
                        )}
                        {ev.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <a href={`tel:${ev.phone}`} className="font-rajdhani font-medium text-[#028090] dark:text-teal-400 hover:underline">
                              {ev.phone}
                            </a>
                          </div>
                        )}
                        {ev.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                        {ev.description && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 italic bg-gray-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom action to mark complete */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-battambang">
                        {lunar.isSeil ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">• ត្រូវនឹង {lunar.seilTitle}</span>
                        ) : (
                          <span>ថ្ងៃធម្មតា</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(ev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-battambang text-emerald-700 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        គូសសម្គាល់ថាចប់
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE BUDDHIST CALENDAR VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Top Lunar Highlights Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-battambang">
                  ចន្ទគតិថ្ងៃនេះ
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-title text-gray-900 dark:text-white">
                ថ្ងៃ{selectedLunar.dayOfWeekKhmer} {selectedLunar.lunarDayStr} ខែ{selectedLunar.lunarMonthStr} ឆ្នាំ{selectedLunar.lunarYearStr}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-battambang">
                ពុទ្ធសករាជ {toKhmerNumber(selectedLunar.buddhistEra)} • សុរិយគតិ {selectedLunar.solarDateStr}
              </p>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
              <span className="text-xs text-gray-500 dark:text-slate-400 font-battambang block mb-0.5">
                ថ្ងៃសីលបន្ទាប់៖
              </span>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 font-battambang block">
                {nextSeil.lunar.seilTitle}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-battambang">
                {nextSeil.daysRemaining === 0 
                  ? '• ថ្ងៃនេះជាថ្ងៃសីល!' 
                  : nextSeil.daysRemaining === 1 
                  ? '• ថ្ងៃស្អែកជាថ្ងៃសីល' 
                  : `• នៅសល់ ${toKhmerNumber(nextSeil.daysRemaining)} ថ្ងៃទៀត`}
              </span>
            </div>
          </div>

          {/* Calendar Navigation Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-title text-gray-900 dark:text-white">
                ខែ{KHMER_SOLAR_MONTHS[currentMonth]} ឆ្នាំ <span className="font-rajdhani">{currentYear}</span>
              </h2>
              <span className="text-xs text-gray-400 font-battambang">
                (ព.ស. {toKhmerNumber(currentYear + 544)})
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ខែមុន"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 text-xs font-semibold font-battambang text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ថ្ងៃនេះ
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ខែបន្ទាប់"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Calendar Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Weekday Names */}
            <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-slate-800 text-center py-2.5 text-xs font-semibold text-gray-500 dark:text-slate-400 font-battambang bg-gray-50/50 dark:bg-slate-900/50">
              <div className="text-rose-600 dark:text-rose-400">អាទិត្យ</div>
              <div>ច័ន្ទ</div>
              <div>អង្គារ</div>
              <div>ពុធ</div>
              <div>ព្រហស្បតិ៍</div>
              <div>សុក្រ</div>
              <div className="text-[#028090] dark:text-teal-400">សៅរ៍</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-slate-800/60">
              {calendarDays.map((cell, idx) => {
                const isSelected = 
                  selectedDate.getFullYear() === cell.date.getFullYear() &&
                  selectedDate.getMonth() === cell.date.getMonth() &&
                  selectedDate.getDate() === cell.date.getDate();

                const isCurrentDate = 
                  today.getFullYear() === cell.date.getFullYear() &&
                  today.getMonth() === cell.date.getMonth() &&
                  today.getDate() === cell.date.getDate();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-[76px] sm:min-h-[96px] p-1.5 sm:p-2 flex flex-col justify-between text-left transition-colors relative cursor-pointer ${
                      cell.isCurrentMonth
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-gray-50/40 dark:bg-slate-950/40 opacity-50'
                    } ${
                      isSelected ? 'ring-2 ring-inset ring-[#028090]' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-rajdhani font-semibold ${
                        isCurrentDate 
                          ? 'text-white bg-[#028090] px-1.5 rounded-md' 
                          : cell.date.getDay() === 0 
                          ? 'text-rose-600 dark:text-rose-400' 
                          : 'text-gray-800 dark:text-slate-200'
                      }`}>
                        {cell.date.getDate()}
                      </span>

                      {/* Holy day indicator (no background box) */}
                      {cell.lunar.isSeil && (
                        <span 
                          title={cell.lunar.seilTitle || 'ថ្ងៃសីល'}
                          className="text-amber-500 font-bold text-[11px] sm:text-xs font-battambang"
                        >
                          សីល
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      {/* Lunar Day (e.g. ១៥ កើត) */}
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-battambang leading-tight truncate">
                        {cell.lunar.lunarDayStr}
                      </p>

                      {/* Holiday Badge (e.g. បិណ្ឌ ១, ភ្ជុំបិណ្ឌ) */}
                      {cell.lunar.shortHoliday && (
                        <p className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-battambang truncate font-semibold">
                          {cell.lunar.shortHoliday}
                        </p>
                      )}

                      {/* Event Dots / Summary */}
                      {cell.events.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="w-2 h-2 rounded-full bg-[#028090] shrink-0" />
                          <span className="text-[9px] sm:text-[10px] text-[#028090] dark:text-teal-400 font-battambang font-medium truncate">
                            {cell.events[0].title}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details of Selected Date */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-title text-base sm:text-lg text-gray-900 dark:text-white">
                    ព័ត៌មានថ្ងៃ {selectedLunar.dayOfWeekKhmer} ទី <span className="font-rajdhani">{selectedDate.getDate()}</span> ខែ{KHMER_SOLAR_MONTHS[selectedDate.getMonth()]} ឆ្នាំ <span className="font-rajdhani">{selectedDate.getFullYear()}</span>
                  </h3>
                  {selectedLunar.isSeil && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-battambang">
                      ({selectedLunar.seilTitle})
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-battambang">
                  {selectedLunar.lunarDayStr} ខែ{selectedLunar.lunarMonthStr} ឆ្នាំ{selectedLunar.lunarYearStr} ព.ស. {toKhmerNumber(selectedLunar.buddhistEra)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const y = selectedDate.getFullYear();
                  const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const d = String(selectedDate.getDate()).padStart(2, '0');
                  handleOpenAddModal(`${y}-${m}-${d}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-battambang transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#028090] dark:text-teal-400" />
                កត់ត្រាកម្មវិធីថ្ងៃនេះ
              </button>
            </div>

            {/* Events on this selected date */}
            {selectedDateEvents.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-400 dark:text-slate-500 font-battambang py-2">
                គ្មានកម្មវិធីបុណ្យទេ
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map(ev => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#028090] dark:text-teal-400 font-semibold font-battambang">
                          {ev.event_type === 'devotee_invitation' ? 'ពុទ្ធបរិស័ទនិមន្ត' : 'បុណ្យក្នុងវត្ត'}
                        </span>
                        {ev.event_time && (
                          <span className="text-xs text-gray-500 font-rajdhani">
                            • ម៉ោង {ev.event_time}
                          </span>
                        )}
                      </div>
                      <h4 className="font-title text-sm sm:text-base text-gray-900 dark:text-white mt-0.5">
                        {ev.title}
                      </h4>
                      <div className="text-xs text-gray-500 dark:text-slate-400 font-battambang flex items-center gap-3 mt-1 flex-wrap">
                        {ev.host_name && <span>ម្ចាស់បុណ្យ: {ev.host_name}</span>}
                        {ev.phone && <span className="font-rajdhani">ទូរស័ព្ទ: {ev.phone}</span>}
                        {ev.location && <span>ទីតាំង: {ev.location}</span>}
                        {ev.monks_count && <span>ព្រះសង្ឃ: {ev.monks_count} អង្គ</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(ev)}
                        className="px-2.5 py-1 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-battambang border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer"
                      >
                        កែប្រែ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EVENT HISTORY (កាលវិភាគដែលបានកន្លងហួសស្វ័យប្រវត្តិ) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-title text-base sm:text-lg text-gray-900 dark:text-white">
                  ប្រវត្តិកាលវិភាគបុណ្យ & ការនិមន្តកន្លងផុត
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-battambang">
                  រាល់កម្មវិធីដែលបានហួសកាលបរិច្ឆេទកំណត់ ត្រូវបានបញ្ជូនមករក្សាទុកក្នុងប្រវត្តិនេះដោយស្វ័យប្រវត្តិ
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400 font-battambang block">
                  សរុបកម្មវិធីកន្លងផុត
                </span>
                <span className="text-xl sm:text-2xl font-bold font-rajdhani text-gray-900 dark:text-white">
                  {historyEvents.length}
                </span>
              </div>
            </div>

            {/* Search within history */}
            <div className="relative w-full sm:w-80 mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរកក្នុងប្រវត្តិបុណ្យ..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-battambang text-gray-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* History Table / Cards */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-battambang text-sm">
                មិនទាន់មានទិន្នន័យប្រវត្តិបុណ្យកន្លងផុតនៅឡើយទេ
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredHistory.map(ev => {
                  const lunar = calculateKhmerLunar(new Date(ev.event_date));
                  return (
                    <div
                      key={ev.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 font-battambang">
                            {ev.event_type === 'devotee_invitation' ? 'ពុទ្ធបរិស័ទនិមន្ត' : 'បុណ្យក្នុងវត្ត'}
                          </span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-battambang">
                            • បានកន្លងផុត
                          </span>
                        </div>
                        <h4 className="font-title text-sm sm:text-base text-gray-900 dark:text-white">
                          {ev.title}
                        </h4>
                        <div className="text-xs text-gray-500 dark:text-slate-400 font-battambang flex items-center gap-3 mt-1 flex-wrap">
                          <span className="font-rajdhani">{ev.event_date}</span>
                          <span>• {lunar.lunarDayStr} ខែ{lunar.lunarMonthStr}</span>
                          {ev.host_name && <span>• ម្ចាស់បុណ្យ: {ev.host_name}</span>}
                          {ev.location && <span>• ទីតាំង: {ev.location}</span>}
                          {ev.monks_count && <span>• ព្រះសង្ឃ: {ev.monks_count} អង្គ</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-battambang text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer"
                          title="ដាក់ត្រឡប់ទៅកាលវិភាគធម្មតាវិញ"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          ដាក់វិញ
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 cursor-pointer"
                            title="លុប"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT EVENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-title text-base sm:text-lg text-gray-900 dark:text-white">
                  {editingEvent ? 'កែប្រែកាលវិភាគបុណ្យ' : 'កត់ត្រាកម្មវិធីបុណ្យ / ការនិមន្តថ្មី'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEvent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto font-battambang">
                {formError && (
                  <div className="p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl">
                    {formError}
                  </div>
                )}

                {/* Event Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    ប្រភេទកម្មវិធី *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType('devotee_invitation')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer text-center ${
                        formType === 'devotee_invitation'
                          ? 'border-[#028090] text-[#028090] dark:text-teal-400'
                          : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      ពុទ្ធបរិស័ទនិមន្ត
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('monastery')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer text-center ${
                        formType === 'monastery'
                          ? 'border-[#028090] text-[#028090] dark:text-teal-400'
                          : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      បុណ្យក្នុងវត្ត
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    ឈ្មោះកម្មវិធី ឬ ពិធីបុណ្យ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="ឧ. បុណ្យចម្រើនព្រះបរិត្ត, ឆាន់ភត្ត, បុណ្យផ្កាប្រាក់..."
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#028090]"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      កាលបរិច្ឆេទ *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-rajdhani bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#028090]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      វេលាម៉ោង
                    </label>
                    <input
                      type="time"
                      value={formTime}
                      onChange={e => setFormTime(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-rajdhani bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#028090]"
                    />
                  </div>
                </div>

                {/* Host name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      ឈ្មោះម្ចាស់បុណ្យ / ពុទ្ធបរិស័ទ
                    </label>
                    <input
                      type="text"
                      value={formHostName}
                      onChange={e => setFormHostName(e.target.value)}
                      placeholder="ឧ. ឧបាសក ម៉ៅ វុទ្ធី"
                      className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#028090]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      លេខទូរស័ព្ទទំនាក់ទំនង
                    </label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="012 345 678"
                      className="w-full px-3.5 py-2 text-sm font-rajdhani bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#028090]"
                    />
                  </div>
                </div>

                {/* Location & Monks count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      ទីកន្លែង / អាសយដ្ឋាន
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                      placeholder="ឧ. ភូមិទ្រាលើ ឬ សាលាឆាន់វត្ត"
                      className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#028090]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      ចំនួនព្រះសង្ឃនិមន្ត (អង្គ)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={formMonksCount}
                      onChange={e => setFormMonksCount(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3.5 py-2 text-sm font-rajdhani bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#028090]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    កំណត់សម្គាល់បន្ថែម
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="បញ្ជាក់ព័ត៌មានលម្អិតផ្សេងៗ..."
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#028090]"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 text-xs font-semibold bg-[#028090] hover:bg-[#005F73] text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {modalLoading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
