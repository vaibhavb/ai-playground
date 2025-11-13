export type QuoteSummary = {
  symbol: string;
  price: number;
  currency: string;
  previousClose: number | null;
  timestamp: number | null;
};

const BASE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=';

export async function fetchYahooQuote(symbol: string, fetcher: typeof fetch = fetch): Promise<QuoteSummary> {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  const response = await fetcher(`${BASE_URL}${encodeURIComponent(symbol)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch quote for ${symbol}: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
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

  const result = payload?.quoteResponse?.result?.[0];
  if (!result || typeof result.regularMarketPrice !== 'number') {
    throw new Error(`Quote data missing for ${symbol}`);
  }

  return {
    symbol: result.symbol ?? symbol.toUpperCase(),
    price: result.regularMarketPrice,
    currency: result.currency ?? 'USD',
    previousClose: typeof result.regularMarketPreviousClose === 'number' ? result.regularMarketPreviousClose : null,
    timestamp: typeof result.regularMarketTime === 'number' ? result.regularMarketTime : null,
  };
}
