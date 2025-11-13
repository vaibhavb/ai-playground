import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addMonths, format, formatISO } from 'date-fns';
import clsx from 'clsx';
import InputPanel from './components/InputPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import ScenarioChart from './components/ScenarioChart.jsx';
import ScenarioTable from './components/ScenarioTable.jsx';
import {
  BASE_SCENARIO_PRICES,
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
} from './utils/calculations.js';
import './App.css';

const STOCK_UNIVERSE = [
  {
    symbol: 'NVDA',
    label: 'NVIDIA (NVDA)',
    stooqSymbol: 'nvda.us',
    optionSymbol: 'NVDA',
  },
  {
    symbol: 'BRK.B',
    label: 'Berkshire Hathaway B (BRK.B)',
    stooqSymbol: 'brk-b.us',
    optionSymbol: 'BRK-B',
  },
  {
    symbol: 'ASML',
    label: 'ASML Holding (ASML)',
    stooqSymbol: 'asml.us',
    optionSymbol: 'ASML',
  },
  {
    symbol: 'AAPL',
    label: 'Apple (AAPL)',
    stooqSymbol: 'aapl.us',
    optionSymbol: 'AAPL',
  },
];

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
  taxRate: 0.25,
};

const formatCurrency = (value, options = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(value);

const parseStooqQuote = (raw) => {
  if (!raw) return null;
  const [line] = raw.trim().split('\n');
  if (!line) return null;
  const [symbol, date, time, , , , close] = line.split(',');
  if (!symbol || !close) return null;
  const price = Number(close);
  if (!Number.isFinite(price)) return null;
  let asOf = null;
  if (date && date.length === 8) {
    const year = date.slice(0, 4);
    const month = date.slice(4, 6);
    const day = date.slice(6, 8);
    let iso = `${year}-${month}-${day}`;
    if (time && time.length === 6) {
      const hours = time.slice(0, 2);
      const minutes = time.slice(2, 4);
      const seconds = time.slice(4, 6);
      iso += `T${hours}:${minutes}:${seconds}Z`;
    }
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      asOf = parsed;
    }
  }
  return { price, asOf };
};

const buildPutQuotes = (payload) => {
  const result = payload?.optionChain?.result?.[0];
  if (!result) return [];
  const optionSeries = Array.isArray(result.options) ? result.options : [];
  const quotes = [];
  optionSeries.forEach((series) => {
    const expiration = typeof series?.expirationDate === 'number' ? series.expirationDate : null;
    const expirationDate = expiration ? new Date(expiration * 1000) : null;
    const puts = Array.isArray(series?.puts) ? series.puts : [];
    puts.forEach((put) => {
      const strike = Number(put?.strike ?? NaN);
      if (!Number.isFinite(strike)) return;
      const lastPrice = Number(put?.lastPrice ?? NaN);
      const bid = Number(put?.bid ?? NaN);
      const ask = Number(put?.ask ?? NaN);
      let premium = lastPrice;
      if (!Number.isFinite(premium)) {
        if (Number.isFinite(bid) && Number.isFinite(ask)) {
          premium = (bid + ask) / 2;
        } else if (Number.isFinite(bid)) {
          premium = bid;
        } else if (Number.isFinite(ask)) {
          premium = ask;
        } else {
          return;
        }
      }
      quotes.push({
        id: `${expiration ?? 'na'}-${strike}`,
        strike,
        premium,
        bid: Number.isFinite(bid) ? bid : null,
        ask: Number.isFinite(ask) ? ask : null,
        lastPrice: Number.isFinite(lastPrice) ? lastPrice : null,
        expiration,
        expirationDate,
        expirationLabel: expirationDate ? format(expirationDate, 'MMM d, yyyy') : '—',
        inTheMoney: Boolean(put?.inTheMoney),
      });
    });
  });

  return quotes.sort((a, b) => {
    if (a.expiration === b.expiration) {
      return a.strike - b.strike;
    }
    if (a.expiration == null) return 1;
    if (b.expiration == null) return -1;
    return a.expiration - b.expiration;
  });
};

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [selectedSymbol, setSelectedSymbol] = useState(STOCK_UNIVERSE[0].symbol);
  const [scenarioCheckpoints, setScenarioCheckpoints] = useState([]);
  const [checkpointCounter, setCheckpointCounter] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [marketState, setMarketState] = useState({
    price: null,
    asOf: null,
    loading: true,
    error: null,
  });
  const [optionState, setOptionState] = useState({
    quotes: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });
  const [quoteRefreshToken, setQuoteRefreshToken] = useState(0);
  const [optionRefreshToken, setOptionRefreshToken] = useState(0);
  const symbolSyncRef = useRef(true);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const activeStock = useMemo(
    () => STOCK_UNIVERSE.find((item) => item.symbol === selectedSymbol) ?? STOCK_UNIVERSE[0],
    [selectedSymbol]
  );

  useEffect(() => {
    let isCancelled = false;
    if (!activeStock) return () => {};

    setMarketState((current) => ({ ...current, loading: true, error: null }));

    async function loadQuote() {
      try {
        const response = await fetch(`https://stooq.com/q/l/?s=${activeStock.stooqSymbol}&i=d`);
        if (!response.ok) {
          throw new Error('Quote unavailable');
        }
        const text = await response.text();
        const parsed = parseStooqQuote(text);
        if (!parsed) {
          throw new Error('Invalid price data');
        }
        if (isCancelled) return;
        setMarketState({ ...parsed, loading: false, error: null });
        if (symbolSyncRef.current && Number.isFinite(parsed.price)) {
          symbolSyncRef.current = false;
          setInputs((current) => ({
            ...current,
            sharePurchasePrice: Number(parsed.price.toFixed(2)),
            futureStockPrice: Number(parsed.price.toFixed(2)),
            putStrike: Math.max(1, Math.round(parsed.price * 0.9)),
          }));
        }
      } catch (error) {
        if (isCancelled) return;
        setMarketState({ price: null, asOf: null, loading: false, error: error.message });
      }
    }

    loadQuote();

    return () => {
      isCancelled = true;
    };
  }, [activeStock, quoteRefreshToken]);

  useEffect(() => {
    let isCancelled = false;
    if (!activeStock) return () => {};

    setOptionState((current) => ({ ...current, loading: true, error: null }));

    async function loadOptions() {
      try {
        const response = await fetch(
          `https://query2.finance.yahoo.com/v7/finance/options/${activeStock.optionSymbol}`
        );
        if (!response.ok) {
          throw new Error('Option chain unavailable');
        }
        const payload = await response.json();
        const quotes = buildPutQuotes(payload);
        if (isCancelled) return;
        setOptionState({
          quotes,
          loading: false,
          error: quotes.length === 0 ? 'No put quotes returned.' : null,
          lastUpdated: new Date(),
        });
      } catch (error) {
        if (isCancelled) return;
        setOptionState({ quotes: [], loading: false, error: error.message, lastUpdated: null });
      }
    }

    loadOptions();

    return () => {
      isCancelled = true;
    };
  }, [activeStock, optionRefreshToken]);

  const calculationInputs = useMemo(
    () => ({
      sharesOwned: inputs.sharesOwned,
      sharePurchasePrice: inputs.sharePurchasePrice,
      putStrike: inputs.putStrike,
      contractsBought: inputs.contractsBought,
      premiumPerShare: inputs.premiumPerShare,
      futureStockPrice: inputs.futureStockPrice,
      taxRate: inputs.taxRate,
    }),
    [
      inputs.sharesOwned,
      inputs.sharePurchasePrice,
      inputs.putStrike,
      inputs.contractsBought,
      inputs.premiumPerShare,
      inputs.futureStockPrice,
      inputs.taxRate,
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

  const taxImpact = useMemo(
    () => computeTaxImpact(netPL, inputs.taxRate),
    [netPL, inputs.taxRate]
  );

  const netAfterTax = useMemo(
    () => computeAfterTaxNet(netPL, inputs.taxRate),
    [netPL, inputs.taxRate]
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

  const optionSuggestions = useMemo(() => {
    if (!optionState.quotes.length) return [];
    const referencePrice =
      marketState.price ?? calculationInputs.futureStockPrice ?? calculationInputs.sharePurchasePrice;
    return [...optionState.quotes]
      .sort((a, b) => {
        const distanceA = Math.abs(a.strike - referencePrice);
        const distanceB = Math.abs(b.strike - referencePrice);
        if (distanceA === distanceB) {
          const expA = a.expiration ?? Number.POSITIVE_INFINITY;
          const expB = b.expiration ?? Number.POSITIVE_INFINITY;
          return expA - expB;
        }
        return distanceA - distanceB;
      })
      .slice(0, 8);
  }, [
    optionState.quotes,
    marketState.price,
    calculationInputs.futureStockPrice,
    calculationInputs.sharePurchasePrice,
  ]);

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
    symbolSyncRef.current = true;
    setInputs({ ...DEFAULT_INPUTS });
    setSelectedSymbol(STOCK_UNIVERSE[0].symbol);
    setScenarioCheckpoints([]);
    setCheckpointCounter(1);
    setQuoteRefreshToken((value) => value + 1);
    setOptionRefreshToken((value) => value + 1);
  }, []);

  const handleSymbolChange = useCallback((symbol) => {
    symbolSyncRef.current = true;
    setSelectedSymbol(symbol);
    setQuoteRefreshToken((value) => value + 1);
    setOptionRefreshToken((value) => value + 1);
  }, []);

  const handleRefreshMarketData = useCallback(() => {
    setQuoteRefreshToken((value) => value + 1);
    setOptionRefreshToken((value) => value + 1);
  }, []);

  const handleApplyLivePrice = useCallback(() => {
    if (!Number.isFinite(marketState.price)) return;
    setInputs((current) => ({
      ...current,
      futureStockPrice: Number(marketState.price.toFixed(2)),
    }));
  }, [marketState.price]);

  const handleApplyLiveBasis = useCallback(() => {
    if (!Number.isFinite(marketState.price)) return;
    setInputs((current) => ({
      ...current,
      sharePurchasePrice: Number(marketState.price.toFixed(2)),
    }));
  }, [marketState.price]);

  const handleMaxProtection = useCallback(() => {
    setInputs((current) => ({
      ...current,
      putStrike: Math.round(Math.max(current.sharePurchasePrice, current.putStrike)),
      contractsBought: Math.ceil(current.sharesOwned / 100),
    }));
  }, []);

  const handleApplyPutQuote = useCallback((quote) => {
    setInputs((current) => ({
      ...current,
      putStrike: Math.round(quote.strike * 100) / 100,
      premiumPerShare: Number(quote.premium.toFixed(2)),
      putExpirationDate: quote.expirationDate
        ? formatISO(quote.expirationDate, { representation: 'date' })
        : current.putExpirationDate,
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
      taxImpact,
      netAfterTax,
      hedgeEffectiveness,
      protectedDownside,
      breakEvenPrice,
      taxRate: inputs.taxRate,
    }),
    [
      stockPL,
      putValue,
      putCost,
      netPL,
      taxImpact,
      netAfterTax,
      hedgeEffectiveness,
      protectedDownside,
      breakEvenPrice,
      inputs.taxRate,
    ]
  );

  return (
    <div className={clsx('app-shell', { dark: isDarkMode })}>
      <header className="app-header">
        <div>
          <h1>Stock Hedge Simulator</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Explore how protective puts reshape your {activeStock.label} exposure with live quotes and
            after-tax insights.
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
            stocks={STOCK_UNIVERSE}
            selectedSymbol={selectedSymbol}
            marketState={marketState}
            optionState={optionState}
            optionSuggestions={optionSuggestions}
            onNumberChange={handleNumberChange}
            onTextChange={handleTextChange}
            onExpirationChange={handleExpirationChange}
            onReset={handleReset}
            onRefreshMarketData={handleRefreshMarketData}
            onApplyLivePrice={handleApplyLivePrice}
            onApplyLiveBasis={handleApplyLiveBasis}
            onMaxProtection={handleMaxProtection}
            onSymbolChange={handleSymbolChange}
            onApplyPutQuote={handleApplyPutQuote}
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
            taxRate={inputs.taxRate}
            symbol={activeStock.symbol}
          />
          <ScenarioChart
            data={chartData}
            putStrike={inputs.putStrike}
            isDark={isDarkMode}
            symbol={activeStock.symbol}
          />
        </div>
      </div>
    </div>
  );
}
