import { calculateKhmerLunar } from '../src/lib/khmerCalendar';
import type { PushNotificationPayload } from './webPush';

export interface ReminderEventRow {
  id: string;
  title: string;
  event_type?: string;
  event_date: string; // YYYY-MM-DD
  event_time?: string;
  location?: string;
  is_completed?: boolean;
}

const KHMER_SOLAR_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
];

/**
 * Returns YYYY-MM-DD and Date object anchored to Cambodia local time (UTC+7).
 */
export function getCambodiaDateOffset(dayOffset: number, baseNow: Date = new Date()) {
  const utcMs = baseNow.getTime() + baseNow.getTimezoneOffset() * 60000;
  const cambodiaNow = new Date(utcMs + 7 * 60 * 60000);
  const target = new Date(
    cambodiaNow.getFullYear(),
    cambodiaNow.getMonth(),
    cambodiaNow.getDate() + dayOffset
  );
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return {
    date: target,
    dateKey: `${y}-${m}-${d}`,
    label: `ទី ${target.getDate()} ${KHMER_SOLAR_MONTHS[target.getMonth()]}`,
  };
}

/**
 * Builds concise Khmer Lock Screen notification payloads for Today and Tomorrow
 * from both Khmer Lunar Seil/Holidays and saved Monastery Events.
 */
export function buildUpcomingReminderPayloads(
  events: ReminderEventRow[],
  options: { includeSeil?: boolean; includeEvents?: boolean; now?: Date } = {}
): PushNotificationPayload[] {
  const { includeSeil = true, includeEvents = true, now = new Date() } = options;
  const todayInfo = getCambodiaDateOffset(0, now);
  const tomorrowInfo = getCambodiaDateOffset(1, now);

  const payloads: PushNotificationPayload[] = [];

  // 1. Saved Monastery Events (Today & Tomorrow)
  if (includeEvents && Array.isArray(events)) {
    const activeEvents = events.filter((e) => !e.is_completed);

    const todayEvents = activeEvents.filter((e) => e.event_date === todayInfo.dateKey);
    const tomorrowEvents = activeEvents.filter((e) => e.event_date === tomorrowInfo.dateKey);

    for (const ev of todayEvents) {
      const lunar = calculateKhmerLunar(todayInfo.date);
      const timePart = ev.event_time ? ` · ម៉ោង ${ev.event_time}` : '';
      const locPart = ev.location ? ` · ${ev.location}` : '';
      payloads.push({
        title: `ថ្ងៃនេះ៖ ${ev.title}`,
        body: `${todayInfo.label} (${lunar.lunarDayStr} ខែ${lunar.lunarMonthStr})${timePart}${locPart}`,
        tag: `wsd-event-today-${ev.id}`,
        url: '/?open=calendar',
      });
    }

    for (const ev of tomorrowEvents) {
      const lunar = calculateKhmerLunar(tomorrowInfo.date);
      const timePart = ev.event_time ? ` · ម៉ោង ${ev.event_time}` : '';
      payloads.push({
        title: `ស្អែក៖ ${ev.title}`,
        body: `រំលឹកមុន ១ ថ្ងៃ · ${tomorrowInfo.label} (${lunar.lunarDayStr} ខែ${lunar.lunarMonthStr})${timePart}`,
        tag: `wsd-event-tomorrow-${ev.id}`,
        url: '/?open=calendar',
      });
    }
  }

  // 2. Khmer Lunar Seil & Major Buddhist Holidays (Today & Tomorrow)
  if (includeSeil) {
    const todayLunar = calculateKhmerLunar(todayInfo.date);
    if (todayLunar.isSeil || todayLunar.holidayName) {
      const title = todayLunar.holidayName
        ? `ថ្ងៃនេះ៖ ${todayLunar.holidayName}`
        : `ថ្ងៃនេះជាថ្ងៃសីល (${todayLunar.lunarDayStr})`;
      payloads.push({
        title,
        body: `${todayInfo.label} · ${todayLunar.lunarDayStr} ខែ${todayLunar.lunarMonthStr}`,
        tag: `wsd-seil-today-${todayInfo.dateKey}`,
        url: '/?open=calendar',
      });
    }

    const tomorrowLunar = calculateKhmerLunar(tomorrowInfo.date);
    if (tomorrowLunar.isSeil || tomorrowLunar.holidayName) {
      const title = tomorrowLunar.holidayName
        ? `ស្អែក៖ ${tomorrowLunar.holidayName}`
        : `ស្អែកជាថ្ងៃសីល (${tomorrowLunar.lunarDayStr})`;
      payloads.push({
        title,
        body: `រំលឹកមុន ១ ថ្ងៃ · ${tomorrowInfo.label} (${tomorrowLunar.lunarDayStr} ខែ${tomorrowLunar.lunarMonthStr})`,
        tag: `wsd-seil-tomorrow-${tomorrowInfo.dateKey}`,
        url: '/?open=calendar',
      });
    }
  }

  return payloads;
}
