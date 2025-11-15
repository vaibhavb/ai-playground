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
      {/* Hero metrics card */}
      <Card className="border-slate-700/60 bg-gradient-to-br from-slate-950/80 to-slate-900/60 backdrop-blur-sm shadow-2xl shadow-cyan-500/10 overflow-hidden relative">
        {/* Subtle corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-3xl" />

        <CardHeader className="pb-6 border-b border-slate-800/50 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="font-light uppercase tracking-[0.15em] text-base text-slate-300">
              Hedge Outcome
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">@</span>
              <span className="font-semibold text-cyan-400">${futurePrice.toFixed(2)}</span>
            </div>
          </div>
          <CardDescription className="text-xs text-slate-500 font-light mt-2">
            Gross and after-tax P/L snapshots update instantly as you adjust the scenario dials.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2 pt-6 relative z-10">
          {/* Net Result - Primary metric */}
          <motion.div
            key={netResult}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative border border-slate-800/60 bg-slate-950/40 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-light">Net Result</span>
                {netIsPositive ? (
                  <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className={`text-4xl font-bold tracking-tight mb-3 tabular-nums animate-count ${
                netIsPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {formatCurrency(netResult)}
              </div>
              <div className="h-px bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-transparent mb-3" />
              <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                Includes stock P/L plus put payoff net of premium cost.
              </p>
            </div>
          </motion.div>

          {/* After-tax Net - Secondary metric */}
          <motion.div
            key={netAfterTax}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.05 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative border border-slate-800/60 bg-slate-950/40 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-light">After-Tax Net</span>
                <PiggyBank className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-4xl font-bold tracking-tight text-slate-200 mb-3 tabular-nums animate-count">
                {formatCurrency(netAfterTax)}
              </div>
              <div className="h-px bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-transparent mb-3" />
              <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                Tax impact of {formatCurrency(taxImpact)} applied using your marginal rate.
              </p>
            </div>
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

const toneStyles: Record<MetricCardProps['tone'], { border: string; bg: string; text: string; glow?: string }> = {
  positive: {
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  negative: {
    border: 'border-red-500/20',
    bg: 'bg-red-950/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/10',
  },
  neutral: {
    border: 'border-slate-700/50',
    bg: 'bg-slate-950/50',
    text: 'text-slate-300',
  },
};

function MetricCard({ icon, label, value, description, tone }: MetricCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className={`${styles.border} ${styles.bg} backdrop-blur-sm shadow-xl ${styles.glow || ''} group hover:scale-[1.02] transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`${styles.text}`}>{icon}</div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-light">{label}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`text-2xl font-bold tabular-nums ${styles.text} mb-3`}>{value}</div>
        <div className="h-px bg-gradient-to-r from-slate-700/40 via-slate-600/30 to-transparent mb-3" />
        <p className="text-[11px] text-slate-500 font-light leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
