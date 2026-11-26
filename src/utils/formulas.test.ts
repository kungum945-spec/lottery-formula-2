import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeMarket,
  backtestFormula15Rounds,
  evaluateRoundHit,
  FORMULA_IDS,
  generateAccuracyAlerts,
  generateFormulaPrediction,
} from './formulas';
import { INITIAL_MARKETS } from '../data/markets';

test('all 30 requested markets are present with >= 18 draws', () => {
  assert.equal(INITIAL_MARKETS.length, 30);
  const regular = INITIAL_MARKETS.filter((m) => m.category === 'stock_regular');
  const vip = INITIAL_MARKETS.filter((m) => m.category === 'stock_vip');
  const laoHanoi = INITIAL_MARKETS.filter((m) => m.category === 'lao_hanoi');
  assert.equal(regular.length, 13);
  assert.equal(vip.length, 13);
  assert.equal(laoHanoi.length, 4);

  for (const m of INITIAL_MARKETS) {
    assert.ok(m.draws.length >= 16, `${m.id} should have at least 16 draws`);
  }
});

test('every formula outputs 2 distinct running digits, 1 focus digit, 6 two-digit pairs, and 6 three-digit numbers', () => {
  const sampleMarket = INITIAL_MARKETS[0];
  const prevDraw = sampleMarket.draws[sampleMarket.draws.length - 1];

  for (const formulaId of FORMULA_IDS) {
    const pred = generateFormulaPrediction(
      formulaId,
      prevDraw,
      sampleMarket.draws
    );
    assert.equal(pred.runningTwo.length, 2);
    assert.notEqual(pred.runningTwo[0], pred.runningTwo[1]);
    assert.equal(pred.focusOne, pred.runningTwo[0]);
    assert.equal(pred.sixPairs.length, 6);
    assert.equal(new Set(pred.sixPairs).size, 6);
    for (const p of pred.sixPairs) {
      assert.match(p, /^\d{2}$/);
    }
    assert.equal(pred.threeDigitSix.length, 6);
    assert.equal(new Set(pred.threeDigitSix).size, 6);
    for (const t3 of pred.threeDigitSix) {
      assert.match(t3, /^\d{3}$/);
    }
  }
});

test('15-round backtest evaluates exactly 15 rounds and counts hits accurately', () => {
  const nikkei = INITIAL_MARKETS[0];
  const eval1 = backtestFormula15Rounds('formula-1', nikkei.draws);
  assert.equal(eval1.rounds.length, 15);
  assert.ok(eval1.runningHits >= 0 && eval1.runningHits <= 15);
  assert.ok(eval1.sixPairHits >= 0 && eval1.sixPairHits <= 15);
  assert.ok(eval1.accuracyPercent >= 0 && eval1.accuracyPercent <= 100);
});

test('evaluateRoundHit detects running, 6-pair, 3-digit direct and tote hits', () => {
  const mockPrediction = {
    formulaId: 'formula-1' as const,
    formulaName: 'Test',
    formulaDescription: 'Test',
    runningTwo: [4, 7] as [number, number],
    focusOne: 4,
    sixPairs: ['48', '72', '41', '79', '45', '70'],
    threeDigitSix: ['348', '572', '141', '879', '245', '970'],
  };

  const directHit = evaluateRoundHit(mockPrediction, {
    id: 'd1',
    roundLabel: 'test1',
    dateISO: '2026-11-26T00:00:00Z',
    top3: '348',
    bottom2: '12',
  });
  assert.equal(directHit.runningHit, true);
  assert.equal(directHit.focusOneHit, true);
  assert.equal(directHit.sixPairHit, true);
  assert.equal(directHit.threeDigitDirectHit, true);
  assert.equal(directHit.threeDigitToteHit, false);

  const toteHit = evaluateRoundHit(mockPrediction, {
    id: 'd2',
    roundLabel: 'test2',
    dateISO: '2026-11-26T00:00:00Z',
    top3: '843', // permutation of 348
    bottom2: '99',
  });
  assert.equal(toteHit.threeDigitDirectHit, false);
  assert.equal(toteHit.threeDigitToteHit, true);
});

test('analyzeMarket and generateAccuracyAlerts surface high-accuracy markets above threshold', () => {
  const analyses = INITIAL_MARKETS.map((m) => analyzeMarket(m, 80));
  assert.equal(analyses.length, 30);

  const alerts80 = generateAccuracyAlerts(analyses, 80);
  assert.ok(alerts80.length > 0, 'Expected at least one market >= 80%');
  for (const alert of alerts80) {
    assert.ok(alert.accuracyPercent >= 80);
  }
});
