import { useCallback, useEffect, useMemo, useState } from 'react';
import { addMonths, format } from 'date-fns';
import clsx from 'clsx';
import InputPanel from './components/InputPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import ScenarioChart from './components/ScenarioChart.jsx';
import ScenarioTable from './components/ScenarioTable.jsx';
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

const DEFAULT_SCENARIOS = [200, 180, 150, 140, 100];

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

  const putCost = useMemo(
    () => inputs.premiumPerShare * 100 * inputs.contractsBought,
    [inputs.premiumPerShare, inputs.contractsBought]
  );

  const unhedgedAt = useCallback(
    (price) => (price - inputs.sharePurchasePrice) * inputs.sharesOwned,
    [inputs.sharePurchasePrice, inputs.sharesOwned]
  );

  const hedgedAt = useCallback(
    (price) => {
      const stockPL = unhedgedAt(price);
      const intrinsic = Math.max(inputs.putStrike - price, 0) * 100 * inputs.contractsBought;
      return stockPL + intrinsic - putCost;
    },
    [inputs.putStrike, inputs.contractsBought, putCost, unhedgedAt]
  );

  const stockPL = useMemo(
    () => unhedgedAt(inputs.futureStockPrice),
    [inputs.futureStockPrice, unhedgedAt]
  );

  const putValue = useMemo(
    () => Math.max(inputs.putStrike - inputs.futureStockPrice, 0) * 100 * inputs.contractsBought,
    [inputs.putStrike, inputs.futureStockPrice, inputs.contractsBought]
  );

  const netPL = useMemo(
    () => hedgedAt(inputs.futureStockPrice),
    [hedgedAt, inputs.futureStockPrice]
  );

  const breakEvenPrice = useMemo(() => {
    const denominator = inputs.sharesOwned || 1;
    return inputs.sharePurchasePrice + putCost / denominator;
  }, [inputs.sharePurchasePrice, inputs.sharesOwned, putCost]);

  const hedgeEffectiveness = useMemo(() => {
    const unhedged = stockPL;
    const hedged = netPL;

    if (unhedged < 0) {
      const improvement = 1 - hedged / (unhedged || -1);
      return Math.max(0, Math.min(1, improvement));
    }

    if (unhedged === 0) {
      return hedged >= 0 ? 1 : 0;
    }

    if (hedged >= unhedged) {
      return 1;
    }

    const capture = hedged / unhedged;
    return Math.max(0, Math.min(1, capture));
  }, [stockPL, netPL]);

  const worstCaseLoss = useMemo(() => {
    const lowestPrice = 0;
    const toZero = hedgedAt(lowestPrice);
    const atStrike = hedgedAt(inputs.putStrike);
    return Math.min(toZero, atStrike);
  }, [hedgedAt, inputs.putStrike]);

  const protectedDownside = useMemo(
    () => `Down to $${inputs.putStrike.toFixed(0)} | Max loss ${formatCurrency(Math.abs(worstCaseLoss))}`,
    [inputs.putStrike, worstCaseLoss]
  );

  const scenarioRows = useMemo(() => {
    const prices = new Set([...DEFAULT_SCENARIOS]);
    scenarioCheckpoints.forEach((checkpoint) => {
      if (Number.isFinite(checkpoint.price)) {
        prices.add(Math.round(checkpoint.price));
      }
    });
    const sorted = Array.from(prices).sort((a, b) => b - a);
    return sorted.map((price) => ({
      price,
      stockPL: unhedgedAt(price),
      putValue: Math.max(inputs.putStrike - price, 0) * 100 * inputs.contractsBought,
      netResult: hedgedAt(price),
    }));
  }, [inputs.contractsBought, inputs.putStrike, hedgedAt, scenarioCheckpoints, unhedgedAt]);

  const chartData = useMemo(() => {
    const minPrice = Math.max(
      0,
      Math.min(inputs.sharePurchasePrice, inputs.putStrike, inputs.futureStockPrice) - 120
    );
    const maxPrice = Math.max(
      inputs.sharePurchasePrice,
      inputs.putStrike,
      inputs.futureStockPrice,
      ...DEFAULT_SCENARIOS,
      ...scenarioCheckpoints.map((item) => item.price || 0)
    ) + 120;

    const steps = 80;
    const span = Math.max(20, maxPrice - minPrice);
    const increment = span / steps;
    return Array.from({ length: steps + 1 }, (_, index) => {
      const price = Math.round((minPrice + increment * index) * 100) / 100;
      return {
        price,
        hedged: hedgedAt(price),
        unhedged: unhedgedAt(price),
      };
    });
  }, [hedgedAt, unhedgedAt, inputs.sharePurchasePrice, inputs.putStrike, inputs.futureStockPrice, scenarioCheckpoints]);

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
