import { addDays, formatISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { InputPanel, type SimulatorState, type SymbolPreset } from './components/input-panel';
import { ResultsPanel } from './components/results-panel';
import { ScenarioChart } from './components/scenario-chart';
import { ScenarioTable } from './components/scenario-table';
import { OptionChainPanel } from './components/option-chain';
import { useQuote } from './hooks/useQuote';
import { useOptionChain } from './hooks/useOptionChain';
import {
  computeAfterTaxNet,
  computeBreakEvenPrice,
  computeHedgeEffectiveness,
  computeNetResult,
  computePutCost,
  computePutValue,
  computeStockPL,
  computeTaxImpact,
  computeWorstCaseLoss,
  formatProtectedDownsideRange,
  generateChartData,
  generateScenarioRows,
  type HedgeInputs,
  type ScenarioCheckpoint,
} from './lib/calculations';

const SYMBOL_PRESETS: SymbolPreset[] = [
  { id: 'nvda', label: 'NVIDIA (NVDA)', ticker: 'NVDA', quoteSymbol: 'NVDA', optionSymbol: 'NVDA' },
  { id: 'brkb', label: 'Berkshire Hathaway B (BRK.B)', ticker: 'BRK.B', quoteSymbol: 'BRK-B', optionSymbol: 'BRK.B' },
  { id: 'asml', label: 'ASML Holding (ASML)', ticker: 'ASML', quoteSymbol: 'ASML', optionSymbol: 'ASML' },
  { id: 'msft', label: 'Microsoft (MSFT)', ticker: 'MSFT', quoteSymbol: 'MSFT', optionSymbol: 'MSFT' },
];

const createDefaultState = (): SimulatorState => {
  const defaultExpiration = formatISO(addDays(new Date(), 90), { representation: 'date' });
  return {
    ticker: SYMBOL_PRESETS[0].ticker,
    quoteSymbol: SYMBOL_PRESETS[0].quoteSymbol,
    optionSymbol: SYMBOL_PRESETS[0].optionSymbol,
    sharesOwned: 1000,
    sharePurchasePrice: 187,
    putStrike: 150,
    contractsBought: 10,
    premiumPerShare: 10,
    putExpirationDate: defaultExpiration,
    analysisDate: defaultExpiration,
    futureStockPrice: 187,
    taxRate: 0.25,
    checkpoints: [],
  };
};

const randomId = () => Math.random().toString(36).slice(2, 10);

export default function App() {
  const [state, setState] = useState<SimulatorState>(createDefaultState);
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null);

  const { quote, isLoading: quoteLoading, error: quoteError, refresh: refreshQuote } = useQuote(state.quoteSymbol);
  const {
    chain,
    isLoading: optionLoading,
    error: optionError,
    refresh: refreshOptions,
  } = useOptionChain(state.optionSymbol);

  useEffect(() => {
    refreshQuote().catch((error) => console.error(error));
    refreshOptions().catch((error) => console.error(error));
    setSelectedExpiry(null);
  }, [state.quoteSymbol, state.optionSymbol, refreshQuote, refreshOptions]);

  useEffect(() => {
    if (chain && chain.expirations.length > 0 && !selectedExpiry) {
      setSelectedExpiry(chain.expirations[0].expiry);
    }
  }, [chain, selectedExpiry]);

  const hedgeInputs: HedgeInputs = useMemo(
    () => ({
      sharesOwned: state.sharesOwned,
      sharePurchasePrice: state.sharePurchasePrice,
      putStrike: state.putStrike,
      contractsBought: state.contractsBought,
      premiumPerShare: state.premiumPerShare,
      taxRate: state.taxRate,
    }),
    [state.contractsBought, state.premiumPerShare, state.putStrike, state.sharePurchasePrice, state.sharesOwned, state.taxRate]
  );

  const putCost = useMemo(
    () => computePutCost(state.premiumPerShare, state.contractsBought),
    [state.premiumPerShare, state.contractsBought]
  );

  const stockPL = useMemo(
    () => computeStockPL(state.futureStockPrice, state.sharePurchasePrice, state.sharesOwned),
    [state.futureStockPrice, state.sharePurchasePrice, state.sharesOwned]
  );

  const putValue = useMemo(
    () => computePutValue(state.putStrike, state.futureStockPrice, state.contractsBought),
    [state.putStrike, state.futureStockPrice, state.contractsBought]
  );

  const netResult = useMemo(
    () => computeNetResult(state.futureStockPrice, hedgeInputs, { putCost }),
    [state.futureStockPrice, hedgeInputs, putCost]
  );

  const taxImpact = useMemo(() => computeTaxImpact(netResult, state.taxRate), [netResult, state.taxRate]);
  const netAfterTax = useMemo(() => computeAfterTaxNet(netResult, state.taxRate), [netResult, state.taxRate]);
  const breakEven = useMemo(
    () => computeBreakEvenPrice(state.sharePurchasePrice, state.sharesOwned, putCost),
    [state.sharePurchasePrice, state.sharesOwned, putCost]
  );
  const effectiveness = useMemo(() => computeHedgeEffectiveness(stockPL, netResult), [stockPL, netResult]);
  const worstCase = useMemo(() => computeWorstCaseLoss(hedgeInputs, { putCost }), [hedgeInputs, putCost]);
  const protectedRange = useMemo(
    () => formatProtectedDownsideRange(state.putStrike, worstCase, (value) => `$${value.toFixed(0)}`),
    [state.putStrike, worstCase]
  );
  const scenarioRows = useMemo(
    () => generateScenarioRows(hedgeInputs, state.checkpoints),
    [hedgeInputs, state.checkpoints]
  );
  const chartData = useMemo(
    () => generateChartData({ ...hedgeInputs, futureStockPrice: state.futureStockPrice }, state.checkpoints),
    [hedgeInputs, state.futureStockPrice, state.checkpoints]
  );

  const updateState = (changes: Partial<SimulatorState>) => {
    setState((prev) => ({
      ...prev,
      ...changes,
    }));
  };

  const handleReset = () => setState(createDefaultState());

  const handleUseLivePrice = () => {
    if (!quote) return;
    updateState({
      sharePurchasePrice: Number(quote.price.toFixed(2)),
      futureStockPrice: Number(quote.price.toFixed(2)),
    });
  };

  const handleMaxProtection = () => {
    const targetStrike = Math.max(state.sharePurchasePrice, quote?.price ?? state.putStrike);
    updateState({
      putStrike: Math.round(targetStrike / 5) * 5,
      contractsBought: Math.ceil(state.sharesOwned / 100),
    });
  };

  const handleAddCheckpoint = () => {
    const next: ScenarioCheckpoint = { id: randomId(), price: Math.round(state.futureStockPrice) };
    updateState({ checkpoints: [...state.checkpoints, next] });
  };

  const handleUpdateCheckpoint = (id: string, price: number) => {
    updateState({
      checkpoints: state.checkpoints.map((checkpoint) =>
        checkpoint.id === id ? { ...checkpoint, price } : checkpoint
      ),
    });
  };

  const handleRemoveCheckpoint = (id: string) => {
    updateState({ checkpoints: state.checkpoints.filter((checkpoint) => checkpoint.id !== id) });
  };

  const handleApplyOption = (strike: number, premium: number, expiry: string) => {
    updateState({
      putStrike: strike,
      premiumPerShare: Number(premium.toFixed(2)),
      putExpirationDate: expiry,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container space-y-8 py-8">
        <header className="space-y-2 text-center">
          <motion.h1
            className="text-3xl font-semibold tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Stock Hedge Simulator
          </motion.h1>
          <p className="text-sm text-muted-foreground/80">
            Model protective put overlays with live pricing, option-chain shortcuts, and tax-aware analytics across every scenario.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          <InputPanel
            state={state}
            presets={SYMBOL_PRESETS}
            quote={quote}
            quoteLoading={quoteLoading}
            quoteError={quoteError}
            optionLoading={optionLoading}
            onUpdate={updateState}
            onReset={handleReset}
            onUseLivePrice={handleUseLivePrice}
            onMaxProtection={handleMaxProtection}
            onAddCheckpoint={handleAddCheckpoint}
            onUpdateCheckpoint={handleUpdateCheckpoint}
            onRemoveCheckpoint={handleRemoveCheckpoint}
            onRefreshQuote={refreshQuote}
            onRefreshOptions={refreshOptions}
          />

          <div className="space-y-6">
            <ResultsPanel
              futurePrice={state.futureStockPrice}
              stockPL={stockPL}
              putValue={putValue}
              putCost={putCost}
              netResult={netResult}
              taxImpact={taxImpact}
              netAfterTax={netAfterTax}
              breakEven={breakEven}
              hedgeEffectiveness={effectiveness}
              protectedRange={protectedRange}
              worstCaseLoss={worstCase}
            />

            <OptionChainPanel
              chain={chain}
              selectedExpiry={selectedExpiry}
              onSelectExpiry={(value) => setSelectedExpiry(value)}
              onApply={handleApplyOption}
              isLoading={optionLoading}
              error={optionError}
            />

            <ScenarioChart data={chartData} putStrike={state.putStrike} breakEven={breakEven} />

            <ScenarioTable rows={scenarioRows} />
          </div>
        </div>
      </main>
    </div>
  );
}
