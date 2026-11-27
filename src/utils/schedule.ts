import { MarketDefinition } from '../types/lottery';

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

const THAI_WEEKDAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export interface BangkokTimeParts {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  dayOfWeek: number; // 0 (Sun) .. 6 (Sat)
  hour: number;
  minute: number;
  second: number;
  dateKey: string; // YYYY-MM-DD
  timeLabel: string; // HH:mm:ss
  thaiShortDate: string; // e.g. "27 พ.ย. 69"
  totalSecondsOfDay: number;
}

export function getBangkokTimeParts(date: Date): BangkokTimeParts {
  const bkk = new Date(date.getTime() + BANGKOK_OFFSET_MS);
  const year = bkk.getUTCFullYear();
  const month = bkk.getUTCMonth() + 1;
  const day = bkk.getUTCDate();
  const dayOfWeek = bkk.getUTCDay();
  const hour = bkk.getUTCHours();
  const minute = bkk.getUTCMinutes();
  const second = bkk.getUTCSeconds();

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const dateKey = `${year}-${pad2(month)}-${pad2(day)}`;
  const timeLabel = `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
  const thaiYearShort = (year + 543) % 100;
  const thaiShortDate = `${day} ${THAI_MONTHS_SHORT[month - 1]} ${thaiYearShort}`;
  const totalSecondsOfDay = hour * 3600 + minute * 60 + second;

  return {
    year,
    month,
    day,
    dayOfWeek,
    hour,
    minute,
    second,
    dateKey,
    timeLabel,
    thaiShortDate,
    totalSecondsOfDay,
  };
}

export function parseDrawTime(drawTime: string): {
  hour: number;
  minute: number;
  totalSecondsOfDay: number;
} {
  const match = drawTime.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return { hour: 0, minute: 0, totalSecondsOfDay: 0 };
  }
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return {
    hour,
    minute,
    totalSecondsOfDay: hour * 3600 + minute * 60,
  };
}

export function getMarketDrawDays(market: MarketDefinition): number[] {
  if (market.id === 'lao-pattana') {
    return [1, 3, 5]; // จันทร์, พุธ, ศุกร์
  }
  if (market.category === 'stock_regular') {
    return [1, 2, 3, 4, 5]; // จันทร์ - ศุกร์
  }
  // หุ้น VIP และหวยฮานอยออกทุกวัน
  return [0, 1, 2, 3, 4, 5, 6];
}

export function hasDrawForRoundDate(
  market: MarketDefinition,
  bangkokDateKey: string
): boolean {
  return market.draws.some((draw) => {
    const d = new Date(draw.dateISO);
    if (Number.isNaN(d.getTime())) return false;
    return getBangkokTimeParts(d).dateKey === bangkokDateKey;
  });
}

export function findMarketsDueAtExactTransition(
  markets: MarketDefinition[],
  prevNow: Date,
  currNow: Date
): MarketDefinition[] {
  const prevBkk = getBangkokTimeParts(prevNow);
  const currBkk = getBangkokTimeParts(currNow);

  return markets.filter((market) => {
    const drawDays = getMarketDrawDays(market);
    if (!drawDays.includes(currBkk.dayOfWeek)) {
      return false;
    }
    if (hasDrawForRoundDate(market, currBkk.dateKey)) {
      return false;
    }

    const scheduled = parseDrawTime(market.drawTime);

    if (prevBkk.dateKey === currBkk.dateKey) {
      return (
        prevBkk.totalSecondsOfDay < scheduled.totalSecondsOfDay &&
        currBkk.totalSecondsOfDay >= scheduled.totalSecondsOfDay
      );
    }

    // Midnight rollover in Bangkok time (e.g. 23:59:59 -> 00:00:00)
    return currBkk.totalSecondsOfDay >= scheduled.totalSecondsOfDay;
  });
}

export function formatDurationThai(secondsRemaining: number): string {
  const safe = Math.max(0, Math.floor(secondsRemaining));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
}

export interface MarketRoundStatus {
  state: 'announced_today' | 'waiting_today' | 'passed_today' | 'next_draw_day';
  label: string;
  countdownSeconds: number | null;
}

export function getMarketRoundStatus(
  market: MarketDefinition,
  now: Date
): MarketRoundStatus {
  const bkk = getBangkokTimeParts(now);
  const scheduled = parseDrawTime(market.drawTime);
  const drawDays = getMarketDrawDays(market);

  if (hasDrawForRoundDate(market, bkk.dateKey)) {
    return {
      state: 'announced_today',
      label: `แจ้งผลรอบวันนี้แล้ว (${market.drawTime})`,
      countdownSeconds: null,
    };
  }

  if (drawDays.includes(bkk.dayOfWeek)) {
    if (bkk.totalSecondsOfDay < scheduled.totalSecondsOfDay) {
      const diff = scheduled.totalSecondsOfDay - bkk.totalSecondsOfDay;
      return {
        state: 'waiting_today',
        label: `รอแจ้งผลรอบ ${market.drawTime} (อีก ${formatDurationThai(diff)})`,
        countdownSeconds: diff,
      };
    }

    return {
      state: 'passed_today',
      label: `ผ่านเวลาออกผล ${market.drawTime} แล้ว (กรอกผลจริงได้ทันที)`,
      countdownSeconds: null,
    };
  }

  // Find next valid draw day
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (bkk.dayOfWeek + offset) % 7;
    if (drawDays.includes(nextDay)) {
      const dayLabel =
        offset === 1 ? 'พรุ่งนี้' : `วัน${THAI_WEEKDAYS_SHORT[nextDay]}`;
      const diff =
        (24 * 3600 - bkk.totalSecondsOfDay) +
        (offset - 1) * 24 * 3600 +
        scheduled.totalSecondsOfDay;
      return {
        state: 'next_draw_day',
        label: `รอบถัดไป ${dayLabel} ${market.drawTime}`,
        countdownSeconds: diff,
      };
    }
  }

  return {
    state: 'waiting_today',
    label: `เวลาออกผล ${market.drawTime}`,
    countdownSeconds: null,
  };
}

export function getNextUpcomingMarket(
  markets: MarketDefinition[],
  now: Date
): { market: MarketDefinition; countdownSeconds: number } | null {
  let best: { market: MarketDefinition; countdownSeconds: number } | null = null;

  for (const market of markets) {
    const status = getMarketRoundStatus(market, now);
    if (
      status.state === 'waiting_today' &&
      status.countdownSeconds !== null
    ) {
      if (!best || status.countdownSeconds < best.countdownSeconds) {
        best = { market, countdownSeconds: status.countdownSeconds };
      }
    }
  }

  if (best) return best;

  for (const market of markets) {
    const status = getMarketRoundStatus(market, now);
    if (status.countdownSeconds !== null) {
      if (!best || status.countdownSeconds < best.countdownSeconds) {
        best = { market, countdownSeconds: status.countdownSeconds };
      }
    }
  }

  return best;
}
