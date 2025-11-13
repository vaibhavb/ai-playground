import { describe, expect, it, vi } from 'vitest';
import { fetchOptionChain } from './options';

const SAMPLE_RESPONSE = JSON.stringify({
  options: {
    '2024-12-20': {
      p: {
        '450': { b: '12.5', a: '13.1', l: '12.8', oi: '1543', v: '260' },
        '400': { b: '6.9', a: '7.4', l: '7.1', oi: '875', v: '120' },
      },
    },
  },
});

describe('fetchOptionChain', () => {
  it('parses put contracts from the primary endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: async () => SAMPLE_RESPONSE });

    const chain = await fetchOptionChain('NVDA', mockFetch);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.optionsprofitcalculator.com/ajax/getOptions?stock=NVDA&reqId=1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'Mozilla/5.0' }),
      })
    );

    expect(chain.expirations).toHaveLength(1);
    expect(chain.expirations[0].puts).toHaveLength(2);
    expect(chain.expirations[0].puts[0]).toMatchObject({
      strike: 400,
      bid: 6.9,
      ask: 7.4,
      mid: 7.15,
    });
  });

  it('falls back to proxy endpoints when the first request fails', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'server error' })
      .mockResolvedValueOnce({ ok: true, text: async () => SAMPLE_RESPONSE });

    const chain = await fetchOptionChain('ASML', mockFetch);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(chain.expirations[0].puts[0].strike).toBe(400);
  });

  it('aggregates errors when every endpoint fails', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limited' });

    await expect(fetchOptionChain('FAIL', mockFetch)).rejects.toThrow(
      /Unable to load option chain for FAIL/
    );
  });
});
