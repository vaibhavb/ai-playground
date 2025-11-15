import { useMemo } from 'react';
import { CalendarDays, RefreshCcw, ShieldCheck, Thermometer, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import type { QuoteSummary } from '../lib/data/yahoo';
import type { ScenarioCheckpoint } from '../lib/calculations';
import { cn } from '../lib/utils';

export type SymbolPreset = {
  id: string;
  label: string;
  ticker: string;
  quoteSymbol: string;
  optionSymbol: string;
};

export type SimulatorState = {
  ticker: string;
  quoteSymbol: string;
  optionSymbol: string;
  sharesOwned: number;
  sharePurchasePrice: number;
  putStrike: number;
  contractsBought: number;
  premiumPerShare: number;
  putExpirationDate: string;
  analysisDate: string;
  futureStockPrice: number;
  taxRate: number;
  checkpoints: ScenarioCheckpoint[];
};

type InputPanelProps = {
  state: SimulatorState;
  presets: SymbolPreset[];
  quote: QuoteSummary | null;
  quoteLoading: boolean;
  quoteError: string | null;
  optionLoading: boolean;
  onUpdate: (changes: Partial<SimulatorState>) => void;
  onReset: () => void;
  onUseLivePrice: () => void;
  onMaxProtection: () => void;
  onAddCheckpoint: () => void;
  onUpdateCheckpoint: (id: string, price: number) => void;
  onRemoveCheckpoint: (id: string) => void;
  onRefreshQuote: () => Promise<void> | void;
  onRefreshOptions: () => Promise<void> | void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function InputPanel({
  state,
  presets,
  quote,
  quoteLoading,
  quoteError,
  optionLoading,
  onUpdate,
  onReset,
  onUseLivePrice,
  onMaxProtection,
  onAddCheckpoint,
  onUpdateCheckpoint,
  onRemoveCheckpoint,
  onRefreshQuote,
  onRefreshOptions,
}: InputPanelProps) {
  const presetMatch = presets.find((preset) => preset.ticker === state.ticker);
  const futureRange = useMemo(() => {
    const maxFromState = Math.max(state.sharePurchasePrice * 2.2, state.putStrike * 2, 700);
    const min = 0;
    return {
      min,
      max: Math.round(maxFromState),
    };
  }, [state.sharePurchasePrice, state.putStrike]);

  return (
    <div className="flex flex-col gap-5 sticky top-6">
      <Card className="border-slate-700/60 bg-slate-950/60 backdrop-blur-sm shadow-2xl shadow-cyan-500/5">
        <CardHeader className="pb-4 border-b border-slate-800/50">
          <CardTitle className="flex items-center gap-3 text-base font-light uppercase tracking-[0.15em]">
            <Wallet className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-300">Symbol & Tax</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 font-light mt-2">
            Pick a ticker, sync live data, and set your tax rate assumptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="symbol">Tracked ticker</Label>
            <Select
              value={presetMatch ? presetMatch.id : 'custom'}
              onValueChange={(value) => {
                if (value === 'custom') return;
                const preset = presets.find((item) => item.id === value);
                if (preset) {
                  onUpdate({
                    ticker: preset.ticker,
                    quoteSymbol: preset.quoteSymbol,
                    optionSymbol: preset.optionSymbol,
                  });
                }
              }}
            >
              <SelectTrigger id="symbol">
                <SelectValue placeholder="Choose a ticker" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom symbol…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="custom-symbol">Custom ticker</Label>
            <Input
              id="custom-symbol"
              value={state.ticker}
              onChange={(event) => {
                const raw = event.target.value.toUpperCase().trim();
                onUpdate({
                  ticker: raw,
                  quoteSymbol: raw.replace(/\./g, '-'),
                  optionSymbol: raw,
                });
              }}
              placeholder="e.g. NVDA"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between text-xs uppercase text-muted-foreground/70">
              <span>Latest price</span>
              <div className="flex items-center gap-2">
                {quote && <span className="font-semibold text-foreground">${quote.price.toFixed(2)}</span>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshQuote}
                  disabled={quoteLoading || !state.quoteSymbol}
                  className="h-8 px-3"
                >
                  <RefreshCcw className={cn('h-3.5 w-3.5', quoteLoading && 'animate-spin')} />
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
            </div>
            {quoteError && <p className="text-xs text-negative">{quoteError}</p>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={onUseLivePrice} disabled={!quote || quoteLoading}>
                Use live price
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onRefreshOptions}
                disabled={optionLoading}
              >
                {optionLoading ? 'Loading puts…' : 'Refresh puts'}
              </Button>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="grid gap-3">
            <Label htmlFor="tax-rate">Marginal tax rate</Label>
            <div className="flex items-center gap-3">
              <Slider
                id="tax-rate"
                value={[state.taxRate * 100]}
                min={0}
                max={60}
                step={1}
                onValueChange={([value]) => onUpdate({ taxRate: clamp(value / 100, 0, 0.6) })}
              />
              <Input
                className="w-24"
                type="number"
                min={0}
                max={60}
                value={(state.taxRate * 100).toFixed(0)}
                onChange={(event) => {
                  const next = clamp(Number(event.target.value) / 100, 0, 0.6);
                  onUpdate({ taxRate: next });
                }}
              />
              <span className="text-sm text-muted-foreground/70">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700/60 bg-slate-950/60 backdrop-blur-sm shadow-2xl shadow-cyan-500/5">
        <CardHeader className="pb-4 border-b border-slate-800/50">
          <CardTitle className="flex items-center gap-3 text-base font-light uppercase tracking-[0.15em]">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-300">Position Controls</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 font-light mt-2">
            Adjust your stock exposure and protective put contracts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shares">Shares owned</Label>
              <Input
                id="shares"
                type="number"
                min={0}
                value={state.sharesOwned}
                onChange={(event) => onUpdate({ sharesOwned: Math.max(0, Number(event.target.value)) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase">Entry price</Label>
              <Input
                id="purchase"
                type="number"
                min={0}
                step="0.01"
                value={state.sharePurchasePrice}
                onChange={(event) => onUpdate({ sharePurchasePrice: Math.max(0, Number(event.target.value)) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="put-strike">Put strike</Label>
              <Input
                id="put-strike"
                type="number"
                min={0}
                step="0.5"
                value={state.putStrike}
                onChange={(event) => onUpdate({ putStrike: Math.max(0, Number(event.target.value)) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="put-premium">Premium / share</Label>
              <Input
                id="put-premium"
                type="number"
                min={0}
                step="0.01"
                value={state.premiumPerShare}
                onChange={(event) => onUpdate({ premiumPerShare: Math.max(0, Number(event.target.value)) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contracts">Contracts bought</Label>
              <Input
                id="contracts"
                type="number"
                min={0}
                value={state.contractsBought}
                onChange={(event) => onUpdate({ contractsBought: Math.max(0, Number(event.target.value)) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration">Put expiration</Label>
              <Input
                id="expiration"
                type="date"
                value={state.putExpirationDate}
                onChange={(event) => onUpdate({ putExpirationDate: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="analysis-date" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Analysis date
            </Label>
            <Input
              id="analysis-date"
              type="date"
              value={state.analysisDate}
              onChange={(event) => onUpdate({ analysisDate: event.target.value })}
            />
            <p className="text-xs text-muted-foreground/70">
              Results assume tax realization on the analysis date{state.analysisDate &&
                ` (${format(new Date(state.analysisDate), 'MMM d, yyyy')})`}.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={onMaxProtection} variant="secondary">
              Max protection
            </Button>
            <Button className="flex-1" variant="outline" onClick={onReset}>
              Reset to default
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700/60 bg-slate-950/60 backdrop-blur-sm shadow-2xl shadow-cyan-500/5">
        <CardHeader className="pb-4 border-b border-slate-800/50">
          <CardTitle className="flex items-center gap-3 text-base font-light uppercase tracking-[0.15em]">
            <Thermometer className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-300">Scenario Planning</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 font-light mt-2">
            Project future stock prices and track custom checkpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase text-muted-foreground/70">
              <span>Future price</span>
              <span className="text-sm font-semibold text-foreground">${state.futureStockPrice.toFixed(2)}</span>
            </div>
            <Slider
              value={[state.futureStockPrice]}
              min={futureRange.min}
              max={futureRange.max}
              step={1}
              onValueChange={([value]) => onUpdate({ futureStockPrice: value })}
            />
            <Input
              type="number"
              min={0}
              step="0.1"
              value={state.futureStockPrice}
              onChange={(event) => onUpdate({ futureStockPrice: Math.max(0, Number(event.target.value)) })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Future price checkpoints</Label>
              <Button size="sm" variant="outline" onClick={onAddCheckpoint}>
                Add checkpoint
              </Button>
            </div>
            <div className="space-y-2">
              {state.checkpoints.length === 0 && (
                <p className="text-xs text-muted-foreground/70">
                  Add checkpoints to pin specific stress-test prices beyond the baseline table.
                </p>
              )}
              {state.checkpoints.map((checkpoint, index) => (
                <div key={checkpoint.id} className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="1"
                    value={checkpoint.price}
                    onChange={(event) =>
                      onUpdateCheckpoint(checkpoint.id, Math.max(0, Number(event.target.value)))
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/80 hover:text-negative"
                    onClick={() => onRemoveCheckpoint(checkpoint.id)}
                    aria-label={`Remove checkpoint ${index + 1}`}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
