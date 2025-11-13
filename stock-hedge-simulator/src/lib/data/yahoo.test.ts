import { describe, expect, it, vi } from 'vitest';
import { fetchYahooQuote } from './yahoo';

describe('fetchYahooQuote', () => {
  it('requests Yahoo quote endpoint and parses payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        quoteResponse: {
          result: [
            {
              symbol: 'NVDA',
              regularMarketPrice: 100,
              currency: 'USD',
              regularMarketPreviousClose: 95,
              regularMarketTime: 1700000000,
            },
          ],
        },
      }),
    });

    const quote = await fetchYahooQuote('NVDA', mockFetch);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://query1.finance.yahoo.com/v7/finance/quote?symbols=NVDA'
    );
    expect(quote).toEqual({
      symbol: 'NVDA',
      price: 100,
      currency: 'USD',
      previousClose: 95,
      timestamp: 1700000000,
    });
  });

  it('throws when Yahoo returns no result', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ quoteResponse: { result: [] } }),
    });
    await expect(fetchYahooQuote('FAIL', mockFetch)).rejects.toThrow('Quote data missing for FAIL');
  });
});
