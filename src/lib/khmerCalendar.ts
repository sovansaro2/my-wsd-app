import { fromGregorian, MoonPhase } from '@thyrith/momentkh';

export interface KhmerLunarDate {
  solarDate: Date;
  solarDateStr: string; // YYYY-MM-DD
  dayOfWeekKhmer: string;
  lunarDay: number; // 1 to 15
  isWaxing: boolean; // true = កើត, false = រោច
  lunarDayStr: string; // e.g. "១៥ កើត" or "៨ រោច"
  lunarMonthStr: string; // e.g. "ពិសាខ", "ភទ្របទ"
  lunarYearStr: string; // e.g. "មមី"
  buddhistEra: number; // e.g. 2570
  isSeil: boolean; // ថ្ងៃសីល
  seilTitle: string | null; // e.g. "ថ្ងៃសីល (១៥ កើត)"
  holidayName: string | null; // e.g. "ពិសាខបូជា", "ភ្ជុំបិណ្ឌ", "បិណ្ឌ ១"
  shortHoliday: string | null; // e.g. "បិណ្ឌ ១", "ភ្ជុំបិណ្ឌ" (very short for calendar grid cell)
}

const KHMER_NUMBERS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export const toKhmerNumber = (num: number | string): string => {
  return num
    .toString()
    .split('')
    .map(digit => (KHMER_NUMBERS[parseInt(digit, 10)] !== undefined ? KHMER_NUMBERS[parseInt(digit, 10)] : digit))
    .join('');
};

export function calculateKhmerLunar(date: Date): KhmerLunarDate {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1 to 12
  const day = date.getDate(); // 1 to 31

  const res = fromGregorian(year, month, day);
  const kh = res.khmer;

  const isWaxing = kh.moonPhase === MoonPhase.Waxing;
  const lunarDay = kh.day;
  const lunarDayStr = `${toKhmerNumber(lunarDay)} ${isWaxing ? 'កើត' : 'រោច'}`;
  const lunarMonthStr = kh.monthName;
  const lunarYearStr = kh.animalYearName;
  const buddhistEra = kh.beYear;
  const dayOfWeekKhmer = kh.dayOfWeekName;

  // Check if today is ថ្ងៃសីល (Buddhist Holy Day)
  let isSeil = false;
  let seilTitle: string | null = null;

  if (isWaxing) {
    if (lunarDay === 8) {
      isSeil = true;
      seilTitle = 'ថ្ងៃសីល (៨ កើត)';
    } else if (lunarDay === 15) {
      isSeil = true;
      seilTitle = 'ថ្ងៃសីល (១៥ កើត)';
    }
  } else {
    if (lunarDay === 8) {
      isSeil = true;
      seilTitle = 'ថ្ងៃសីល (៨ រោច)';
    } else if (lunarDay === 15) {
      isSeil = true;
      seilTitle = 'ថ្ងៃសីល (១៥ រោច ដាច់ខែ)';
    } else if (lunarDay === 14) {
      // Check if next day transitions to 1 Waxing (meaning this month ends at 14 Roch)
      const nextDate = new Date(year, month - 1, day + 1);
      const nextKh = fromGregorian(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate()).khmer;
      if (nextKh.moonPhase === MoonPhase.Waxing && nextKh.day === 1) {
        isSeil = true;
        seilTitle = 'ថ្ងៃសីល (១៤ រោច ដាច់ខែ)';
      }
    }
  }

  // Major Buddhist Festivals & Short cell tags
  let holidayName: string | null = null;
  let shortHoliday: string | null = null;

  // មាឃបូជា: 15 កើត ខែមាឃ
  if (lunarMonthStr === 'មាឃ' && isWaxing && lunarDay === 15) {
    holidayName = 'បុណ្យមាឃបូជា';
    shortHoliday = 'មាឃបូជា';
  }
  // ពិសាខបូជា: 15 កើត ខែពិសាខ
  else if (lunarMonthStr === 'ពិសាខ' && isWaxing && lunarDay === 15) {
    holidayName = 'បុណ្យពិសាខបូជា';
    shortHoliday = 'ពិសាខបូជា';
  }
  // ចូលព្រះវស្សា: 1 រោច ខែអាសាឍ ឬ ទុតិយាសាឍ
  else if ((lunarMonthStr === 'អាសាឍ' || lunarMonthStr === 'ទុតិយាសាឍ') && !isWaxing && lunarDay === 1) {
    holidayName = 'បុណ្យចូលព្រះវស្សា';
    shortHoliday = 'ចូលវស្សា';
  }
  // រដូវភ្ជុំបិណ្ឌ: 1 ដល់ 15 រោច ខែភទ្របទ
  else if (lunarMonthStr === 'ភទ្របទ' && !isWaxing) {
    if (lunarDay >= 1 && lunarDay <= 14) {
      holidayName = `កាន់បិណ្ឌ ${toKhmerNumber(lunarDay)}`;
      shortHoliday = `បិណ្ឌ ${toKhmerNumber(lunarDay)}`;
    } else if (lunarDay === 15) {
      holidayName = 'បុណ្យភ្ជុំបិណ្ឌធំ';
      shortHoliday = 'ភ្ជុំបិណ្ឌ';
    }
  }
  // ចេញព្រះវស្សា: 15 កើត ខែអស្សុជ
  else if (lunarMonthStr === 'អស្សុជ' && isWaxing && lunarDay === 15) {
    holidayName = 'បុណ្យចេញព្រះវស្សា';
    shortHoliday = 'ចេញវស្សា';
  }
  // អុំទូក & សំពះព្រះខែ: 14 និង 15 កើត ខែកត្តិក
  else if (lunarMonthStr === 'កត្តិក' && isWaxing && (lunarDay === 14 || lunarDay === 15)) {
    holidayName = 'បុណ្យអុំទូក & សំពះព្រះខែ';
    shortHoliday = 'សំពះព្រះខែ';
  }

  const yStr = String(year);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  const solarDateStr = `${yStr}-${mStr}-${dStr}`;

  return {
    solarDate: date,
    solarDateStr,
    dayOfWeekKhmer,
    lunarDay,
    isWaxing,
    lunarDayStr,
    lunarMonthStr,
    lunarYearStr,
    buddhistEra,
    isSeil,
    seilTitle,
    holidayName,
    shortHoliday
  };
}

/**
 * Finds the next upcoming ថ្ងៃសីល (Buddhist Holy Day) from a given date
 */
export function getNextSeilDate(fromDate: Date = new Date()): { date: Date; lunar: KhmerLunarDate; daysRemaining: number } {
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 32; i++) {
    const target = new Date(current.getFullYear(), current.getMonth(), current.getDate() + i);
    const lunar = calculateKhmerLunar(target);
    if (lunar.isSeil) {
      return {
        date: target,
        lunar,
        daysRemaining: i
      };
    }
  }

  const fallback = new Date(current);
  return {
    date: fallback,
    lunar: calculateKhmerLunar(fallback),
    daysRemaining: 0
  };
}
