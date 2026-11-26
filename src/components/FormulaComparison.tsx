import React from 'react';
import { FormulaEvaluation, FormulaId } from '../types/lottery';

interface FormulaComparisonProps {
  formulas: FormulaEvaluation[];
  inspectedFormulaId: FormulaId;
  onInspectFormula: (id: FormulaId) => void;
  accuracyThreshold: number;
}

export const FormulaComparison: React.FC<FormulaComparisonProps> = ({
  formulas,
  inspectedFormulaId,
  onInspectFormula,
  accuracyThreshold,
}) => {
  return (
    <section
      aria-labelledby="formulas-heading"
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="formulas-heading"
            className="text-base font-bold text-slate-900 sm:text-lg"
          >
            เปรียบเทียบผลคำนวณ 5 สูตรอัตโนมัติ (สถิติ 15 งวด)
          </h2>
          <p className="text-xs text-slate-500">
            เรียงลำดับจากสูตรที่มีอัตราเข้าบ่อยที่สุดใน 15 งวดล่าสุด — คลิกเลือกสูตรเพื่อดูรายละเอียดย้อนหลังรายงวด
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="py-3 pl-5 pr-3">อันดับ / สูตรคำนวณ</th>
              <th className="px-3 py-3 text-right">ความแม่นยำ 15 งวด</th>
              <th className="px-3 py-3 text-right">6 หาง / 3 ตัวเข้า</th>
              <th className="px-3 py-3 text-center">รูด 2 ตัว</th>
              <th className="px-3 py-3 text-center">เน้น 1 ตัว</th>
              <th className="px-3 py-3">เจาะ 6 หาง</th>
              <th className="px-3 py-3">3 ตัวตรง-โต๊ด (6 หาง)</th>
              <th className="py-3 pl-3 pr-5 text-right">สถิติรายงวด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {formulas.map((item, idx) => {
              const isSelected = item.formulaId === inspectedFormulaId;
              const isHigh = item.accuracyPercent >= accuracyThreshold;

              return (
                <tr
                  key={item.formulaId}
                  className={`transition-colors ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3.5 pl-5 pr-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold tabular-nums text-slate-500">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {item.formulaName}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 max-w-xs">
                      {item.formulaDescription}
                    </div>
                  </td>

                  <td className="px-3 py-3.5 text-right align-top font-mono tabular-nums whitespace-nowrap">
                    <div
                      className={`font-bold ${
                        isHigh ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {item.runningHits}/15 งวด ({item.accuracyPercent}%)
                    </div>
                    <div className="text-xs text-slate-500">
                      {isHigh ? 'แม่นยำสูง' : 'เกณฑ์ปกติ'}
                    </div>
                  </td>

                  <td className="px-3 py-3.5 text-right align-top font-mono text-xs tabular-nums text-slate-700 whitespace-nowrap">
                    <div>6 หาง: {item.sixPairHits} งวด</div>
                    <div className="text-slate-500">
                      3 ตัว: {item.threeDigitHits} งวด
                    </div>
                  </td>

                  <td className="px-3 py-3.5 text-center align-top font-mono text-base font-bold tabular-nums text-slate-900 whitespace-nowrap">
                    {item.nextPrediction.runningTwo[0]} -{' '}
                    {item.nextPrediction.runningTwo[1]}
                  </td>

                  <td className="px-3 py-3.5 text-center align-top whitespace-nowrap">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 font-mono text-sm font-bold tabular-nums text-white">
                      {item.nextPrediction.focusOne}
                    </span>
                  </td>

                  <td className="px-3 py-3.5 align-top font-mono text-xs font-semibold tabular-nums text-slate-800">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 max-w-[160px]">
                      {item.nextPrediction.sixPairs.map((p) => (
                        <span key={p}>{p}</span>
                      ))}
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-top font-mono text-xs font-semibold tabular-nums text-slate-800">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 max-w-[190px]">
                      {item.nextPrediction.threeDigitSix.map((t3) => (
                        <span key={t3}>{t3}</span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 pl-3 pr-5 text-right align-top whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onInspectFormula(item.formulaId)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? 'กำลังดูสถิติ' : 'ดูสถิติ 15 งวด'}
                    </button>
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
