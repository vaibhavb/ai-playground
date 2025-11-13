export type OptionContract = {
  strike: number;
  bid: number | null;
  ask: number | null;
  last: number | null;
  mid: number | null;
  volume: number | null;
  openInterest: number | null;
};

export type OptionExpiry = {
  expiry: string;
  puts: OptionContract[];
};

export type OptionChain = {
  source: string;
  expirations: OptionExpiry[];
};

const buildEndpoints = (symbol: string): string[] => {
  const encoded = encodeURIComponent(symbol);
  const direct = `https://www.optionsprofitcalculator.com/ajax/getOptions?stock=${encoded}&reqId=1`;
  return [
    direct,
    `https://cors.isomorphic-git.org/${direct}`,
    `https://thingproxy.freeboard.io/fetch/${direct}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`,
  ];
};

type RawContract = {
  l?: number | string;
  b?: number | string;
  a?: number | string;
  oi?: number | string;
  v?: number | string;
};

type RawOptionPayload = {
  options?: Record<
    string,
    {
      p?: Record<string, RawContract>;
    }
  >;
};

const toNumeric = (value: number | string | undefined | null): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionPayload = (payload: RawOptionPayload, source: string): OptionChain => {
  const expirations: OptionExpiry[] = [];
  if (payload?.options) {
    for (const [expiry, optionSet] of Object.entries(payload.options)) {
      const puts: OptionContract[] = [];
      const rawPuts = optionSet?.p ?? {};
      for (const [strikeText, contract] of Object.entries(rawPuts)) {
        const strike = Number(strikeText);
        if (!Number.isFinite(strike)) continue;
        const bid = toNumeric(contract?.b);
        const ask = toNumeric(contract?.a);
        const last = toNumeric(contract?.l);
        const mid = bid !== null && ask !== null ? (bid + ask) / 2 : null;
        puts.push({
          strike,
          bid,
          ask,
          last,
          mid,
          volume: toNumeric(contract?.v),
          openInterest: toNumeric(contract?.oi),
        });
      }
      if (puts.length > 0) {
        puts.sort((a, b) => a.strike - b.strike);
        expirations.push({ expiry, puts });
      }
    }
  }

  expirations.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
  return { source, expirations };
};

export async function fetchOptionChain(symbol: string, fetcher: typeof fetch = fetch): Promise<OptionChain> {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  const endpoints = buildEndpoints(symbol);
  const errors: Error[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetcher(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
        },
      } as RequestInit);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawText = await response.text();
      const trimmed = rawText.trim();
      const jsonStart = trimmed.indexOf('{');
      if (jsonStart === -1) {
        throw new Error('Unexpected response format');
      }

      const jsonText = trimmed.slice(jsonStart);
      const payload = JSON.parse(jsonText) as RawOptionPayload;
      const parsed = parseOptionPayload(payload, endpoint);
      if (parsed.expirations.length === 0) {
        throw new Error('No put contracts found');
      }
      return parsed;
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  const finalMessage = errors.map((err, index) => `Attempt ${index + 1}: ${err.message}`).join('\n');
  throw new Error(`Unable to load option chain for ${symbol}.\n${finalMessage}`);
}
