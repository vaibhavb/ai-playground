import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { ScenarioRow } from '../lib/calculations';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

type ScenarioTableProps = {
  rows: ScenarioRow[];
};

export function ScenarioTable({ rows }: ScenarioTableProps) {
  const sortedRows = [...rows].sort((a, b) => b.price - a.price);
  return (
    <Card className="border-border/60 bg-white/95 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-slate-800">Scenario checkpoints</CardTitle>
        <CardDescription className="text-slate-600">
          Compare hedged vs. unhedged outcomes at key prices, including your custom checkpoints and baseline stress tests.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="py-3 pl-4 text-left font-semibold uppercase tracking-wide">Price</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">Stock P/L</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">Put payout</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">Net</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">Tax impact</th>
              <th className="py-3 pr-4 text-right font-semibold uppercase tracking-wide">After tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 bg-white">
            {sortedRows.map((row) => (
              <tr key={row.price} className="transition-colors hover:bg-muted/60">
                <td className="py-3 pl-4 font-medium text-foreground">${row.price.toFixed(0)}</td>
                <td className="py-3 text-right text-muted-foreground">{formatCurrency(row.stockPL)}</td>
                <td className="py-3 text-right text-muted-foreground">{formatCurrency(row.putValue)}</td>
                <td className="py-3 text-right font-semibold text-foreground">{formatCurrency(row.netResult)}</td>
                <td className="py-3 text-right text-muted-foreground">{formatCurrency(row.taxImpact)}</td>
                <td className="py-3 pr-4 text-right font-semibold text-foreground">{formatCurrency(row.netAfterTax)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
