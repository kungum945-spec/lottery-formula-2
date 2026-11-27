import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_MARKETS } from '../data/markets';
import {
  findMarketsDueAtExactTransition,
  getBangkokTimeParts,
  getMarketRoundStatus,
  getNextUpcomingMarket,
  hasDrawForRoundDate,
} from './schedule';

test('getBangkokTimeParts converts UTC timestamp accurately to Asia/Bangkok (UTC+7)', () => {
  // 2026-11-27 02:30:00 UTC === 2026-11-27 09:30:00 Bangkok
  const d = new Date('2026-11-27T02:30:00Z');
  const bkk = getBangkokTimeParts(d);
  assert.equal(bkk.dateKey, '2026-11-27');
  assert.equal(bkk.hour, 9);
  assert.equal(bkk.minute, 30);
  assert.equal(bkk.second, 0);
  assert.equal(bkk.dayOfWeek, 5); // Friday
});

test('findMarketsDueAtExactTransition triggers only when crossing scheduled drawTime on valid draw day', () => {
  const nikkeiAm = INITIAL_MARKETS.find((m) => m.id === 'nikkei-am')!;
  const laoPattana = INITIAL_MARKETS.find((m) => m.id === 'lao-pattana')!;

  // Friday 2026-11-27 09:29:59 -> 09:30:00 Bangkok (UTC+7)
  const beforeNikkei = new Date('2026-11-27T09:29:59+07:00');
  const atNikkei = new Date('2026-11-27T09:30:00+07:00');
  const dueAt930 = findMarketsDueAtExactTransition(
    INITIAL_MARKETS,
    beforeNikkei,
    atNikkei
  );
  assert.ok(dueAt930.some((m) => m.id === 'nikkei-am'));
  assert.ok(!dueAt930.some((m) => m.id === 'hanoi-vip'));

  // Calling again 1 second later must NOT trigger nikkei-am again
  const afterNikkei = new Date('2026-11-27T09:30:01+07:00');
  const dueAt93001 = findMarketsDueAtExactTransition(
    INITIAL_MARKETS,
    atNikkei,
    afterNikkei
  );
  assert.equal(dueAt93001.length, 0);

  // Lao Pattana does NOT draw on Thursday (2026-11-26 is Thursday) at 20:30, only Mon/Wed/Fri
  const thuBeforeLao = new Date('2026-11-26T20:29:59+07:00');
  const thuAtLao = new Date('2026-11-26T20:30:00+07:00');
  const dueThu = findMarketsDueAtExactTransition(
    [laoPattana],
    thuBeforeLao,
    thuAtLao
  );
  assert.equal(dueThu.length, 0);

  // Regular stock does NOT draw on Saturday (2026-11-28)
  const satBeforeNikkei = new Date('2026-11-28T09:29:59+07:00');
  const satAtNikkei = new Date('2026-11-28T09:30:00+07:00');
  const dueSat = findMarketsDueAtExactTransition(
    [nikkeiAm],
    satBeforeNikkei,
    satAtNikkei
  );
  assert.equal(dueSat.length, 0);
});

test('hasDrawForRoundDate prevents duplicate announcement for the same Bangkok date', () => {
  const hanoiVip = INITIAL_MARKETS.find((m) => m.id === 'hanoi-vip')!;
  const withTodayDraw = {
    ...hanoiVip,
    draws: [
      ...hanoiVip.draws,
      {
        id: 'today-1',
        roundLabel: 'รอบ 19:30 น.',
        dateISO: '2026-11-27T19:30:00+07:00',
        top3: '123',
        bottom2: '45',
      },
    ],
  };

  assert.equal(hasDrawForRoundDate(withTodayDraw, '2026-11-27'), true);
  const due = findMarketsDueAtExactTransition(
    [withTodayDraw],
    new Date('2026-11-27T19:29:59+07:00'),
    new Date('2026-11-27T19:30:00+07:00')
  );
  assert.equal(due.length, 0);

  const status = getMarketRoundStatus(
    withTodayDraw,
    new Date('2026-11-27T19:35:00+07:00')
  );
  assert.equal(status.state, 'announced_today');
});

test('getNextUpcomingMarket finds nearest waiting draw for current Bangkok time', () => {
  // Friday 2026-11-27 16:00:00 Bangkok -> nearest is singapore (16:10 น.)
  const now = new Date('2026-11-27T16:00:00+07:00');
  const next = getNextUpcomingMarket(INITIAL_MARKETS, now);
  assert.ok(next !== null);
  assert.equal(next.market.id, 'singapore');
  assert.equal(next.countdownSeconds, 600);
});
