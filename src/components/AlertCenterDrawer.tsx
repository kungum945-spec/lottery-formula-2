import React from 'react';
import { Bell, Volume2, VolumeX, X } from 'lucide-react';
import { AccuracyAlert } from '../types/lottery';
import { CATEGORY_LABELS } from '../data/markets';

interface AlertCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AccuracyAlert[];
  threshold: number;
  onChangeThreshold: (val: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMarkAllRead: () => void;
  onJumpToMarket: (marketId: string) => void;
}

const THRESHOLD_OPTIONS = [75, 80, 85, 90];

export const AlertCenterDrawer: React.FC<AlertCenterDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  threshold,
  onChangeThreshold,
  soundEnabled,
  onToggleSound,
  onMarkAllRead,
  onJumpToMarket,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
    >
      <div className="flex h-full w-full max-w-md flex-col bg-white border-l border-slate-200 shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />
            <h2
              id="alert-drawer-title"
              className="text-base font-bold text-slate-900"
            >
              แจ้งเตือนสูตรความแม่นยำสูง ({alerts.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างแจ้งเตือน"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Threshold & Sound controls */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">
              เกณฑ์แจ้งเตือนความแม่นยำ 15 งวด
            </span>
            <button
              type="button"
              onClick={onToggleSound}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  <span>เปิดเสียงแจ้งเตือน</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>ปิดเสียง</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {THRESHOLD_OPTIONS.map((pct) => {
              const active = threshold === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onChangeThreshold(pct)}
                  className={`rounded-md py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  &ge; {pct}%
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5">
          <span className="text-xs text-slate-500">
            พบ {alerts.length} ตลาดที่ผ่านเกณฑ์ความแม่นยำ &ge; {threshold}%
          </span>
          {alerts.some((a) => !a.isRead) && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              อ่านทั้งหมดแล้ว
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              ยังไม่มีตลาดที่มีความแม่นยำถึง {threshold}% ในขณะนี้ ลองปรับเกณฑ์ลงหรือบันทึกผลงวดใหม่
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 transition-colors ${
                  alert.isRead ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{CATEGORY_LABELS[alert.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{alert.formulaName}</span>
                    </div>
                    <h3 className="mt-0.5 text-sm font-bold text-slate-900">
                      {alert.marketName}
                    </h3>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums text-emerald-700 shrink-0">
                    {alert.accuracyPercent}%
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-600">{alert.reason}</p>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <div className="font-mono text-xs tabular-nums text-slate-800">
                    รูด <strong>{alert.runningTwo.join('-')}</strong> · เน้น{' '}
                    <strong className="text-blue-700">{alert.focusOne}</strong>{' '}
                    · 6 หาง {alert.sixPairs.slice(0, 3).join(' ')}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToMarket(alert.marketId);
                      onClose();
                    }}
                    className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    เปิดดูสูตร
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
