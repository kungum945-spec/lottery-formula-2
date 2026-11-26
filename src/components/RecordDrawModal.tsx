import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MarketDefinition } from '../types/lottery';

interface RecordDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: MarketDefinition[];
  defaultMarketId: string;
  onSubmitDraw: (params: {
    marketId: string;
    top3: string;
    bottom2: string;
    roundLabel: string;
  }) => void;
}

export const RecordDrawModal: React.FC<RecordDrawModalProps> = ({
  isOpen,
  onClose,
  markets,
  defaultMarketId,
  onSubmitDraw,
}) => {
  const [marketId, setMarketId] = useState(defaultMarketId);
  const [top3, setTop3] = useState('');
  const [bottom2, setBottom2] = useState('');
  const [roundLabel, setRoundLabel] = useState('งวดล่าสุด (บันทึกเอง)');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMarketId(defaultMarketId);
      setTop3('');
      setBottom2('');
      setRoundLabel('งวดล่าสุด (บันทึกเอง)');
      setError(null);
    }
  }, [isOpen, defaultMarketId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTop3 = top3.trim();
    const cleanBottom2 = bottom2.trim();

    if (!/^\d{3}$/.test(cleanTop3)) {
      setError('กรุณากรอกเลข 3 ตัวบน เป็นตัวเลข 3 หลักให้ถูกต้อง (เช่น 482)');
      return;
    }
    if (!/^\d{2}$/.test(cleanBottom2)) {
      setError('กรุณากรอกเลข 2 ตัวล่าง เป็นตัวเลข 2 หลักให้ถูกต้อง (เช่น 59)');
      return;
    }

    onSubmitDraw({
      marketId,
      top3: cleanTop3,
      bottom2: cleanBottom2,
      roundLabel: roundLabel.trim() || 'งวดล่าสุด',
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2
            id="record-modal-title"
            className="text-base font-bold text-slate-900"
          >
            บันทึกผลงวดล่าสุดและคำนวณสูตรใหม่ทันที
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างบันทึกผล"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="record-market-select"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              เลือกตลาดหวย
            </label>
            <select
              id="record-market-select"
              value={marketId}
              onChange={(e) => setMarketId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.drawTime})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="record-top3"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                ผล 3 ตัวบน (3 หลัก)
              </label>
              <input
                id="record-top3"
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={top3}
                onChange={(e) => {
                  setTop3(e.target.value.replace(/\D/g, '').slice(0, 3));
                  setError(null);
                }}
                placeholder="เช่น 589"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-lg font-bold tabular-nums text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="record-bottom2"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                ผล 2 ตัวล่าง (2 หลัก)
              </label>
              <input
                id="record-bottom2"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={bottom2}
                onChange={(e) => {
                  setBottom2(e.target.value.replace(/\D/g, '').slice(0, 2));
                  setError(null);
                }}
                placeholder="เช่น 24"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-lg font-bold tabular-nums text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="record-round-label"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              ชื่อรอบ / วันที่งวด
            </label>
            <input
              id="record-round-label"
              type="text"
              value={roundLabel}
              onChange={(e) => setRoundLabel(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              บันทึกและคำนวณ 5 สูตร
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
