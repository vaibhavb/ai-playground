import { useCallback, useEffect, useMemo, useState } from 'react';
import { addMonths, format } from 'date-fns';
import clsx from 'clsx';
import InputPanel from './components/InputPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import ScenarioChart from './components/ScenarioChart.jsx';
import ScenarioTable from './components/ScenarioTable.jsx';
import {
  BASE_SCENARIO_PRICES,
  computeBreakEvenPrice,
  computeHedgeEffectiveness,
  computeNetResult,
  computePutCost,
  computePutValue,
  computeStockPL,
  computeWorstCaseLoss,
  formatProtectedDownsideRange,
  generateChartData,
  generateScenarioRows,
} from './utils/calculations.js';
import './App.css';

const DEFAULT_EXPIRATION = format(addMonths(new Date(), 3), 'yyyy-MM-dd');

const DEFAULT_INPUTS = {
  sharesOwned: 1000,
  sharePurchasePrice: 187,
  putStrike: 150,
  putExpirationDate: DEFAULT_EXPIRATION,
  contractsBought: 10,
  premiumPerShare: 10,
  futureStockPrice: 160,
  analysisDate: DEFAULT_EXPIRATION,
};

const formatCurrency = (value, options = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(value);

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [scenarioCheckpoints, setScenarioCheckpoints] = useState([]);
  const [checkpointCounter, setCheckpointCounter] = useState(1);
  const [fetchState, setFetchState] = useState({ loading: false, error: null });
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const calculationInputs = useMemo(
    () => ({
      sharesOwned: inputs.sharesOwned,
      sharePurchasePrice: inputs.sharePurchasePrice,
      putStrike: inputs.putStrike,
      contractsBought: inputs.contractsBought,
      premiumPerShare: inputs.premiumPerShare,
      futureStockPrice: inputs.futureStockPrice,
    }),
    [
      inputs.sharesOwned,
      inputs.sharePurchasePrice,
      inputs.putStrike,
      inputs.contractsBought,
      inputs.premiumPerShare,
      inputs.futureStockPrice,
    ]
  );

  const putCost = useMemo(
    () => computePutCost(inputs.premiumPerShare, inputs.contractsBought),
    [inputs.premiumPerShare, inputs.contractsBought]
  );

  const hedgedAt = useCallback(
    (price) => computeNetResult(price, calculationInputs, { putCost }),
    [calculationInputs, putCost]
  );

  const stockPL = useMemo(
    () =>
      computeStockPL(
        calculationInputs.futureStockPrice,
        calculationInputs.sharePurchasePrice,
        calculationInputs.sharesOwned
      ),
    [
      calculationInputs.futureStockPrice,
      calculationInputs.sharePurchasePrice,
      calculationInputs.sharesOwned,
    ]
  );

  const putValue = useMemo(
    () =>
      computePutValue(
        calculationInputs.putStrike,
        calculationInputs.futureStockPrice,
        calculationInputs.contractsBought
      ),
    [
      calculationInputs.putStrike,
      calculationInputs.futureStockPrice,
      calculationInputs.contractsBought,
    ]
  );

  const netPL = useMemo(
    () => hedgedAt(calculationInputs.futureStockPrice),
    [hedgedAt, calculationInputs.futureStockPrice]
  );

  const breakEvenPrice = useMemo(
    () =>
      computeBreakEvenPrice(
        calculationInputs.sharePurchasePrice,
        calculationInputs.sharesOwned,
        putCost
      ),
    [calculationInputs.sharePurchasePrice, calculationInputs.sharesOwned, putCost]
  );

  const hedgeEffectiveness = useMemo(() => {
    const unhedged = stockPL;
    const hedged = netPL;
    return computeHedgeEffectiveness(unhedged, hedged);
  }, [stockPL, netPL]);

  const worstCaseLoss = useMemo(
    () => computeWorstCaseLoss(calculationInputs, { putCost }),
    [calculationInputs, putCost]
  );

  const protectedDownside = useMemo(
    () =>
      formatProtectedDownsideRange(
        calculationInputs.putStrike,
        worstCaseLoss,
        (value) => formatCurrency(value)
      ),
    [calculationInputs.putStrike, worstCaseLoss]
  );

  const scenarioRows = useMemo(() => {
    return generateScenarioRows(
      calculationInputs,
      scenarioCheckpoints,
      BASE_SCENARIO_PRICES,
      { putCost }
    );
  }, [calculationInputs, scenarioCheckpoints, putCost]);

  const chartData = useMemo(() => {
    return generateChartData(calculationInputs, scenarioCheckpoints, { steps: 80 }, { putCost });
  }, [calculationInputs, scenarioCheckpoints, putCost]);

  const handleNumberChange = useCallback((field, value) => {
    setInputs((current) => ({ ...current, [field]: value }));
  }, []);

  const handleTextChange = useCallback((field, value) => {
    setInputs((current) => ({ ...current, [field]: value }));
  }, []);

  const handleExpirationChange = useCallback((value) => {
    setInputs((current) => {
      const next = { ...current, putExpirationDate: value };
      if (!current.analysisDate || current.analysisDate === current.putExpirationDate) {
        next.analysisDate = value;
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setInputs({ ...DEFAULT_INPUTS });
    setScenarioCheckpoints([]);
    setCheckpointCounter(1);
  }, []);

  const handleUseTodayPrice = useCallback(async () => {
    try {
      setFetchState({ loading: true, error: null });
      const response = await fetch(
        'https://query1.finance.yahoo.com/v7/finance/quote?symbols=NVDA'
      );
      if (!response.ok) {
        throw new Error('Quote unavailable');
      }
      const payload = await response.json();
      const livePrice = Number(
        payload?.quoteResponse?.result?.[0]?.regularMarketPrice ?? NaN
      );
      if (!Number.isFinite(livePrice)) {
        throw new Error('Missing price in response');
      }
      setInputs((current) => ({
        ...current,
        futureStockPrice: Number(livePrice.toFixed(2)),
      }));
      setFetchState({ loading: false, error: null });
    } catch (error) {
      setFetchState({ loading: false, error: error.message });
    }
  }, []);

  const handleMaxProtection = useCallback(() => {
    setInputs((current) => ({
      ...current,
      putStrike: Math.round(Math.max(current.sharePurchasePrice, current.putStrike)),
      contractsBought: Math.ceil(current.sharesOwned / 100),
    }));
  }, []);

  const handleAddCheckpoint = useCallback(() => {
    setScenarioCheckpoints((current) => [
      ...current,
      { id: checkpointCounter, price: inputs.futureStockPrice },
    ]);
    setCheckpointCounter((value) => value + 1);
  }, [checkpointCounter, inputs.futureStockPrice]);

  const handleUpdateCheckpoint = useCallback((id, price) => {
    setScenarioCheckpoints((current) =>
      current.map((item) => (item.id === id ? { ...item, price } : item))
    );
  }, []);

  const handleRemoveCheckpoint = useCallback((id) => {
    setScenarioCheckpoints((current) => current.filter((item) => item.id !== id));
  }, []);

  const results = useMemo(
    () => ({
      stockPL,
      putValue,
      putCost,
      netPL,
      hedgeEffectiveness,
      protectedDownside,
      breakEvenPrice,
    }),
    [stockPL, putValue, putCost, netPL, hedgeEffectiveness, protectedDownside, breakEvenPrice]
  );

  return (
    <div className={clsx('app-shell', { dark: isDarkMode })}>
      <header className="app-header">
        <div>
          <h1>NVDA Hedge Simulator</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Explore how protective puts reshape your Nvidia stock exposure in real time.
          </p>
        </div>
        <label className="dark-toggle">
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={(event) => setIsDarkMode(event.target.checked)}
          />
          Dark mode
        </label>
      </header>

      <div className="main-grid">
        <div className="inputs-panel">
          <InputPanel
            inputs={inputs}
            onNumberChange={handleNumberChange}
            onTextChange={handleTextChange}
            onExpirationChange={handleExpirationChange}
            onReset={handleReset}
            onUseTodayPrice={handleUseTodayPrice}
            onMaxProtection={handleMaxProtection}
            isFetchingPrice={fetchState.loading}
            fetchError={fetchState.error}
            scenarioCheckpoints={scenarioCheckpoints}
            onAddCheckpoint={handleAddCheckpoint}
            onUpdateCheckpoint={handleUpdateCheckpoint}
            onRemoveCheckpoint={handleRemoveCheckpoint}
          />
        </div>
        <div className="insight-stack">
          <ResultsPanel metrics={results} />
          <ScenarioTable
            rows={scenarioRows}
            checkpoints={scenarioCheckpoints.map((item) => item.price)}
          />
          <ScenarioChart data={chartData} putStrike={inputs.putStrike} isDark={isDarkMode} />
        </div>
      </div>
    </div>
  );
}
