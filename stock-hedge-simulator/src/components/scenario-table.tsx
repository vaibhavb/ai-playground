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
    <Card className="border-border/70">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Scenario checkpoints</CardTitle>
        <CardDescription>
          Compare hedged vs. unhedged outcomes at key prices, including your custom checkpoints and baseline stress tests.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/40 text-sm">
          <thead className="text-muted-foreground/80">
            <tr>
              <th className="py-3 text-left font-semibold uppercase tracking-wide">Price</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">Stock P/L</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">Put payout</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">Net</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">Tax impact</th>
              <th className="py-3 text-right font-semibold uppercase tracking-wide">After tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sortedRows.map((row) => (
              <tr key={row.price} className="hover:bg-muted/40">
                <td className="py-3 font-medium text-foreground">${row.price.toFixed(0)}</td>
                <td className="py-3 text-right text-muted-foreground">{formatCurrency(row.stockPL)}</td>
                <td className="py-3 text-right text-muted-foreground">{formatCurrency(row.putValue)}</td>
                <td className="py-3 text-right font-semibold text-foreground">{formatCurrency(row.netResult)}</td>
                <td className="py-3 text-right text-muted-foreground">{formatCurrency(row.taxImpact)}</td>
                <td className="py-3 text-right font-semibold text-foreground">{formatCurrency(row.netAfterTax)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
