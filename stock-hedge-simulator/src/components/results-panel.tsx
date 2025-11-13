import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

type ResultsPanelProps = {
  futurePrice: number;
  stockPL: number;
  putValue: number;
  putCost: number;
  netResult: number;
  taxImpact: number;
  netAfterTax: number;
  breakEven: number;
  hedgeEffectiveness: number;
  protectedRange: string;
  worstCaseLoss: number;
};

export function ResultsPanel({
  futurePrice,
  stockPL,
  putValue,
  putCost,
  netResult,
  taxImpact,
  netAfterTax,
  breakEven,
  hedgeEffectiveness,
  protectedRange,
  worstCaseLoss,
}: ResultsPanelProps) {
  const netIsPositive = netResult >= 0;

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-white/95 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-base text-slate-800">
            Hedge outcome at ${futurePrice.toFixed(2)}
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" disabled>
              Tax-adjusted view
            </Button>
          </CardTitle>
          <CardDescription className="text-slate-600">
            Gross and after-tax P/L snapshots update instantly as you adjust the scenario dials.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <motion.div
            key={netResult}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
            className="rounded-xl border border-border/70 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Net result</span>
              {netIsPositive ? (
                <ArrowUpRight className="h-4 w-4 text-positive" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-negative" />
              )}
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {formatCurrency(netResult)}
            </div>
            <p className="mt-3 text-xs text-muted-foreground/80">
              Includes stock P/L plus put payoff net of premium cost.
            </p>
          </motion.div>

          <motion.div
            key={netAfterTax}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.05 }}
            className="rounded-xl border border-border/70 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>After-tax net</span>
              <PiggyBank className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {formatCurrency(netAfterTax)}
            </div>
            <p className="mt-3 text-xs text-muted-foreground/80">
              Tax impact of {formatCurrency(taxImpact)} applied using your marginal rate.
            </p>
          </motion.div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={<TrendingUp className="h-4 w-4 text-accent" />}
          label="Stock P/L"
          value={formatCurrency(stockPL)}
          tone={stockPL >= 0 ? 'positive' : 'negative'}
          description="Unhedged performance versus cost basis"
        />
        <MetricCard
          icon={<Shield className="h-4 w-4 text-accent" />}
          label="Put intrinsic value"
          value={formatCurrency(putValue)}
          tone={putValue > 0 ? 'positive' : 'neutral'}
          description="Value of protective puts at expiration"
        />
        <MetricCard
          icon={<TrendingDown className="h-4 w-4 text-negative" />}
          label="Put premium paid"
          value={formatCurrency(putCost)}
          tone="negative"
          description="Upfront hedge cost (premium × contracts)"
        />
        <MetricCard
          icon={<ArrowUpRight className="h-4 w-4 text-accent" />}
          label="Hedge effectiveness"
          value={formatPercent(hedgeEffectiveness)}
          tone="positive"
          description="Percentage of downside risk offset"
        />
        <MetricCard
          icon={<Shield className="h-4 w-4 text-accent" />}
          label="Break-even with hedge"
          value={`$${breakEven.toFixed(2)}`}
          tone="neutral"
          description="Share price that recovers option spend"
        />
        <MetricCard
          icon={<ArrowDownRight className="h-4 w-4 text-negative" />}
          label="Worst case loss"
          value={formatCurrency(worstCaseLoss)}
          tone="negative"
          description={protectedRange}
        />
      </div>
    </div>
  );
}

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
  tone: 'positive' | 'negative' | 'neutral';
};

const toneClasses: Record<MetricCardProps['tone'], string> = {
  positive: 'border border-positive/40 bg-positive/10 text-positive shadow-sm',
  negative: 'border border-negative/40 bg-negative/10 text-negative shadow-sm',
  neutral: 'border border-border/60 bg-white text-foreground shadow-sm',
};

function MetricCard({ icon, label, value, description, tone }: MetricCardProps) {
  return (
    <Card className={toneClasses[tone]}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span className="uppercase tracking-wide">{label}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold">{value}</div>
        <Separator className="my-3 border-border/70" />
        <p className="text-xs text-muted-foreground/80">{description}</p>
      </CardContent>
    </Card>
  );
}
