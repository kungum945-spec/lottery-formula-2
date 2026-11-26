import React from 'react';
import { FormulaEvaluation, FormulaId } from '../types/lottery';

interface HistoryTableProps {
  formulas: FormulaEvaluation[];
  inspectedFormula: FormulaEvaluation;
  onSelectFormula: (id: FormulaId) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  formulas,
  inspectedFormula,
  onSelectFormula,
}) => {
  return (
    <section
      aria-labelledby="history-heading"
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2
            id="history-heading"
            className="text-base font-bold text-slate-900 sm:text-lg"
          >
            สถิติย้อนหลัง 15 งวด — {inspectedFormula.formulaName}
          </h2>
          <p className="text-xs text-slate-500">
            เข้ารูด {inspectedFormula.runningHits}/15 งวด (
            {inspectedFormula.accuracyPercent}%) · เน้น 1 ตัวเข้า{' '}
            {inspectedFormula.focusOneHits} งวด · เจาะ 6 หางเข้า{' '}
            {inspectedFormula.sixPairHits} งวด · 3 ตัวเข้า{' '}
            {inspectedFormula.threeDigitHits} งวด
          </p>
        </div>

        <div
          role="tablist"
          aria-label="เลือกดูสถิติแต่ละสูตร"
          className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1"
        >
          {formulas.map((f, idx) => {
            const active = f.formulaId === inspectedFormula.formulaId;
            return (
              <button
                key={f.formulaId}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectFormula(f.formulaId)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                สูตรที่ {f.formulaId.split('-')[1]} ({f.runningHits}/15)
                {idx === 0 ? ' · แนะนำ' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="py-3 pl-5 pr-3">งวดที่ / วันที่</th>
              <th className="px-3 py-3 text-center">3 ตัวบน</th>
              <th className="px-3 py-3 text-center">2 ตัวล่าง</th>
              <th className="px-3 py-3 text-center">รูด 2 ตัว (เน้น 1)</th>
              <th className="px-3 py-3">ชุดเจาะ 6 หาง</th>
              <th className="px-3 py-3">3 ตัวตรง-โต๊ด 6 หาง</th>
              <th className="py-3 pl-3 pr-5 text-right">ผลการตรวจสอบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {inspectedFormula.rounds.map((row) => {
              const hitLabels: string[] = [];
              if (row.threeDigitDirectHit) hitLabels.push('3 ตัวตรง');
              else if (row.threeDigitToteHit) hitLabels.push('3 ตัวโต๊ด');
              if (row.sixPairHit) hitLabels.push('เจาะ 6 หาง');
              if (row.focusOneHit) hitLabels.push('เน้น 1 ตัว');
              else if (row.runningHit) hitLabels.push('เด่นรูด');

              const isHit = row.runningHit || row.sixPairHit || row.threeDigitDirectHit || row.threeDigitToteHit;

              return (
                <tr
                  key={row.draw.id}
                  className={isHit ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-50'}
                >
                  <td className="py-2.5 pl-5 pr-3 whitespace-nowrap">
                    <div className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                      งวดที่ {row.roundIndex}
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.draw.roundLabel}
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-center font-mono text-base font-bold tabular-nums text-slate-900">
                    {row.draw.top3}
                  </td>

                  <td className="px-3 py-2.5 text-center font-mono text-base font-bold tabular-nums text-slate-900">
                    {row.draw.bottom2}
                  </td>

                  <td className="px-3 py-2.5 text-center font-mono text-sm font-semibold tabular-nums text-slate-800 whitespace-nowrap">
                    <span className="text-blue-700 font-bold">
                      {row.prediction.focusOne}
                    </span>{' '}
                    / {row.prediction.runningTwo[1]}
                  </td>

                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-slate-700">
                    {row.prediction.sixPairs.join(' · ')}
                  </td>

                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-slate-700">
                    {row.prediction.threeDigitSix.join(' · ')}
                  </td>

                  <td className="py-2.5 pl-3 pr-5 text-right whitespace-nowrap">
                    {isHit ? (
                      <div>
                        <span className="text-xs font-bold text-emerald-700">
                          เข้า ({hitLabels.join(' + ')})
                        </span>
                        {row.matchedNumbers.length > 0 && (
                          <div className="font-mono text-[11px] tabular-nums text-emerald-700">
                            {row.matchedNumbers.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        หลุด
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
