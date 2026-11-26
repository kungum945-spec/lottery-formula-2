export type MarketCategory = 'stock_regular' | 'stock_vip' | 'lao_hanoi';

export interface DrawRecord {
  id: string;
  roundLabel: string; // e.g. "26 พ.ย. 69" or "งวดที่ 15"
  dateISO: string;
  top3: string; // 3 digits e.g. "482"
  bottom2: string; // 2 digits e.g. "59"
}

export interface MarketDefinition {
  id: string;
  name: string;
  shortName: string;
  category: MarketCategory;
  sessionLabel: string; // e.g. "รอบเช้า", "รอบบ่าย", "รอบค่ำ", "รอบ VIP"
  drawTime: string; // e.g. "09:30 น."
  countryCode: string; // e.g. "JP", "CN", "HK", "LA", "VN"
  draws: DrawRecord[]; // Ordered oldest -> newest
}

export type FormulaId =
  | 'formula-1'
  | 'formula-2'
  | 'formula-3'
  | 'formula-4'
  | 'formula-5';

export interface FormulaPrediction {
  formulaId: FormulaId;
  formulaName: string;
  formulaDescription: string;
  runningTwo: [number, number]; // เด่นรูด 2 ตัว
  focusOne: number; // เน้นให้ 1 ตัว
  sixPairs: string[]; // เจาะ 6 หาง (2 ตัว)
  threeDigitSix: string[]; // 3 ตัวตรงโต๊ด คัดเน้น 6 หาง
}

export interface BacktestRoundResult {
  roundIndex: number; // 1..15
  draw: DrawRecord;
  prediction: FormulaPrediction;
  runningHit: boolean;
  focusOneHit: boolean;
  sixPairHit: boolean;
  threeDigitDirectHit: boolean;
  threeDigitToteHit: boolean;
  matchedNumbers: string[];
}

export interface FormulaEvaluation {
  formulaId: FormulaId;
  formulaName: string;
  formulaDescription: string;
  nextPrediction: FormulaPrediction;
  rounds: BacktestRoundResult[]; // 15 rounds (newest first or chronological - stored newest first for display)
  runningHits: number; // out of 15
  focusOneHits: number; // out of 15
  sixPairHits: number; // out of 15
  threeDigitHits: number; // direct or tote out of 15
  accuracyPercent: number; // 0..100 based on 15 rounds
  compositeScore: number;
  currentStreak: number;
}

export interface CuratedPicks {
  bestFormulaId: FormulaId;
  bestFormulaName: string;
  bestAccuracyPercent: number;
  bestRunningHits: number;
  totalRoundsEvaluated: number;
  runningTwo: [number, number];
  focusOne: number;
  sixPairs: string[];
  threeDigitSix: string[];
  isHighAccuracy: boolean;
}

export interface MarketAnalysis {
  market: MarketDefinition;
  latestDraw: DrawRecord;
  formulas: FormulaEvaluation[]; // Ranked best -> worst or ordered 1..5
  bestFormula: FormulaEvaluation;
  curated: CuratedPicks;
  hotDigits15: { digit: number; count: number }[];
}

export interface AccuracyAlert {
  id: string;
  marketId: string;
  marketName: string;
  category: MarketCategory;
  formulaName: string;
  accuracyPercent: number;
  runningHits: number;
  sixPairHits: number;
  threeDigitHits: number;
  runningTwo: [number, number];
  focusOne: number;
  sixPairs: string[];
  threeDigitSix: string[];
  triggeredAt: string;
  isRead: boolean;
  reason: string;
}
