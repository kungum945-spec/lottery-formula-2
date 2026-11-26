import React from 'react';
import { Plus } from 'lucide-react';

export type ActiveTab = 'overview' | 'formulas' | 'history' | 'top-markets';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenRecordModal: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string }[] = [
  { id: 'overview', label: 'ภาพรวมสูตรเน้น' },
  { id: 'formulas', label: 'ตาราง 5 สูตร' },
  { id: 'history', label: 'สถิติ 15 งวด' },
  { id: 'top-markets', label: 'ตลาดแม่นยำสูง' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenRecordModal,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="text-left text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-lg"
        >
          สูตรหวยหุ้นและลาวฮานอย
        </button>

        <nav
          aria-label="เมนูหลัก"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'border-blue-600 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenRecordModal}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-sm"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>บันทึกผลงวดล่าสุด</span>
          </button>
        </div>
      </div>
    </header>
  );
};
