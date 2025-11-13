import { useCallback, useEffect, useState } from 'react';
import { fetchOptionChain, type OptionChain } from '../lib/data/options';

export function useOptionChain(symbol: string) {
  const [chain, setChain] = useState<OptionChain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (overrideSymbol?: string) => {
      const activeSymbol = (overrideSymbol ?? symbol).trim();
      if (!activeSymbol) {
        setChain(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOptionChain(activeSymbol);
        setChain(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setChain(null);
      } finally {
        setIsLoading(false);
      }
    },
    [symbol]
  );

  useEffect(() => {
    refresh().catch((error) => console.error('Failed to load option chain', error));
  }, [refresh]);

  return { chain, isLoading, error, refresh };
}
