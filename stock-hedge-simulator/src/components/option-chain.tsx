import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
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
  referencePrice: number | null;
};

export function OptionChainPanel({
  chain,
  selectedExpiry,
  onSelectExpiry,
  onApply,
  isLoading,
  error,
  referencePrice,
}: OptionChainPanelProps) {
  const expirations = chain?.expirations ?? [];
  const activeExpiry = selectedExpiry ?? expirations[0]?.expiry ?? null;
  const activeContracts = expirations.find((expiry) => expiry.expiry === activeExpiry)?.puts ?? [];
  const featuredContracts = [...activeContracts]
    .sort((a, b) => {
      if (referencePrice === null) {
        return (b.openInterest ?? 0) - (a.openInterest ?? 0);
      }

      const diffA = Math.abs(a.strike - referencePrice);
      const diffB = Math.abs(b.strike - referencePrice);
      if (diffA === diffB) {
        return (b.openInterest ?? 0) - (a.openInterest ?? 0);
      }
      return diffA - diffB;
    })
    .slice(0, 5);

  return (
    <Card className="border-border/60 bg-white/95">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-slate-800">Popular put contracts</CardTitle>
        <CardDescription className="text-slate-600">
          Quick-pick expirations and strikes pulled from Options Profit Calculator. Apply a quote to sync your hedge inputs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <span className="font-semibold text-slate-700">Expiration</span>
          <Select
            value={activeExpiry ?? ''}
            onValueChange={(value) => {
              onSelectExpiry(value || null);
            }}
            disabled={expirations.length === 0 || isLoading}
          >
            <SelectTrigger className="bg-white">
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
          <p className="text-xs text-muted-foreground/80">
            {isLoading
              ? 'Checking for the freshest option data…'
              : expirations.length > 0
                ? `${expirations.length} expirations available`
                : 'Pick a ticker and refresh quotes to populate expirations.'}
          </p>
        </div>

        {error && <p className="text-xs text-negative">{error}</p>}
        {!error && featuredContracts.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground/80">
            No suitable puts yet. Try a different expiration or refresh the option chain from the control panel.
          </p>
        )}

        <div className="space-y-3">
          {featuredContracts.map((contract) => (
            <div
              key={`${activeExpiry}-${contract.strike}`}
              className="rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    ${contract.strike.toFixed(2)}
                    {referencePrice !== null && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        {Math.abs(contract.strike - referencePrice).toFixed(0)} pts away
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mid {formatCurrency(contract.mid)} · Bid {formatCurrency(contract.bid)} · Ask {formatCurrency(contract.ask)}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>OI {contract.openInterest ?? '—'}</p>
                  <p>Vol {contract.volume ?? '—'}</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground/80">
                <span>Apply strike &amp; premium</span>
                <Button
                  size="sm"
                  onClick={() => onApply(contract.strike, contract.mid ?? contract.ask ?? contract.bid ?? 0, activeExpiry ?? '')}
                >
                  Use this quote
                </Button>
              </div>
            </div>
          ))}
          {isLoading && (
            <p className="text-xs text-muted-foreground/80">Fetching the latest contracts…</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
