import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CustomDatePicker({ value, onChange, placeholder = 'DD/MM/YYYY', disabled = false }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const [mode, setMode] = useState<'date' | 'year'>('date');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentYear = new Date().getFullYear();
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  const handleSelectDate = (day: number) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const renderGrid = () => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = value === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = new Date().toDateString() === new Date(viewYear, viewMonth, i).toDateString();
      
      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleSelectDate(i)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all
            ${isSelected 
              ? 'bg-[#1d70b8] text-white  shadow-md scale-110 z-10' 
              : isToday 
                ? 'bg-blue-50 text-[#1d70b8]  border border-blue-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:scale-110'
            }`}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const renderYears = () => {
    const years = [];
    for (let y = currentYear; y >= currentYear - 100; y--) {
      years.push(
        <button
          key={y}
          type="button"
          onClick={() => {
            setViewDate(new Date(y, viewMonth, 1));
            setMode('date');
          }}
          className={`py-2 px-2 rounded-lg text-[13px] text-center transition-colors ${viewYear === y ? 'bg-[#1d70b8] text-white  shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
        >
          {y}
        </button>
      );
    }
    return (
      <div className="grid grid-cols-4 gap-2 h-56 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
        {years}
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full rounded-md border px-3.5 py-2.5 text-[14px] flex items-center justify-between transition-colors ${disabled ? 'bg-transparent text-gray-500 cursor-not-allowed border-gray-200 dark:border-slate-700' : 'bg-transparent cursor-pointer ' + (isOpen ? 'border-[#1d70b8]' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300')}`}
      >
        <span className={value ? "text-gray-700 dark:text-white" : "text-gray-400"}>
          {value ? value.split('-').reverse().join('/') : placeholder}
        </span>
        <Calendar className={`w-4 h-4 transition-colors stroke-[1.5] ${isOpen ? 'text-[#1d70b8]' : 'text-gray-400'}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] top-full right-0 mt-2 w-[280px] max-w-[calc(100vw-32px)] bg-white dark:bg-slate-800 rounded-xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.18)] border border-gray-200 dark:border-slate-700 overflow-hidden origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100/80 dark:border-slate-700/80 bg-gray-50/50 dark:bg-slate-800/50">
              <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors focus:outline-none">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={() => setMode(mode === 'year' ? 'date' : 'year')}
                className=" text-[14px] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-1 rounded-lg transition-colors focus:outline-none"
              >
                {MONTHS[viewMonth]} {viewYear}
              </button>
              <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors focus:outline-none">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {mode === 'date' ? (
              <div className="p-3">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map(d => (
                    <div key={d} className="h-6 flex items-center justify-center text-[10px]  text-gray-400 dark:text-slate-500 uppercase r">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 place-items-center">
                  {renderGrid()}
                </div>
              </div>
            ) : (
              renderYears()
            )}
            
            {/* Footer Actions */}
            <div className="px-3 py-2.5 border-t border-gray-100 dark:border-slate-700 flex justify-between bg-gray-50/50 dark:bg-slate-800/50">
              <button 
                type="button" 
                onClick={() => {
                    onChange('');
                    setIsOpen(false);
                }}
                className="px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors focus:outline-none"
              >
                Clear
              </button>
              <button 
                type="button" 
                onClick={() => {
                    const today = new Date();
                    setViewDate(today);
                    const y = today.getFullYear();
                    const m = String(today.getMonth() + 1).padStart(2, '0');
                    const d = String(today.getDate()).padStart(2, '0');
                    onChange(`${y}-${m}-${d}`);
                    setIsOpen(false);
                }}
                className="px-3 py-1.5 text-[13px]  text-[#1d70b8] hover:text-[#16568d] transition-colors focus:outline-none"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
