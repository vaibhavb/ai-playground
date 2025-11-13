import { describe, expect, it } from 'vitest';
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
  type HedgeInputs,
} from './calculations';

const baseInputs: HedgeInputs = {
  sharesOwned: 1000,
  sharePurchasePrice: 187,
  putStrike: 150,
  contractsBought: 10,
  premiumPerShare: 10,
  taxRate: 0.25,
};

describe('computePutCost', () => {
  it('multiplies premium by contract size and count', () => {
    expect(computePutCost(10, 10)).toBe(10000);
  });
});

describe('computeStockPL', () => {
  it('calculates profit for positive move', () => {
    expect(computeStockPL(200, 187, 1000)).toBeCloseTo(13000);
  });
});

describe('computePutValue', () => {
  it('is zero when price above strike', () => {
    expect(computePutValue(150, 200, 10)).toBe(0);
  });

  it('pays intrinsic value when in the money', () => {
    expect(computePutValue(150, 100, 10)).toBe(50000);
  });
});

describe('computeNetResult', () => {
  it('combines stock P/L and hedge payoff minus cost', () => {
    const result = computeNetResult(140, baseInputs);
    expect(result).toBeCloseTo(-47000);
  });
});

describe('computeTaxImpact', () => {
  it('clamps tax rate and returns liability', () => {
    expect(computeTaxImpact(1000, 2)).toBe(1000);
  });
});

describe('computeAfterTaxNet', () => {
  it('subtracts tax impact from net result', () => {
    expect(computeAfterTaxNet(1000, 0.25)).toBe(750);
  });
});

describe('computeBreakEvenPrice', () => {
  it('adds per-share hedge cost to purchase price', () => {
    const putCost = computePutCost(baseInputs.premiumPerShare, baseInputs.contractsBought);
    expect(computeBreakEvenPrice(baseInputs.sharePurchasePrice, baseInputs.sharesOwned, putCost)).toBeCloseTo(197);
  });
});

describe('computeHedgeEffectiveness', () => {
  it('returns improvement ratio for losses', () => {
    const unhedged = computeStockPL(100, baseInputs.sharePurchasePrice, baseInputs.sharesOwned);
    const hedged = computeNetResult(100, baseInputs);
    expect(computeHedgeEffectiveness(unhedged, hedged)).toBeGreaterThan(0);
  });
});

describe('computeWorstCaseLoss', () => {
  it('evaluates zero price and strike scenarios', () => {
    const worst = computeWorstCaseLoss(baseInputs);
    expect(worst).toBeLessThan(0);
  });
});

describe('formatProtectedDownsideRange', () => {
  it('returns formatted string with strike and loss', () => {
    const formatted = formatProtectedDownsideRange(150, -25000, (value) => `$${value.toFixed(0)}`);
    expect(formatted).toContain('150');
    expect(formatted).toContain('25000');
  });
});

describe('generateScenarioRows', () => {
  it('includes base scenario prices and checkpoints', () => {
    const rows = generateScenarioRows(baseInputs, [
      { id: 'custom', price: 123 },
    ]);
    const prices = rows.map((row) => row.price);
    BASE_SCENARIO_PRICES.forEach((price) => expect(prices).toContain(price));
    expect(prices).toContain(123);
  });
});

describe('generateChartData', () => {
  it('generates smooth dataset across price range', () => {
    const rows = generateChartData({ ...baseInputs, futureStockPrice: 210 }, [], { steps: 10 });
    expect(rows).toHaveLength(11);
    rows.forEach((row) => {
      expect(row).toHaveProperty('hedged');
      expect(row).toHaveProperty('unhedged');
      expect(row).toHaveProperty('hedgedAfterTax');
    });
  });
});
