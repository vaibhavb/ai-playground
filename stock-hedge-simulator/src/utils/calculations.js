const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const BASE_SCENARIO_PRICES = Object.freeze([200, 180, 150, 140, 100]);

const clampRate = (value) => {
  const number = toFiniteNumber(value, 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
};

export function computePutCost(premiumPerShare, contractsBought) {
  const premium = toFiniteNumber(premiumPerShare);
  const contracts = toFiniteNumber(contractsBought);
  return premium * 100 * contracts;
}

export function computeStockPL(price, sharePurchasePrice, sharesOwned) {
  const futurePrice = toFiniteNumber(price);
  const purchasePrice = toFiniteNumber(sharePurchasePrice);
  const shares = toFiniteNumber(sharesOwned);
  return (futurePrice - purchasePrice) * shares;
}

export function computePutValue(putStrike, price, contractsBought) {
  const strike = toFiniteNumber(putStrike);
  const futurePrice = toFiniteNumber(price);
  const contracts = toFiniteNumber(contractsBought);
  return Math.max(strike - futurePrice, 0) * 100 * contracts;
}

export function computeNetResult(price, params, overrides = {}) {
  const putCost = overrides.putCost ?? computePutCost(params.premiumPerShare, params.contractsBought);
  const stockPL = computeStockPL(price, params.sharePurchasePrice, params.sharesOwned);
  const putValue = computePutValue(params.putStrike, price, params.contractsBought);
  return stockPL + putValue - putCost;
}

export function computeTaxImpact(netResult, taxRate) {
  const net = toFiniteNumber(netResult);
  const rate = clampRate(taxRate);
  return net * rate;
}

export function computeAfterTaxNet(netResult, taxRate) {
  const net = toFiniteNumber(netResult);
  return net - computeTaxImpact(net, taxRate);
}

export function computeBreakEvenPrice(sharePurchasePrice, sharesOwned, putCost) {
  const purchasePrice = toFiniteNumber(sharePurchasePrice);
  const shares = toFiniteNumber(sharesOwned, 1) || 1;
  const hedgeCost = toFiniteNumber(putCost);
  return purchasePrice + hedgeCost / shares;
}

export function computeHedgeEffectiveness(unhedged, hedged) {
  const rawUnhedged = toFiniteNumber(unhedged);
  const rawHedged = toFiniteNumber(hedged);

  if (rawUnhedged < 0) {
    const improvement = 1 - rawHedged / (rawUnhedged || -1);
    return Math.max(0, Math.min(1, improvement));
  }

  if (rawUnhedged === 0) {
    return rawHedged >= 0 ? 1 : 0;
  }

  if (rawHedged >= rawUnhedged) {
    return 1;
  }

  const capture = rawHedged / rawUnhedged;
  return Math.max(0, Math.min(1, capture));
}

export function computeWorstCaseLoss(params, overrides = {}) {
  const putCost = overrides.putCost ?? computePutCost(params.premiumPerShare, params.contractsBought);
  const zeroPrice = computeNetResult(0, params, { putCost });
  const atStrike = computeNetResult(params.putStrike, params, { putCost });
  return Math.min(zeroPrice, atStrike);
}

export function formatProtectedDownsideRange(putStrike, worstCaseLoss, formatter) {
  const strike = toFiniteNumber(putStrike, 0);
  const loss = Math.abs(toFiniteNumber(worstCaseLoss));
  const displayLoss = formatter ? formatter(loss) : `$${loss.toFixed(0)}`;
  return `Down to $${strike.toFixed(0)} | Max loss ${displayLoss}`;
}

const extractCheckpointPrices = (checkpoints = []) =>
  checkpoints
    .map((checkpoint) => toFiniteNumber(checkpoint?.price, null))
    .filter((value) => value !== null);

export function generateScenarioRows(
  params,
  checkpoints = [],
  basePrices = BASE_SCENARIO_PRICES,
  overrides = {}
) {
  const putCost = overrides.putCost ?? computePutCost(params.premiumPerShare, params.contractsBought);
  const prices = new Set(basePrices);
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
}

export function generateChartData(params, checkpoints = [], options = {}, overrides = {}) {
  const { steps = 80 } = options;
  const putCost = overrides.putCost ?? computePutCost(params.premiumPerShare, params.contractsBought);
  const basePrices = [
    params.sharePurchasePrice,
    params.putStrike,
    params.futureStockPrice,
    ...BASE_SCENARIO_PRICES,
    ...extractCheckpointPrices(checkpoints),
  ].map((price) => toFiniteNumber(price, 0));

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
}

export default {
  BASE_SCENARIO_PRICES,
  computePutCost,
  computeStockPL,
  computePutValue,
  computeNetResult,
  computeTaxImpact,
  computeAfterTaxNet,
  computeBreakEvenPrice,
  computeHedgeEffectiveness,
  computeWorstCaseLoss,
  formatProtectedDownsideRange,
  generateScenarioRows,
  generateChartData,
};
