export const BASE_SCENARIO_PRICES = Object.freeze([200, 180, 150, 140, 100]);

export type HedgeInputs = {
  sharesOwned: number;
  sharePurchasePrice: number;
  putStrike: number;
  contractsBought: number;
  premiumPerShare: number;
  taxRate: number;
};

export type ScenarioCheckpoint = {
  id: string;
  price: number;
};

const toNumber = (value: number | string | null | undefined, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp01 = (value: number): number => {
  const num = toNumber(value, 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
};

export const computePutCost = (premiumPerShare: number, contractsBought: number): number => {
  const premium = toNumber(premiumPerShare);
  const contracts = toNumber(contractsBought);
  return premium * 100 * contracts;
};

export const computeStockPL = (
  futurePrice: number,
  sharePurchasePrice: number,
  sharesOwned: number
): number => {
  const price = toNumber(futurePrice);
  const purchase = toNumber(sharePurchasePrice);
  const shares = toNumber(sharesOwned);
  return (price - purchase) * shares;
};

export const computePutValue = (putStrike: number, futurePrice: number, contractsBought: number): number => {
  const strike = toNumber(putStrike);
  const price = toNumber(futurePrice);
  const contracts = toNumber(contractsBought);
  return Math.max(strike - price, 0) * 100 * contracts;
};

export const computeNetResult = (
  futurePrice: number,
  params: HedgeInputs,
  overrides: { putCost?: number } = {}
): number => {
  const putCost = overrides.putCost ?? computePutCost(params.premiumPerShare, params.contractsBought);
  const stockPL = computeStockPL(futurePrice, params.sharePurchasePrice, params.sharesOwned);
  const putValue = computePutValue(params.putStrike, futurePrice, params.contractsBought);
  return stockPL + putValue - putCost;
};

export const computeTaxImpact = (netResult: number, taxRate: number): number => {
  const net = toNumber(netResult);
  const rate = clamp01(taxRate);
  return net * rate;
};

export const computeAfterTaxNet = (netResult: number, taxRate: number): number => {
  const net = toNumber(netResult);
  return net - computeTaxImpact(net, taxRate);
};

export const computeBreakEvenPrice = (
  sharePurchasePrice: number,
  sharesOwned: number,
  putCost: number
): number => {
  const purchase = toNumber(sharePurchasePrice);
  const shares = toNumber(sharesOwned, 1) || 1;
  const cost = toNumber(putCost);
  return purchase + cost / shares;
};

export const computeHedgeEffectiveness = (unhedged: number, hedged: number): number => {
  const base = toNumber(unhedged);
  const hedge = toNumber(hedged);

  if (base < 0) {
    const improvement = 1 - hedge / (base || -1);
    return Math.max(0, Math.min(1, improvement));
  }

  if (base === 0) {
    return hedge >= 0 ? 1 : 0;
  }

  if (hedge >= base) {
    return 1;
  }

  const capture = hedge / base;
  return Math.max(0, Math.min(1, capture));
};

export const computeWorstCaseLoss = (
  params: HedgeInputs,
  overrides: { putCost?: number } = {}
): number => {
  const putCost = overrides.putCost ?? computePutCost(params.premiumPerShare, params.contractsBought);
  const zeroPrice = computeNetResult(0, params, { putCost });
  const atStrike = computeNetResult(params.putStrike, params, { putCost });
  return Math.min(zeroPrice, atStrike);
};

export const formatProtectedDownsideRange = (
  putStrike: number,
  worstCaseLoss: number,
  formatter: (value: number) => string = (value) => `$${value.toFixed(0)}`
): string => {
  const strike = toNumber(putStrike, 0);
  const loss = Math.abs(toNumber(worstCaseLoss));
  return `Down to $${strike.toFixed(0)} | Max loss ${formatter(loss)}`;
};

const extractCheckpointPrices = (checkpoints: ScenarioCheckpoint[] = []): number[] =>
  checkpoints
    .map((checkpoint) => toNumber(checkpoint?.price, Number.NaN))
    .filter((value) => Number.isFinite(value));

export type ScenarioRow = {
  price: number;
  stockPL: number;
  putValue: number;
  netResult: number;
  taxImpact: number;
  netAfterTax: number;
};

export const generateScenarioRows = (
  params: HedgeInputs,
  checkpoints: ScenarioCheckpoint[] = [],
  basePrices: readonly number[] = BASE_SCENARIO_PRICES,
  overrides: { putCost?: number } = {}
): ScenarioRow[] => {
  const putCost = overrides.putCost ?? computePutCost(params.premiumPerShare, params.contractsBought);
  const prices = new Set<number>(basePrices);
  extractCheckpointPrices(checkpoints).forEach((price) => {
    prices.add(Math.round(price));
  });

  return Array.from(prices)
    .sort((a, b) => b - a)
    .map((price) => {
      const netResult = computeNetResult(price, params, { putCost });
      const taxImpact = computeTaxImpact(netResult, params.taxRate);
      return {
        price,
        stockPL: computeStockPL(price, params.sharePurchasePrice, params.sharesOwned),
        putValue: computePutValue(params.putStrike, price, params.contractsBought),
        netResult,
        taxImpact,
        netAfterTax: computeAfterTaxNet(netResult, params.taxRate),
      };
    });
};

export type ChartDatum = {
  price: number;
  hedged: number;
  unhedged: number;
  hedgedAfterTax: number;
};

export const generateChartData = (
  params: HedgeInputs & { futureStockPrice: number },
  checkpoints: ScenarioCheckpoint[] = [],
  options: { steps?: number } = {},
  overrides: { putCost?: number } = {}
): ChartDatum[] => {
  const { steps = 80 } = options;
  const putCost = overrides.putCost ?? computePutCost(params.premiumPerShare, params.contractsBought);
  const basePrices = [
    params.sharePurchasePrice,
    params.putStrike,
    params.futureStockPrice,
    ...BASE_SCENARIO_PRICES,
    ...extractCheckpointPrices(checkpoints),
  ].map((price) => toNumber(price, 0));

  const minPrice = Math.max(0, Math.min(...basePrices) - 120);
  const maxPrice = Math.max(...basePrices, 0) + 120;
  const safeSteps = Math.max(1, steps);
  const span = Math.max(20, maxPrice - minPrice);
  const increment = span / safeSteps;

  return Array.from({ length: safeSteps + 1 }, (_, index) => {
    const price = Math.round((minPrice + increment * index) * 100) / 100;
    const netResult = computeNetResult(price, params, { putCost });
    return {
      price,
      hedged: netResult,
      unhedged: computeStockPL(price, params.sharePurchasePrice, params.sharesOwned),
      hedgedAfterTax: computeAfterTaxNet(netResult, params.taxRate),
    };
  });
};
