import { useCallback, useEffect, useState } from 'react';
import { fetchYahooQuote, type QuoteSummary } from '../lib/data/yahoo';

export function useQuote(symbol: string) {
  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (overrideSymbol?: string) => {
      const activeSymbol = (overrideSymbol ?? symbol).trim();
      if (!activeSymbol) {
        setQuote(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchYahooQuote(activeSymbol);
        setQuote(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [symbol]
  );

  useEffect(() => {
    refresh().catch((error) => {
      console.error('Failed to refresh quote', error);
    });
  }, [refresh]);

  return { quote, isLoading, error, refresh };
}
