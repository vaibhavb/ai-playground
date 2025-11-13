import { describe, expect, it, vi } from 'vitest';
import { fetchYahooQuote } from './yahoo';

describe('fetchYahooQuote', () => {
  it('requests Yahoo quote endpoint and parses payload', async () => {
    const payload = {
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
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(payload),
    });

    const quote = await fetchYahooQuote('NVDA', mockFetch);
    expect(mockFetch).toHaveBeenCalledWith('https://query1.finance.yahoo.com/v7/finance/quote?symbols=NVDA');
    expect(quote).toEqual({
      symbol: 'NVDA',
      price: 100,
      currency: 'USD',
      previousClose: 95,
      timestamp: 1700000000,
    });
  });

  it('throws when Yahoo returns no result', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ quoteResponse: { result: [] } }) });
    await expect(fetchYahooQuote('FAIL', mockFetch)).rejects.toThrow('Quote data missing for FAIL');
  });

  it('supports tickers that include punctuation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          quoteResponse: {
            result: [
              {
                symbol: 'BRK-B',
                regularMarketPrice: 360.23,
                currency: 'USD',
              },
            ],
          },
        }),
    });

    const quote = await fetchYahooQuote('BRK-B', mockFetch);
    expect(mockFetch).toHaveBeenCalledWith('https://query1.finance.yahoo.com/v7/finance/quote?symbols=BRK-B');
    expect(quote.price).toBe(360.23);
    expect(quote.symbol).toBe('BRK-B');
  });

  it('falls back to proxy endpoints when the first attempt fails', async () => {
    const payload = {
      quoteResponse: {
        result: [
          {
            symbol: 'ASML',
            regularMarketPrice: 650.12,
            currency: 'USD',
          },
        ],
      },
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'Service Unavailable' })
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify(payload) });

    const quote = await fetchYahooQuote('ASML', mockFetch);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(quote.symbol).toBe('ASML');
    expect(quote.price).toBe(650.12);
  });

  it('aggregates error messages if all attempts fail', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, text: async () => 'Internal error' });

    await expect(fetchYahooQuote('MSFT', mockFetch)).rejects.toThrow(/Failed to fetch quote for MSFT/);
  });
});
