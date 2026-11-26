import React, { useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { MarketAnalysis } from '../types/lottery';
import { CATEGORY_LABELS } from '../data/markets';

interface CuratedPicksHeroProps {
  analysis: MarketAnalysis;
  onSimulateLiveUpdate: () => void;
  onOpenRecordModal: () => void;
  lastUpdatedText: string;
}

export const CuratedPicksHero: React.FC<CuratedPicksHeroProps> = ({
  analysis,
  onSimulateLiveUpdate,
  onOpenRecordModal,
  lastUpdatedText,
}) => {
  const [copied, setCopied] = useState(false);
  const { market, latestDraw, curated, bestFormula } = analysis;

  const handleCopy = async () => {
    const text = [
      `${market.name} (${curated.bestFormulaName} · เข้า ${curated.bestRunningHits}/15 งวด ${curated.bestAccuracyPercent}%)`,
      `เด่นรูด 2 ตัว: ${curated.runningTwo[0]} - ${curated.runningTwo[1]}`,
      `เน้นให้ 1 ตัว: ${curated.focusOne}`,
      `เจาะ 6 หาง: ${curated.sixPairs.join(' ')}`,
      `3 ตัวตรงโต๊ด 6 หาง: ${curated.threeDigitSix.join(' ')}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-labelledby="curated-heading"
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Top context bar */}
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{CATEGORY_LABELS[market.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{market.sessionLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              เวลาออกผล {market.drawTime}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                curated.isHighAccuracy
                  ? 'font-semibold text-emerald-700'
                  : 'font-medium text-slate-600'
              }
            >
              {curated.isHighAccuracy
                ? 'สถานะ: ความแม่นยำสูง'
                : 'สถานะ: ปกติ'}
            </span>
          </div>
          <h1
            id="curated-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl"
          >
            {market.name} — สูตรคัดเน้นงวดถัดไป
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            คัดอัตโนมัติจากสถิติ 5 สูตรย้อนหลัง 15 งวด · อันดับ 1 คือ{' '}
            <span className="font-semibold text-slate-900">
              {curated.bestFormulaName}
            </span>{' '}
            (เข้ารูด{' '}
            <span className="font-mono font-semibold tabular-nums text-emerald-700">
              {curated.bestRunningHits}/15 งวด · {curated.bestAccuracyPercent}%
            </span>
            )
          </p>
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:text-right shrink-0">
          <div>
            <div className="text-xs text-slate-500">
              ผลงวดล่าสุด ({latestDraw.roundLabel})
            </div>
            <div className="mt-0.5 flex items-baseline gap-3 sm:justify-end">
              <span className="text-xs text-slate-600">
                3 ตัวบน{' '}
                <strong className="font-mono text-lg font-bold tabular-nums text-slate-900">
                  {latestDraw.top3}
                </strong>
              </span>
              <span className="text-xs text-slate-600">
                2 ตัวล่าง{' '}
                <strong className="font-mono text-lg font-bold tabular-nums text-slate-900">
                  {latestDraw.bottom2}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Focal Anchor: Curated Numbers Grid */}
      <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-12 md:divide-y-0 md:divide-x">
        {/* Column 1: Running 2 Digits & Primary 1 Digit */}
        <div className="p-5 sm:p-6 md:col-span-4 flex flex-col justify-between gap-5">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              เด่นรูด 2 ตัว (คัดเน้นจาก 5 สูตร)
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              {curated.runningTwo.map((digit, idx) => (
                <div
                  key={`${digit}-${idx}`}
                  className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-mono text-2xl font-bold tabular-nums text-slate-900"
                >
                  {digit}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                เน้นให้ 1 ตัว (ตัวเดียวโดด)
              </div>
              <div className="mt-1 text-xs text-slate-500">
                สถิติเข้าเฉพาะตัวเน้น {bestFormula.focusOneHits}/15 งวด
              </div>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-mono text-2xl font-bold tabular-nums text-white">
              {curated.focusOne}
            </div>
          </div>
        </div>

        {/* Column 2: 6 Two-Digit Pairs */}
        <div className="p-5 sm:p-6 md:col-span-4 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-500">
                เจาะ 2 ตัว คัดเน้น 6 หาง
              </div>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                เข้า {bestFormula.sixPairHits}/15 งวด
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {curated.sixPairs.map((pair) => (
                <div
                  key={pair}
                  className="flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-mono text-xl font-bold tabular-nums text-slate-900"
                >
                  {pair}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            คัดเรียงตามน้ำหนักความถี่และการชนกันของสูตรอันดับ 1–3
          </p>
        </div>

        {/* Column 3: 6 Three-Digit Direct/Tote */}
        <div className="p-5 sm:p-6 md:col-span-4 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-500">
                3 ตัวตรง-โต๊ด คัดเน้น 6 หาง
              </div>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                เข้า {bestFormula.threeDigitHits}/15 งวด
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {curated.threeDigitSix.map((num3) => (
                <div
                  key={num3}
                  className="flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-mono text-lg font-bold tabular-nums text-slate-900"
                >
                  {num3}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            เลข 3 ตัวเน้นสำหรับลุ้นตรง-โต๊ดจากฐานเลขเด่นและคู่ 6 หาง
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          คำนวณล่าสุด: {lastUpdatedText} · สถิติต่อเนื่อง {bestFormula.currentStreak} งวดติด
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>คัดลอกชุดเลขแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>คัดลอกชุดตัวเลข</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSimulateLiveUpdate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>อัปเดตผลเรียลไทม์</span>
          </button>

          <button
            type="button"
            onClick={onOpenRecordModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <span>กรอกผลงวดจริง</span>
          </button>
        </div>
      </div>
    </section>
  );
};
