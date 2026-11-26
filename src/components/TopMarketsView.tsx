import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { MarketAnalysis } from '../types/lottery';
import { CATEGORY_LABELS } from '../data/markets';

interface TopMarketsViewProps {
  analyses: MarketAnalysis[];
  accuracyThreshold: number;
  onJumpToMarket: (marketId: string) => void;
}

export const TopMarketsView: React.FC<TopMarketsViewProps> = ({
  analyses,
  accuracyThreshold,
  onJumpToMarket,
}) => {
  const [onlyHighAccuracy, setOnlyHighAccuracy] = useState(true);

  const sorted = [...analyses]
    .sort((a, b) => {
      if (b.bestFormula.accuracyPercent !== a.bestFormula.accuracyPercent) {
        return b.bestFormula.accuracyPercent - a.bestFormula.accuracyPercent;
      }
      return b.bestFormula.compositeScore - a.bestFormula.compositeScore;
    })
    .filter((a) =>
      onlyHighAccuracy
        ? a.bestFormula.accuracyPercent >= accuracyThreshold
        : true
    );

  return (
    <section
      aria-labelledby="top-markets-heading"
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="top-markets-heading"
            className="text-base font-bold text-slate-900 sm:text-lg"
          >
            จัดอันดับตลาดความแม่นยำสูง (เทียบจากสถิติ 15 งวด)
          </h2>
          <p className="text-xs text-slate-500">
            คัดกรองทุกตลาดที่สูตรคำนวณมีอัตราเข้าต่อเนื่องตั้งแต่{' '}
            {accuracyThreshold}% ขึ้นไป
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setOnlyHighAccuracy(true)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              onlyHighAccuracy
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เฉพาะแม่นยำสูง (&ge;{accuracyThreshold}%)
          </button>
          <button
            type="button"
            onClick={() => setOnlyHighAccuracy(false)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              !onlyHighAccuracy
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            แสดงทั้ง 30 ตลาด
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-slate-600">
            ขณะนี้ยังไม่มีตลาดที่ผ่านเกณฑ์ความแม่นยำ {accuracyThreshold}%
          </p>
          <button
            type="button"
            onClick={() => setOnlyHighAccuracy(false)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            แสดงทั้งหมด 30 ตลาด
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 pl-5 pr-3">ตลาด / หมวดหมู่</th>
                <th className="px-3 py-3">สูตรอันดับ 1</th>
                <th className="px-3 py-3 text-right">ความแม่นยำ 15 งวด</th>
                <th className="px-3 py-3 text-center">รูด 2 (เน้น 1)</th>
                <th className="px-3 py-3">เจาะ 6 หาง</th>
                <th className="px-3 py-3">3 ตัวตรงโต๊ด</th>
                <th className="py-3 pl-3 pr-5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sorted.map((item) => {
                const isHigh =
                  item.bestFormula.accuracyPercent >= accuracyThreshold;
                return (
                  <tr key={item.market.id} className="hover:bg-slate-50">
                    <td className="py-3 pl-5 pr-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {item.market.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {CATEGORY_LABELS[item.market.category]} · ออกผล{' '}
                        <span className="font-mono tabular-nums">
                          {item.market.drawTime}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-xs font-medium text-slate-700">
                      {item.bestFormula.formulaName}
                    </td>

                    <td className="px-3 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          isHigh ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        {item.bestFormula.runningHits}/15 (
                        {item.bestFormula.accuracyPercent}%)
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center font-mono font-bold tabular-nums text-slate-900 whitespace-nowrap">
                      <span className="text-blue-700">
                        {item.curated.focusOne}
                      </span>{' '}
                      / {item.curated.runningTwo[1]}
                    </td>

                    <td className="px-3 py-3 font-mono text-xs font-semibold tabular-nums text-slate-800">
                      {item.curated.sixPairs.join(' · ')}
                    </td>

                    <td className="px-3 py-3 font-mono text-xs font-semibold tabular-nums text-slate-800">
                      {item.curated.threeDigitSix.slice(0, 3).join(' · ')}
                    </td>

                    <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onJumpToMarket(item.market.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        <span>เปิดดูสูตร</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
