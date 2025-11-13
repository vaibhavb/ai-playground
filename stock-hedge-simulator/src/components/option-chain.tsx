import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { OptionChain } from '../lib/data/options';

const formatCurrency = (value: number | null) =>
  value === null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);

type OptionChainPanelProps = {
  chain: OptionChain | null;
  selectedExpiry: string | null;
  onSelectExpiry: (expiry: string | null) => void;
  onApply: (strike: number, premium: number, expiry: string) => void;
  isLoading: boolean;
  error: string | null;
};

export function OptionChainPanel({
  chain,
  selectedExpiry,
  onSelectExpiry,
  onApply,
  isLoading,
  error,
}: OptionChainPanelProps) {
  const expirations = chain?.expirations ?? [];
  const activeExpiry = selectedExpiry ?? expirations[0]?.expiry ?? null;
  const activeContracts = expirations.find((expiry) => expiry.expiry === activeExpiry)?.puts ?? [];
  const featuredContracts = [...activeContracts]
    .sort((a, b) => (b.openInterest ?? 0) - (a.openInterest ?? 0))
    .slice(0, 6);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Live put quotes</CardTitle>
        <CardDescription>
          Pulls directly from Options Profit Calculator. Apply a contract to pre-fill strike, expiry, and premium in one tap.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1">
            <Select
              value={activeExpiry ?? ''}
              onValueChange={(value) => {
                onSelectExpiry(value || null);
              }}
              disabled={expirations.length === 0 || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Loading expirations…' : 'Select expiration'} />
              </SelectTrigger>
              <SelectContent>
                {expirations.map((expiry) => (
                  <SelectItem key={expiry.expiry} value={expiry.expiry}>
                    {expiry.expiry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" disabled>{isLoading ? 'Refreshing…' : `${expirations.length} expiries`}</Button>
        </div>
        {error && <p className="text-xs text-negative">{error}</p>}
        {!error && expirations.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground/80">
            No put quotes available yet. Try refreshing the chain from the control panel or pick another ticker.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/40 text-sm">
            <thead className="text-muted-foreground/80">
              <tr>
                <th className="py-3 text-left font-semibold uppercase tracking-wide">Strike</th>
                <th className="py-3 text-right font-semibold uppercase tracking-wide">Bid</th>
                <th className="py-3 text-right font-semibold uppercase tracking-wide">Ask</th>
                <th className="py-3 text-right font-semibold uppercase tracking-wide">Mid</th>
                <th className="py-3 text-right font-semibold uppercase tracking-wide">OI</th>
                <th className="py-3 text-right font-semibold uppercase tracking-wide">Volume</th>
                <th className="py-3 text-right font-semibold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {featuredContracts.map((contract) => (
                <tr key={contract.strike} className="hover:bg-muted/40">
                  <td className="py-3 font-semibold text-foreground">${contract.strike.toFixed(2)}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatCurrency(contract.bid)}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatCurrency(contract.ask)}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatCurrency(contract.mid)}</td>
                  <td className="py-3 text-right text-muted-foreground">{contract.openInterest ?? '—'}</td>
                  <td className="py-3 text-right text-muted-foreground">{contract.volume ?? '—'}</td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      onClick={() => onApply(contract.strike, contract.mid ?? contract.ask ?? contract.bid ?? 0, activeExpiry ?? '')}
                    >
                      Use quote
                    </Button>
                  </td>
                </tr>
              ))}
              {featuredContracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-sm text-muted-foreground/70">
                    {isLoading ? 'Fetching latest option chain…' : 'Select an expiration to see put quotes.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
