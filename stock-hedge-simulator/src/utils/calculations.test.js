import { describe, expect, it } from 'vitest';
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
} from './calculations.js';

const SAMPLE_INPUTS = {
  sharesOwned: 1000,
  sharePurchasePrice: 187,
  putStrike: 150,
  contractsBought: 10,
  premiumPerShare: 10,
  futureStockPrice: 160,
};

describe('hedge calculations', () => {
  it('computes stock, option, and net cash flows', () => {
    const putCost = computePutCost(SAMPLE_INPUTS.premiumPerShare, SAMPLE_INPUTS.contractsBought);
    expect(putCost).toBe(10000);

    const stockPL = computeStockPL(140, SAMPLE_INPUTS.sharePurchasePrice, SAMPLE_INPUTS.sharesOwned);
    expect(stockPL).toBe(-47000);

    const putValue = computePutValue(SAMPLE_INPUTS.putStrike, 140, SAMPLE_INPUTS.contractsBought);
    expect(putValue).toBe(10000);

    const netResult = computeNetResult(140, SAMPLE_INPUTS, { putCost });
    expect(netResult).toBe(-47000);
  });

  it('derives break-even prices from hedge costs', () => {
    const putCost = computePutCost(SAMPLE_INPUTS.premiumPerShare, SAMPLE_INPUTS.contractsBought);
    const breakEven = computeBreakEvenPrice(
      SAMPLE_INPUTS.sharePurchasePrice,
      SAMPLE_INPUTS.sharesOwned,
      putCost
    );
    expect(breakEven).toBeCloseTo(197, 5);
  });

  it('measures hedge effectiveness across regimes', () => {
    expect(computeHedgeEffectiveness(-40000, -5000)).toBeCloseTo(0.875, 3);
    expect(computeHedgeEffectiveness(0, 2000)).toBe(1);
    expect(computeHedgeEffectiveness(20000, 21000)).toBe(1);
    expect(computeHedgeEffectiveness(20000, 5000)).toBeCloseTo(0.25, 2);
  });

  it('reports worst case loss at strike or zero', () => {
    const putCost = computePutCost(SAMPLE_INPUTS.premiumPerShare, SAMPLE_INPUTS.contractsBought);
    const worstLoss = computeWorstCaseLoss(SAMPLE_INPUTS, { putCost });
    const netAtStrike = computeNetResult(SAMPLE_INPUTS.putStrike, SAMPLE_INPUTS, { putCost });
    const netAtZero = computeNetResult(0, SAMPLE_INPUTS, { putCost });
    expect(worstLoss).toBeLessThanOrEqual(Math.min(netAtStrike, netAtZero));
  });

  it('formats protected downside range summaries', () => {
    const summary = formatProtectedDownsideRange(150, -12345, (value) => `$${value.toFixed(0)}`);
    expect(summary).toBe('Down to $150 | Max loss $12345');
  });
});

describe('scenario helpers', () => {
  it('builds scenario rows with baseline checkpoints and user entries', () => {
    const putCost = computePutCost(SAMPLE_INPUTS.premiumPerShare, SAMPLE_INPUTS.contractsBought);
    const rows = generateScenarioRows(
      SAMPLE_INPUTS,
      [{ price: 123.4 }, { price: '200' }],
      BASE_SCENARIO_PRICES,
      { putCost }
    );

    const prices = rows.map((row) => row.price);
    BASE_SCENARIO_PRICES.forEach((price) => expect(prices).toContain(price));
    expect(prices).toContain(123);
    expect(rows[0]).toHaveProperty('stockPL');
    expect(rows[0]).toHaveProperty('putValue');
    expect(rows[0]).toHaveProperty('netResult');
  });

  it('generates chart data spanning surrounding prices', () => {
    const putCost = computePutCost(SAMPLE_INPUTS.premiumPerShare, SAMPLE_INPUTS.contractsBought);
    const chart = generateChartData(SAMPLE_INPUTS, [{ price: 90 }], { steps: 10 }, { putCost });
    expect(chart.length).toBe(11);
    const prices = chart.map((point) => point.price);
    expect(Math.min(...prices)).toBeGreaterThanOrEqual(0);
    const sample = chart[Math.floor(chart.length / 2)];
    expect(sample).toHaveProperty('hedged');
    expect(sample).toHaveProperty('unhedged');
  });
});
