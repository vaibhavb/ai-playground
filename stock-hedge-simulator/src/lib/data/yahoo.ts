export type QuoteSummary = {
  symbol: string;
  price: number;
  currency: string;
  previousClose: number | null;
  timestamp: number | null;
};

const BASE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=';

const buildQuoteEndpoints = (symbol: string): string[] => {
  const encoded = encodeURIComponent(symbol);
  const direct = `${BASE_URL}${encoded}`;
  return [
    direct,
    `https://cors.isomorphic-git.org/${direct}`,
    `https://thingproxy.freeboard.io/fetch/${direct}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`,
  ];
};

type RawQuotePayload = {
  quoteResponse?: {
    result?: Array<{
      symbol?: string;
      regularMarketPrice?: number;
      currency?: string;
      regularMarketPreviousClose?: number;
      regularMarketTime?: number;
    }>;
  };
};

const parseQuotePayload = (payload: RawQuotePayload | null | undefined, fallbackSymbol: string): QuoteSummary => {
  const result = payload?.quoteResponse?.result?.[0];
  if (!result || typeof result.regularMarketPrice !== 'number') {
    throw new Error(`Quote data missing for ${fallbackSymbol}`);
  }

  return {
    symbol: result.symbol ?? fallbackSymbol.toUpperCase(),
    price: result.regularMarketPrice,
    currency: result.currency ?? 'USD',
    previousClose:
      typeof result.regularMarketPreviousClose === 'number' ? result.regularMarketPreviousClose : null,
    timestamp: typeof result.regularMarketTime === 'number' ? result.regularMarketTime : null,
  };
};

export async function fetchYahooQuote(symbol: string, fetcher: typeof fetch = fetch): Promise<QuoteSummary> {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  const endpoints = buildQuoteEndpoints(symbol);
  const errors: Error[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetcher(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawText = await response.text();
      const trimmed = rawText.trim();
      const jsonStart = trimmed.indexOf('{');
      if (jsonStart === -1) {
        throw new Error('Unexpected response format');
      }

      const payload = JSON.parse(trimmed.slice(jsonStart)) as RawQuotePayload;
      return parseQuotePayload(payload, symbol);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  const message = errors.map((err, index) => `Attempt ${index + 1}: ${err.message}`).join('\n');
  throw new Error(`Failed to fetch quote for ${symbol}.\n${message}`);
}
