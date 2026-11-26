import React from 'react';
import { Search, X } from 'lucide-react';
import { MarketAnalysis, MarketCategory } from '../types/lottery';
import { CATEGORY_LABELS } from '../data/markets';

export type CategoryFilter = 'all' | MarketCategory;

interface MarketSidebarProps {
  analyses: MarketAnalysis[];
  selectedMarketId: string;
  onSelectMarket: (marketId: string) => void;
  categoryFilter: CategoryFilter;
  onChangeCategory: (category: CategoryFilter) => void;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  accuracyThreshold: number;
}

const FILTER_OPTIONS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'stock_regular', label: 'หุ้นปกติ' },
  { id: 'stock_vip', label: 'หุ้น VIP' },
  { id: 'lao_hanoi', label: 'ลาว/ฮานอย' },
];

export const MarketSidebar: React.FC<MarketSidebarProps> = ({
  analyses,
  selectedMarketId,
  onSelectMarket,
  categoryFilter,
  onChangeCategory,
  searchQuery,
  onChangeSearch,
  accuracyThreshold,
}) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = analyses.filter((item) => {
    const matchesCategory =
      categoryFilter === 'all' || item.market.category === categoryFilter;
    const matchesSearch =
      normalizedQuery === '' ||
      item.market.name.toLowerCase().includes(normalizedQuery) ||
      item.market.shortName.toLowerCase().includes(normalizedQuery) ||
      item.market.countryCode.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  const categoryCounts: Record<CategoryFilter, number> = {
    all: analyses.length,
    stock_regular: analyses.filter((a) => a.market.category === 'stock_regular')
      .length,
    stock_vip: analyses.filter((a) => a.market.category === 'stock_vip').length,
    lao_hanoi: analyses.filter((a) => a.market.category === 'lao_hanoi').length,
  };

  return (
    <aside
      aria-label="รายชื่อตลาดหวยทั้งหมด"
      className="w-full lg:w-[296px] lg:shrink-0 border border-slate-200 bg-white rounded-xl overflow-hidden flex flex-col lg:max-h-[calc(100vh-120px)] lg:sticky lg:top-20"
    >
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            เลือกตลาดคำนวณ ({analyses.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            สถิติ 15 งวด
          </span>
        </div>

        <div className="relative">
          <label htmlFor="market-search" className="sr-only">
            ค้นหาตลาดหวย
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="market-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="ค้นหา เช่น นิเคอิ, VIP, ฮานอย..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onChangeSearch('')}
              aria-label="ล้างคำค้นหา"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="หมวดหมู่ตลาด"
          className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = categoryFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeCategory(opt.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label} ({categoryCounts[opt.id]})
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-y-auto divide-y divide-slate-100 max-h-[340px] lg:max-h-none">
        {filtered.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-slate-600">
              ไม่พบตลาดที่ตรงกับ &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => {
                onChangeSearch('');
                onChangeCategory('all');
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.market.id === selectedMarketId;
            const isHigh = item.bestFormula.accuracyPercent >= accuracyThreshold;

            return (
              <button
                key={item.market.id}
                type="button"
                onClick={() => onSelectMarket(item.market.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-600 ${
                  isSelected
                    ? 'bg-blue-50/70 text-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`truncate text-sm ${
                        isSelected ? 'font-bold text-blue-900' : 'font-semibold'
                      }`}
                    >
                      {item.market.name}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>{CATEGORY_LABELS[item.market.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {item.market.drawTime}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-mono text-xs font-semibold tabular-nums ${
                      isHigh ? 'text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    {item.bestFormula.runningHits}/15 ({item.bestFormula.accuracyPercent}%)
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {isHigh ? 'แม่นยำสูง' : 'ปกติ'}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
