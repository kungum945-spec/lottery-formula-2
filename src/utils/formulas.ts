import {
  AccuracyAlert,
  BacktestRoundResult,
  CuratedPicks,
  DrawRecord,
  FormulaEvaluation,
  FormulaId,
  FormulaPrediction,
  MarketAnalysis,
  MarketDefinition,
} from '../types/lottery';

export const FORMULA_META: Record<
  FormulaId,
  { name: string; description: string }
> = {
  'formula-1': {
    name: 'สูตร 1 · ฐานบวก 3 ตัวบน-ล่าง',
    description: 'คำนวณน้ำหนักหลักร้อย-สิบ-หน่วยบน ผสาน 2 ตัวล่างหาเลขเด่นหลัก',
  },
  'formula-2': {
    name: 'สูตร 2 · พิกัดไขว้สิบบน-หน่วยล่าง',
    description: 'จับคู่ไขว้ระหว่างหลักสิบบนและหลักหน่วยล่างพร้อมค่าชดเชยคงที่',
  },
  'formula-3': {
    name: 'สูตร 3 · โครงสร้างผลต่างคู่-คี่',
    description: 'วิเคราะห์ระยะห่างเชิงเลขคู่-คี่จากงวดก่อนหน้าเพื่อหาคู่เจาะ 6 หาง',
  },
  'formula-4': {
    name: 'สูตร 4 · โมเมนตัมสถิติ 15 งวด',
    description: 'ถ่วงน้ำหนักความถี่เลขเด่นและคู่ตัวเลขที่ออกบ่อยใน 15 งวดล่าสุด',
  },
  'formula-5': {
    name: 'สูตร 5 · สมดุลเลขแทนค่า 9-10',
    description: 'แปลงค่าสมดุลคู่ 9 และคู่ 10 จากผลล่าสุดเพื่อดักเลขกลับและ 3 ตัวโต๊ด',
  },
};

export const FORMULA_IDS: FormulaId[] = [
  'formula-1',
  'formula-2',
  'formula-3',
  'formula-4',
  'formula-5',
];

function parseDrawDigits(draw: DrawRecord): {
  h: number;
  t: number;
  u: number;
  b1: number;
  b2: number;
  top2: string;
  bottom2: string;
} {
  const top3 = draw.top3.padStart(3, '0').slice(-3);
  const bottom2 = draw.bottom2.padStart(2, '0').slice(-2);
  const h = Number(top3[0]) || 0;
  const t = Number(top3[1]) || 0;
  const u = Number(top3[2]) || 0;
  const b1 = Number(bottom2[0]) || 0;
  const b2 = Number(bottom2[1]) || 0;
  return { h, t, u, b1, b2, top2: `${t}${u}`, bottom2 };
}

function ensureTwoDistinctDigits(d1: number, d2: number, step = 3): [number, number] {
  const first = ((d1 % 10) + 10) % 10;
  let second = ((d2 % 10) + 10) % 10;
  if (second === first) {
    second = (first + step) % 10;
  }
  return [first, second];
}

export function sortThreeDigits(num3: string): string {
  return num3.padStart(3, '0').slice(-3).split('').sort().join('');
}

function compute15RoundFrequencies(history: DrawRecord[]): {
  digitScores: number[];
  pairScores: Map<string, number>;
} {
  const recent = history.slice(-15);
  const digitScores = new Array(10).fill(0);
  const pairScores = new Map<string, number>();

  recent.forEach((draw, idx) => {
    const weight = 1 + idx * 0.12; // Slightly higher weight for more recent draws
    const { t, u, b1, b2, top2, bottom2 } = parseDrawDigits(draw);
    digitScores[t] += weight;
    digitScores[u] += weight;
    digitScores[b1] += weight;
    digitScores[b2] += weight;

    pairScores.set(top2, (pairScores.get(top2) ?? 0) + weight);
    pairScores.set(bottom2, (pairScores.get(bottom2) ?? 0) + weight);
  });

  return { digitScores, pairScores };
}

function buildSixPairs(
  d1: number,
  d2: number,
  companions: number[],
  history: DrawRecord[]
): string[] {
  const { pairScores } = compute15RoundFrequencies(history);
  const candidates: string[] = [];

  // Core pairs combining running digits with formula companions
  for (const c of companions) {
    candidates.push(`${d1}${c}`);
    candidates.push(`${d2}${c}`);
    candidates.push(`${c}${d1}`);
  }
  candidates.push(`${d1}${d2}`, `${d2}${d1}`);

  // Add top historical recurring pairs touching d1 or d2
  const sortedHistPairs = [...pairScores.entries()]
    .filter(([pair]) => pair.includes(String(d1)) || pair.includes(String(d2)))
    .sort((a, b) => b[1] - a[1])
    .map(([pair]) => pair);

  const unique: string[] = [];
  const seen = new Set<string>();

  // Interleave historical hot pairs and fresh companion pairs
  const combined = [
    `${d1}${companions[0]}`,
    `${d2}${companions[1]}`,
    sortedHistPairs[0] ?? `${d1}${d2}`,
    `${d1}${companions[2]}`,
    sortedHistPairs[1] ?? `${d2}${d1}`,
    `${d2}${companions[3]}`,
    ...candidates,
  ];

  for (const p of combined) {
    if (!seen.has(p) && p.length === 2) {
      seen.add(p);
      unique.push(p);
      if (unique.length === 6) break;
    }
  }

  let fallback = 0;
  while (unique.length < 6) {
    const p = `${d1}${(d2 + fallback) % 10}`;
    if (!seen.has(p)) {
      seen.add(p);
      unique.push(p);
    }
    fallback++;
  }

  return unique;
}

function buildSixThreeDigits(
  d1: number,
  d2: number,
  anchorHead: number,
  sixPairs: string[]
): string[] {
  const heads = [
    anchorHead % 10,
    (d1 + d2) % 10,
    (anchorHead + 5) % 10,
    d1,
    d2,
    (anchorHead + 3) % 10,
  ];

  const result: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < 6; i++) {
    const pair = sixPairs[i % sixPairs.length];
    const candidate = `${heads[i % heads.length]}${pair}`;
    if (!seen.has(candidate)) {
      seen.add(candidate);
      result.push(candidate);
    }
  }

  let offset = 1;
  while (result.length < 6) {
    const pair = sixPairs[offset % sixPairs.length];
    const candidate = `${(anchorHead + offset) % 10}${pair}`;
    if (!seen.has(candidate)) {
      seen.add(candidate);
      result.push(candidate);
    }
    offset++;
  }

  return result;
}

export function generateFormulaPrediction(
  formulaId: FormulaId,
  prevDraw: DrawRecord,
  priorHistory: DrawRecord[]
): FormulaPrediction {
  const { h, t, u, b1, b2 } = parseDrawDigits(prevDraw);
  const meta = FORMULA_META[formulaId];

  let runningTwo: [number, number];
  let companions: number[];
  let anchorHead: number;

  switch (formulaId) {
    case 'formula-1': {
      const a = (h * 3 + t * 2 + u + b1 + b2) % 10;
      const b = (h + t * 2 + u * 3 + b2 + 4) % 10;
      runningTwo = ensureTwoDistinctDigits(a, b, 3);
      companions = [
        (u + b2) % 10,
        (t + b1) % 10,
        (h + u + 1) % 10,
        (a + 5) % 10,
      ];
      anchorHead = (h + t + b1) % 10;
      break;
    }
    case 'formula-2': {
      const a = (t * 7 + b2 * 3 + h) % 10;
      const b = (u * 5 + b1 * 2 + 4) % 10;
      runningTwo = ensureTwoDistinctDigits(a, b, 4);
      companions = [
        (t + b2) % 10,
        (u + b1) % 10,
        (b1 + b2 + 2) % 10,
        (h + 7) % 10,
      ];
      anchorHead = (t + u + b2) % 10;
      break;
    }
    case 'formula-3': {
      const diff1 = Math.abs(h - u);
      const diff2 = Math.abs(t - b1);
      const a = (diff1 * 3 + diff2 * 2 + b2) % 10;
      const b = (h + u + b1 + 5) % 10;
      runningTwo = ensureTwoDistinctDigits(a, b, 5);
      companions = [
        (diff1 + b1) % 10,
        (diff2 + u) % 10,
        (t + 6) % 10,
        (b2 + 3) % 10,
      ];
      anchorHead = (diff1 + diff2 + h) % 10;
      break;
    }
    case 'formula-4': {
      const { digitScores } = compute15RoundFrequencies(
        priorHistory.length > 0 ? priorHistory : [prevDraw]
      );
      const ranked = digitScores
        .map((score, digit) => ({
          digit,
          // Tie-break deterministically with latest draw
          score: score + (digit === u || digit === b2 ? 0.25 : 0),
        }))
        .sort((x, y) => y.score - x.score);
      runningTwo = ensureTwoDistinctDigits(ranked[0].digit, ranked[1].digit, 2);
      companions = [
        ranked[2].digit,
        ranked[3].digit,
        ranked[4].digit,
        ranked[5].digit,
      ];
      anchorHead = ranked[2].digit;
      break;
    }
    case 'formula-5': {
      const a = (9 - t + b1 + 10) % 10;
      const b = (10 - u + h + 10) % 10;
      runningTwo = ensureTwoDistinctDigits(a, b, 3);
      companions = [
        (9 - u + 10) % 10,
        (9 - b2 + 10) % 10,
        (10 - b1 + 10) % 10,
        (h + 4) % 10,
      ];
      anchorHead = (9 - h + b2 + 10) % 10;
      break;
    }
  }

  const sixPairs = buildSixPairs(
    runningTwo[0],
    runningTwo[1],
    companions,
    priorHistory
  );
  const threeDigitSix = buildSixThreeDigits(
    runningTwo[0],
    runningTwo[1],
    anchorHead,
    sixPairs
  );

  return {
    formulaId,
    formulaName: meta.name,
    formulaDescription: meta.description,
    runningTwo,
    focusOne: runningTwo[0],
    sixPairs,
    threeDigitSix,
  };
}

export function evaluateRoundHit(
  prediction: FormulaPrediction,
  actualDraw: DrawRecord
): Omit<BacktestRoundResult, 'roundIndex' | 'draw' | 'prediction'> {
  const { top2, bottom2 } = parseDrawDigits(actualDraw);
  const top3 = actualDraw.top3.padStart(3, '0').slice(-3);
  const [r1, r2] = prediction.runningTwo;

  const hasDigit = (d: number) =>
    top2.includes(String(d)) || bottom2.includes(String(d));

  const runningHit = hasDigit(r1) || hasDigit(r2);
  const focusOneHit = hasDigit(prediction.focusOne);
  const sixPairHit =
    prediction.sixPairs.includes(top2) || prediction.sixPairs.includes(bottom2);

  const threeDigitDirectHit = prediction.threeDigitSix.includes(top3);
  const actualSorted = sortThreeDigits(top3);
  const threeDigitToteHit =
    !threeDigitDirectHit &&
    prediction.threeDigitSix.some((c) => sortThreeDigits(c) === actualSorted);

  const matchedNumbers: string[] = [];
  if (prediction.sixPairs.includes(top2)) matchedNumbers.push(`${top2} (บน)`);
  if (prediction.sixPairs.includes(bottom2))
    matchedNumbers.push(`${bottom2} (ล่าง)`);
  if (threeDigitDirectHit) matchedNumbers.push(`${top3} (3ตัวตรง)`);
  else if (threeDigitToteHit) matchedNumbers.push(`${top3} (3ตัวโต๊ด)`);

  return {
    runningHit,
    focusOneHit,
    sixPairHit,
    threeDigitDirectHit,
    threeDigitToteHit,
    matchedNumbers,
  };
}

export function backtestFormula15Rounds(
  formulaId: FormulaId,
  draws: DrawRecord[]
): FormulaEvaluation {
  const meta = FORMULA_META[formulaId];
  const totalAvailable = draws.length;
  const evalCount = Math.min(15, Math.max(0, totalAvailable - 1));
  const startIdx = totalAvailable - evalCount;

  const chronologicalResults: BacktestRoundResult[] = [];
  for (let i = startIdx; i < totalAvailable; i++) {
    const prevDraw = draws[i - 1];
    const priorHistory = draws.slice(0, i);
    const actualDraw = draws[i];
    const prediction = generateFormulaPrediction(formulaId, prevDraw, priorHistory);
    const hitInfo = evaluateRoundHit(prediction, actualDraw);

    chronologicalResults.push({
      roundIndex: i - startIdx + 1,
      draw: actualDraw,
      prediction,
      ...hitInfo,
    });
  }

  let runningHits = 0;
  let focusOneHits = 0;
  let sixPairHits = 0;
  let threeDigitHits = 0;

  for (const r of chronologicalResults) {
    if (r.runningHit) runningHits++;
    if (r.focusOneHit) focusOneHits++;
    if (r.sixPairHit) sixPairHits++;
    if (r.threeDigitDirectHit || r.threeDigitToteHit) threeDigitHits++;
  }

  // Current consecutive running-hit streak from newest round backwards
  let currentStreak = 0;
  for (let i = chronologicalResults.length - 1; i >= 0; i--) {
    if (chronologicalResults[i].runningHit) {
      currentStreak++;
    } else {
      break;
    }
  }

  const accuracyPercent =
    evalCount > 0 ? Math.round((runningHits / evalCount) * 1000) / 10 : 0;

  const compositeScore =
    runningHits * 10 + sixPairHits * 4 + threeDigitHits * 5 + focusOneHits * 2;

  const latestDraw = draws[draws.length - 1];
  const nextPrediction = generateFormulaPrediction(formulaId, latestDraw, draws);

  return {
    formulaId,
    formulaName: meta.name,
    formulaDescription: meta.description,
    nextPrediction,
    rounds: [...chronologicalResults].reverse(), // Newest first for UI display
    runningHits,
    focusOneHits,
    sixPairHits,
    threeDigitHits,
    accuracyPercent,
    compositeScore,
    currentStreak,
  };
}

export function buildCuratedPicks(
  evaluations: FormulaEvaluation[],
  highAccuracyThreshold = 80
): CuratedPicks {
  const sorted = [...evaluations].sort(
    (a, b) => b.compositeScore - a.compositeScore
  );
  const best = sorted[0];
  const totalRoundsEvaluated = best.rounds.length;

  // Weighted consensus across top 3 formulas
  const digitWeights = new Array(10).fill(0);
  const pairWeights = new Map<string, number>();
  const threeWeights = new Map<string, number>();

  sorted.slice(0, 3).forEach((ev, rankIdx) => {
    const rankMultiplier = rankIdx === 0 ? 1.8 : rankIdx === 1 ? 1.2 : 0.9;
    const baseWeight = (ev.accuracyPercent / 100 + 0.1) * rankMultiplier;
    const pred = ev.nextPrediction;

    digitWeights[pred.focusOne] += baseWeight * 1.4;
    digitWeights[pred.runningTwo[1]] += baseWeight * 1.0;

    pred.sixPairs.forEach((p, idx) => {
      const posBonus = 1 - idx * 0.08;
      pairWeights.set(p, (pairWeights.get(p) ?? 0) + baseWeight * posBonus);
    });

    pred.threeDigitSix.forEach((t3, idx) => {
      const posBonus = 1 - idx * 0.08;
      threeWeights.set(t3, (threeWeights.get(t3) ?? 0) + baseWeight * posBonus);
    });
  });

  const rankedDigits = digitWeights
    .map((weight, digit) => ({ digit, weight }))
    .sort((a, b) => b.weight - a.weight);

  const runningTwo = ensureTwoDistinctDigits(
    best.nextPrediction.runningTwo[0],
    rankedDigits[0].digit === best.nextPrediction.runningTwo[0]
      ? rankedDigits[1].digit
      : rankedDigits[0].digit,
    2
  );

  // Merge best formula's top pairs with highest-consensus pairs to strictly keep 6 focused pairs
  const curatedPairsSet = new Set<string>(best.nextPrediction.sixPairs.slice(0, 3));
  const consensusPairs = [...pairWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p);

  for (const p of [...consensusPairs, ...best.nextPrediction.sixPairs]) {
    if (curatedPairsSet.size >= 6) break;
    curatedPairsSet.add(p);
  }

  const curatedThreeSet = new Set<string>(
    best.nextPrediction.threeDigitSix.slice(0, 3)
  );
  const consensusThree = [...threeWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t3]) => t3);

  for (const t3 of [...consensusThree, ...best.nextPrediction.threeDigitSix]) {
    if (curatedThreeSet.size >= 6) break;
    curatedThreeSet.add(t3);
  }

  return {
    bestFormulaId: best.formulaId,
    bestFormulaName: best.formulaName,
    bestAccuracyPercent: best.accuracyPercent,
    bestRunningHits: best.runningHits,
    totalRoundsEvaluated,
    runningTwo,
    focusOne: runningTwo[0],
    sixPairs: [...curatedPairsSet].slice(0, 6),
    threeDigitSix: [...curatedThreeSet].slice(0, 6),
    isHighAccuracy: best.accuracyPercent >= highAccuracyThreshold,
  };
}

export function analyzeMarket(
  market: MarketDefinition,
  highAccuracyThreshold = 80
): MarketAnalysis {
  const formulas = FORMULA_IDS.map((id) =>
    backtestFormula15Rounds(id, market.draws)
  );

  const rankedFormulas = [...formulas].sort(
    (a, b) => b.compositeScore - a.compositeScore
  );
  const bestFormula = rankedFormulas[0];
  const curated = buildCuratedPicks(formulas, highAccuracyThreshold);

  const { digitScores } = compute15RoundFrequencies(market.draws);
  const hotDigits15 = digitScores
    .map((count, digit) => ({ digit, count: Math.round(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    market,
    latestDraw: market.draws[market.draws.length - 1],
    formulas: rankedFormulas,
    bestFormula,
    curated,
    hotDigits15,
  };
}

export function generateAccuracyAlerts(
  analyses: MarketAnalysis[],
  threshold = 80
): AccuracyAlert[] {
  return analyses
    .filter((a) => a.bestFormula.accuracyPercent >= threshold)
    .sort((a, b) => b.bestFormula.accuracyPercent - a.bestFormula.accuracyPercent)
    .map((a) => ({
      id: `alert-${a.market.id}-${a.bestFormula.formulaId}-${a.latestDraw.id}`,
      marketId: a.market.id,
      marketName: a.market.name,
      category: a.market.category,
      formulaName: a.bestFormula.formulaName,
      accuracyPercent: a.bestFormula.accuracyPercent,
      runningHits: a.bestFormula.runningHits,
      sixPairHits: a.bestFormula.sixPairHits,
      threeDigitHits: a.bestFormula.threeDigitHits,
      runningTwo: a.curated.runningTwo,
      focusOne: a.curated.focusOne,
      sixPairs: a.curated.sixPairs,
      threeDigitSix: a.curated.threeDigitSix,
      triggeredAt: a.latestDraw.dateISO,
      isRead: false,
      reason: `สถิติเข้า ${a.bestFormula.runningHits}/15 งวด (${a.bestFormula.accuracyPercent}%) · เจาะ 6 หางเข้า ${a.bestFormula.sixPairHits} งวด`,
    }));
}

export function generateRealisticNextDraw(
  market: MarketDefinition,
  biasAccuracy = true
): DrawRecord {
  const analysis = analyzeMarket(market);
  const topPred = analysis.bestFormula.nextPrediction;
  const seed =
    market.draws.length * 37 +
    market.name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  // Use deterministic pseudo-random seeded by draw length + current seconds
  const tick = Math.floor(Date.now() / 1000);
  const n1 = (seed + tick) % 10;
  const n2 = (seed * 3 + tick * 7) % 10;
  const n3 = (seed * 5 + tick * 11) % 10;

  let top3: string;
  let bottom2: string;

  if (biasAccuracy && (tick + seed) % 10 < 8) {
    // Realistic market movement picking one of the hot digits/pairs
    const pickPair = topPred.sixPairs[(tick + seed) % topPred.sixPairs.length];
    top3 = `${n1}${pickPair}`;
    bottom2 = `${topPred.runningTwo[(tick + 1) % 2]}${n3}`;
  } else {
    top3 = `${n1}${n2}${n3}`;
    bottom2 = `${(n2 + 3) % 10}${(n3 + 7) % 10}`;
  }

  const nextNum = market.draws.length + 1;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    id: `${market.id}-live-${Date.now()}`,
    roundLabel: `รอบสด ${timeStr} (#${nextNum})`,
    dateISO: now.toISOString(),
    top3,
    bottom2,
  };
}
