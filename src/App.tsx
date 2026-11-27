import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Radio, RotateCcw, X } from 'lucide-react';
import { INITIAL_MARKETS } from './data/markets';
import {
  AccuracyAlert,
  DrawRecord,
  FormulaId,
  MarketDefinition,
} from './types/lottery';
import {
  analyzeMarket,
  generateAccuracyAlerts,
  generateRealisticNextDraw,
} from './utils/formulas';
import {
  findMarketsDueAtExactTransition,
  formatDurationThai,
  getBangkokTimeParts,
  getMarketRoundStatus,
  getNextUpcomingMarket,
} from './utils/schedule';
import { ActiveTab, Header } from './components/Header';
import { CategoryFilter, MarketSidebar } from './components/MarketSidebar';
import { CuratedPicksHero } from './components/CuratedPicksHero';
import { FormulaComparison } from './components/FormulaComparison';
import { HistoryTable } from './components/HistoryTable';
import { TopMarketsView } from './components/TopMarketsView';
import { AlertCenterDrawer } from './components/AlertCenterDrawer';
import { RecordDrawModal } from './components/RecordDrawModal';

const STORAGE_MARKETS_KEY = 'thai_stock_lotto_markets_v2';
const STORAGE_THRESHOLD_KEY = 'thai_stock_lotto_threshold_v1';

function loadSavedMarkets(): MarketDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_MARKETS_KEY);
    if (!raw) return INITIAL_MARKETS;
    const parsed = JSON.parse(raw) as MarketDefinition[];
    if (Array.isArray(parsed) && parsed.length === INITIAL_MARKETS.length) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return INITIAL_MARKETS;
}

function loadSavedThreshold(): number {
  try {
    const raw = localStorage.getItem(STORAGE_THRESHOLD_KEY);
    if (raw) {
      const n = Number(raw);
      if (n >= 70 && n <= 95) return n;
    }
  } catch {
    // Ignore
  }
  return 80;
}

function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Ignore browser autoplay restrictions
  }
}

export default function App() {
  const [markets, setMarkets] = useState<MarketDefinition[]>(loadSavedMarkets);
  const [selectedMarketId, setSelectedMarketId] = useState<string>(
    INITIAL_MARKETS[0].id
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [inspectedFormulaId, setInspectedFormulaId] = useState<FormulaId | null>(
    null
  );

  const [accuracyThreshold, setAccuracyThreshold] = useState<number>(
    loadSavedThreshold
  );
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [liveToast, setLiveToast] = useState<AccuracyAlert | null>(null);
  const [nowTime, setNowTime] = useState<Date>(() => new Date());

  const prevHighMarketsRef = useRef<Set<string>>(new Set());
  const prevTickRef = useRef<Date>(new Date());

  // Persist markets & threshold
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MARKETS_KEY, JSON.stringify(markets));
    } catch {
      // Ignore quota errors
    }
  }, [markets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THRESHOLD_KEY, String(accuracyThreshold));
    } catch {
      // Ignore
    }
  }, [accuracyThreshold]);

  // Real-time 1-second Bangkok clock & per-round draw-time transition watcher
  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = new Date();
      const prevTick = prevTickRef.current;
      prevTickRef.current = currentNow;
      setNowTime(currentNow);

      if (!realtimeEnabled) return;

      setMarkets((prev) => {
        const dueMarkets = findMarketsDueAtExactTransition(
          prev,
          prevTick,
          currentNow
        );
        if (dueMarkets.length === 0) return prev;

        const dueIds = new Set(dueMarkets.map((m) => m.id));
        const updated = prev.map((m) => {
          if (!dueIds.has(m.id)) return m;
          const nextDraw = generateRealisticNextDraw(m, true, currentNow);
          return { ...m, draws: [...m.draws, nextDraw].slice(-25) };
        });

        for (const dueMarket of dueMarkets) {
          const updatedMarket = updated.find((m) => m.id === dueMarket.id);
          if (!updatedMarket) continue;
          const updatedAnalysis = analyzeMarket(
            updatedMarket,
            accuracyThreshold
          );
          const alertObj = generateAccuracyAlerts(
            [updatedAnalysis],
            accuracyThreshold
          )[0];
          if (alertObj) {
            prevHighMarketsRef.current.add(alertObj.id);
            setLiveToast(alertObj);
            if (soundEnabled) {
              playNotificationChime();
            }
          }
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [realtimeEnabled, accuracyThreshold, soundEnabled]);

  const analyses = useMemo(
    () => markets.map((m) => analyzeMarket(m, accuracyThreshold)),
    [markets, accuracyThreshold]
  );

  const selectedAnalysis = useMemo(
    () =>
      analyses.find((a) => a.market.id === selectedMarketId) ?? analyses[0],
    [analyses, selectedMarketId]
  );

  const rawAlerts = useMemo(
    () => generateAccuracyAlerts(analyses, accuracyThreshold),
    [analyses, accuracyThreshold]
  );

  const alerts = useMemo(
    () =>
      rawAlerts.map((a) => ({
        ...a,
        isRead: readAlertIds.has(a.id),
      })),
    [rawAlerts, readAlertIds]
  );

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  // Initialize tracked high-accuracy set on first mount
  useEffect(() => {
    if (prevHighMarketsRef.current.size === 0 && rawAlerts.length > 0) {
      prevHighMarketsRef.current = new Set(rawAlerts.map((a) => a.id));
    }
  }, [rawAlerts]);

  const appendDrawToMarket = useCallback(
    (marketId: string, newDraw: DrawRecord) => {
      setMarkets((prev) => {
        const updated = prev.map((m) => {
          if (m.id !== marketId) return m;
          const nextDraws = [...m.draws, newDraw].slice(-25);
          return { ...m, draws: nextDraws };
        });

        const updatedMarket = updated.find((m) => m.id === marketId);
        if (updatedMarket) {
          const updatedAnalysis = analyzeMarket(
            updatedMarket,
            accuracyThreshold
          );
          if (updatedAnalysis.bestFormula.accuracyPercent >= accuracyThreshold) {
            const alertObj = generateAccuracyAlerts(
              [updatedAnalysis],
              accuracyThreshold
            )[0];
            if (alertObj) {
              setLiveToast(alertObj);
              if (soundEnabled) {
                playNotificationChime();
              }
            }
          }
        }
        return updated;
      });
    },
    [accuracyThreshold, soundEnabled]
  );

  const handleSelectMarket = (marketId: string) => {
    setSelectedMarketId(marketId);
    setInspectedFormulaId(null);
    if (activeTab === 'top-markets') {
      setActiveTab('overview');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleManualSubmitDraw = ({
    marketId,
    top3,
    bottom2,
    roundLabel,
  }: {
    marketId: string;
    top3: string;
    bottom2: string;
    roundLabel: string;
  }) => {
    const newDraw: DrawRecord = {
      id: `${marketId}-manual-${Date.now()}`,
      roundLabel,
      dateISO: new Date().toISOString(),
      top3,
      bottom2,
    };
    appendDrawToMarket(marketId, newDraw);
    setSelectedMarketId(marketId);
    setInspectedFormulaId(null);
  };

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_MARKETS_KEY);
    setMarkets(INITIAL_MARKETS);
    setInspectedFormulaId(null);
    setLiveToast(null);
  };

  const activeFormula =
    selectedAnalysis.formulas.find(
      (f) => f.formulaId === inspectedFormulaId
    ) ?? selectedAnalysis.bestFormula;

  const bangkokNow = getBangkokTimeParts(nowTime);
  const lastUpdatedText = `${bangkokNow.timeLabel} น.`;
  const selectedRoundStatus = getMarketRoundStatus(
    selectedAnalysis.market,
    nowTime
  );
  const nextUpcoming = useMemo(
    () => getNextUpcomingMarket(markets, nowTime),
    [markets, nowTime]
  );

  const hasCustomDraws = markets.some(
    (m, i) => m.draws.length !== INITIAL_MARKETS[i].draws.length
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenRecordModal={() => setIsRecordModalOpen(true)}
      />

      {/* Workspace Sub-Toolbar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="font-mono font-semibold tabular-nums text-slate-800">
              เวลาไทย {lastUpdatedText}
            </span>
            <span aria-hidden="true">·</span>
            {nextUpcoming && (
              <>
                <span className="font-mono tabular-nums text-slate-700">
                  รอบถัดไป: {nextUpcoming.market.shortName} (
                  {nextUpcoming.market.drawTime} · อีก{' '}
                  {formatDurationThai(nextUpcoming.countdownSeconds)})
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="text-emerald-700 font-semibold">
              แม่นยำสูง (&ge;{accuracyThreshold}%): {alerts.length} ตลาด
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRealtimeEnabled((v) => !v)}
              aria-pressed={realtimeEnabled}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                realtimeEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {realtimeEnabled
                  ? 'แจ้งผลตามรอบเวลา: เปิดอยู่'
                  : 'แจ้งผลตามรอบเวลา: ปิด'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsAlertDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Bell className="h-3.5 w-3.5 text-blue-600 shrink-0" aria-hidden="true" />
              <span>
                แจ้งเตือนแม่นยำสูง ({unreadCount > 0 ? unreadCount : alerts.length})
              </span>
            </button>

            {hasCustomDraws && (
              <button
                type="button"
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>รีเซ็ตสถิติ</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden border-t border-slate-100 px-4 py-2 gap-1 overflow-x-auto">
          {(
            [
              { id: 'overview', label: 'ภาพรวมสูตรเน้น' },
              { id: 'formulas', label: '5 สูตร' },
              { id: 'history', label: 'สถิติ 15 งวด' },
              { id: 'top-markets', label: 'ตลาดแม่นยำสูง' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time High-Accuracy Alert Toast */}
      {liveToast && (
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-6">
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <Bell
                className="mt-0.5 h-4 w-4 text-emerald-700 shrink-0"
                aria-hidden="true"
              />
              <div className="text-xs sm:text-sm text-emerald-950">
                <span className="font-bold">
                  แจ้งเตือนความแม่นยำสูง · {liveToast.marketName}
                </span>{' '}
                — {liveToast.reason} · รูด{' '}
                <strong className="font-mono tabular-nums">
                  {liveToast.runningTwo.join('-')}
                </strong>{' '}
                เน้น{' '}
                <strong className="font-mono tabular-nums">
                  {liveToast.focusOne}
                </strong>{' '}
                6 หาง{' '}
                <strong className="font-mono tabular-nums">
                  {liveToast.sixPairs.join(' ')}
                </strong>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleSelectMarket(liveToast.marketId);
                  setLiveToast(null);
                }}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
              >
                ดูสูตรตลาดนี้
              </button>
              <button
                type="button"
                onClick={() => setLiveToast(null)}
                aria-label="ปิดการแจ้งเตือน"
                className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6">
        {activeTab === 'top-markets' ? (
          <TopMarketsView
            analyses={analyses}
            accuracyThreshold={accuracyThreshold}
            onJumpToMarket={(id) => {
              setSelectedMarketId(id);
              setInspectedFormulaId(null);
              setActiveTab('overview');
            }}
          />
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="order-2 lg:order-1 w-full lg:w-[296px] lg:shrink-0">
              <MarketSidebar
                analyses={analyses}
                selectedMarketId={selectedAnalysis.market.id}
                onSelectMarket={handleSelectMarket}
                categoryFilter={categoryFilter}
                onChangeCategory={setCategoryFilter}
                searchQuery={searchQuery}
                onChangeSearch={setSearchQuery}
                accuracyThreshold={accuracyThreshold}
              />
            </div>

            <div className="order-1 lg:order-2 min-w-0 flex-1 space-y-5">
              {/* Compact Mobile Market Selector */}
              <div className="lg:hidden rounded-xl border border-slate-200 bg-white p-3.5">
                <label
                  htmlFor="mobile-market-select"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  เปลี่ยนตลาดคำนวณด่วน (30 ตลาด)
                </label>
                <select
                  id="mobile-market-select"
                  value={selectedAnalysis.market.id}
                  onChange={(e) => handleSelectMarket(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                >
                  {analyses.map((a) => (
                    <option key={a.market.id} value={a.market.id}>
                      {a.market.name} — {a.bestFormula.runningHits}/15 (
                      {a.bestFormula.accuracyPercent}%)
                    </option>
                  ))}
                </select>
              </div>

              {(activeTab === 'overview' || activeTab === 'formulas') && (
                <CuratedPicksHero
                  analysis={selectedAnalysis}
                  roundStatus={selectedRoundStatus}
                  onOpenRecordModal={() => setIsRecordModalOpen(true)}
                  lastUpdatedText={lastUpdatedText}
                />
              )}

              {(activeTab === 'overview' || activeTab === 'formulas') && (
                <FormulaComparison
                  formulas={selectedAnalysis.formulas}
                  inspectedFormulaId={activeFormula.formulaId}
                  onInspectFormula={(id) => {
                    setInspectedFormulaId(id);
                  }}
                  accuracyThreshold={accuracyThreshold}
                />
              )}

              {(activeTab === 'overview' || activeTab === 'history') && (
                <HistoryTable
                  formulas={selectedAnalysis.formulas}
                  inspectedFormula={activeFormula}
                  onSelectFormula={(id) => setInspectedFormulaId(id)}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <AlertCenterDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        threshold={accuracyThreshold}
        onChangeThreshold={setAccuracyThreshold}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onMarkAllRead={() =>
          setReadAlertIds(new Set(alerts.map((a) => a.id)))
        }
        onJumpToMarket={(id) => handleSelectMarket(id)}
      />

      <RecordDrawModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        markets={markets}
        defaultMarketId={selectedAnalysis.market.id}
        onSubmitDraw={handleManualSubmitDraw}
      />
    </div>
  );
}
