import { calculateKhmerLunar, KhmerLunarDate, toKhmerNumber } from './khmerCalendar';
import type { MonasteryEvent } from '../types/calendar';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function escapeICS(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatDateTimeLocal(dateStr: string, timeStr?: string, addHours = 0): string {
  const [yStr, mStr, dStr] = dateStr.split('-');
  const y = parseInt(yStr, 10) || new Date().getFullYear();
  const m = parseInt(mStr, 10) || 1;
  const d = parseInt(dStr, 10) || 1;

  let hour = 7;
  let minute = 0;
  if (timeStr && /^\d{1,2}:\d{2}/.test(timeStr)) {
    const [h, min] = timeStr.split(':');
    hour = Math.min(23, Math.max(0, parseInt(h, 10) || 7));
    minute = Math.min(59, Math.max(0, parseInt(min, 10) || 0));
  }

  const dt = new Date(y, m - 1, d, hour + addHours, minute, 0);
  return `${dt.getFullYear()}${pad2(dt.getMonth() + 1)}${pad2(dt.getDate())}T${pad2(dt.getHours())}${pad2(dt.getMinutes())}00`;
}

function formatUtcStamp(date: Date = new Date()): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

const PHNOM_PENH_VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Phnom_Penh',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0700',
  'TZOFFSETTO:+0700',
  'TZNAME:+07',
  'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n');

function buildVEventBlock(params: {
  uid: string;
  title: string;
  dateStr: string;
  timeStr?: string;
  location?: string;
  description: string;
}): string {
  const dtStart = formatDateTimeLocal(params.dateStr, params.timeStr, 0);
  const dtEnd = formatDateTimeLocal(params.dateStr, params.timeStr, 2);
  const dtStamp = formatUtcStamp();

  return [
    'BEGIN:VEVENT',
    `UID:${params.uid}@watsnaydouch.site`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Phnom_Penh:${dtStart}`,
    `DTEND;TZID=Asia/Phnom_Penh:${dtEnd}`,
    `SUMMARY:${escapeICS(params.title)}`,
    params.location ? `LOCATION:${escapeICS(params.location)}` : 'LOCATION:វត្តស្នាយដួច',
    `DESCRIPTION:${escapeICS(params.description)}`,
    'STATUS:CONFIRMED',
    // Lock Screen Alarm 1: 1 day before
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(`ស្អែក៖ ${params.title}`)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    // Lock Screen Alarm 2: 30 minutes before
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(`ជិតដល់ម៉ោង៖ ${params.title}`)}`,
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

function triggerICSDownload(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function wrapVCalendar(vevents: string[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wat Snay Douch//Buddhist Calendar//KM',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ប្រតិទិនវត្តស្នាយដួច',
    'X-WR-TIMEZONE:Asia/Phnom_Penh',
    PHNOM_PENH_VTIMEZONE,
    ...vevents,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

/**
 * Exports a saved monastery event to an .ics file (opens in Apple Calendar / Google Calendar
 * with built-in 1-day-before and 30-min-before Lock Screen alerts).
 */
export function downloadEventICS(event: MonasteryEvent, lunar: KhmerLunarDate): void {
  const details: string[] = [
    `ចន្ទគតិ៖ ${lunar.lunarDayStr} ខែ${lunar.lunarMonthStr} ឆ្នាំ${lunar.lunarYearStr} ព.ស. ${toKhmerNumber(lunar.buddhistEra)}`,
    `ប្រភេទ៖ ${event.event_type === 'devotee_invitation' ? 'ពុទ្ធបរិស័ទនិមន្ត' : 'បុណ្យក្នុងវត្ត'}`,
  ];
  if (event.monks_count) details.push(`ចំនួនព្រះសង្ឃ៖ ${event.monks_count} អង្គ`);
  if (event.host_name) details.push(`ម្ចាស់ដើមបុណ្យ៖ ${event.host_name}`);
  if (event.phone) details.push(`ទូរស័ព្ទ៖ ${event.phone}`);
  if (event.description) details.push(`កំណត់សម្គាល់៖ ${event.description}`);

  const vevent = buildVEventBlock({
    uid: `event-${event.id || event.event_date}`,
    title: `${event.title} (${lunar.lunarDayStr})`,
    dateStr: event.event_date,
    timeStr: event.event_time,
    location: event.location,
    description: details.join('\n'),
  });

  triggerICSDownload(wrapVCalendar([vevent]), `wsd-${event.event_date}.ics`);
}

/**
 * Exports a Seil day or Buddhist traditional holiday directly to phone calendar.
 */
export function downloadLunarDayICS(dateStr: string, lunar: KhmerLunarDate): void {
  const title = lunar.holidayName || lunar.seilTitle || `ថ្ងៃ ${lunar.lunarDayStr} ខែ${lunar.lunarMonthStr}`;
  const description = [
    `${lunar.dayOfWeekKhmer} ${lunar.lunarDayStr} ខែ${lunar.lunarMonthStr} ឆ្នាំ${lunar.lunarYearStr}`,
    `ពុទ្ធសករាជ ${toKhmerNumber(lunar.buddhistEra)}`,
    lunar.seilTitle ? lunar.seilTitle : '',
  ]
    .filter(Boolean)
    .join('\n');

  const vevent = buildVEventBlock({
    uid: `lunar-${dateStr}`,
    title,
    dateStr,
    timeStr: '07:00',
    location: 'វត្តស្នាយដួច',
    description,
  });

  triggerICSDownload(wrapVCalendar([vevent]), `wsd-lunar-${dateStr}.ics`);
}

/**
 * Exports all upcoming saved events in a single .ics file.
 */
export function downloadUpcomingEventsICS(events: MonasteryEvent[]): void {
  if (!events.length) return;
  const blocks = events.map((ev) => {
    const parts = ev.event_date.split('-');
    const dateObj =
      parts.length === 3
        ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
        : new Date();
    const lunar = calculateKhmerLunar(dateObj);
    const details: string[] = [
      `ចន្ទគតិ៖ ${lunar.lunarDayStr} ខែ${lunar.lunarMonthStr} ព.ស. ${toKhmerNumber(lunar.buddhistEra)}`,
    ];
    if (ev.host_name) details.push(`ម្ចាស់ដើមបុណ្យ៖ ${ev.host_name}`);
    if (ev.phone) details.push(`ទូរស័ព្ទ៖ ${ev.phone}`);
    if (ev.description) details.push(ev.description);

    return buildVEventBlock({
      uid: `event-${ev.id || ev.event_date}`,
      title: `${ev.title} (${lunar.lunarDayStr})`,
      dateStr: ev.event_date,
      timeStr: ev.event_time,
      location: ev.location,
      description: details.join('\n'),
    });
  });

  triggerICSDownload(wrapVCalendar(blocks), 'wsd-upcoming-events.ics');
}
