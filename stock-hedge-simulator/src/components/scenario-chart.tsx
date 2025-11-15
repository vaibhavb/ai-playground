import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { ChartDatum } from '../lib/calculations';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

type ScenarioChartProps = {
  data: ChartDatum[];
  putStrike: number;
  breakEven: number;
};

export function ScenarioChart({ data, putStrike, breakEven }: ScenarioChartProps) {
  return (
    <Card className="border-border/60 bg-white/95 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-slate-800">Hedged vs unhedged P/L</CardTitle>
        <CardDescription className="text-slate-600">
          Explore how protective puts reshape outcomes across the price path. Hover to compare gross and after-tax results.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="4 4" />
            <XAxis
              dataKey="price"
              stroke="rgba(100, 116, 139, 0.9)"
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              stroke="rgba(100, 116, 139, 0.9)"
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#0f172a',
              }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(value) => `Price $${value}`}
            />
            <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.45)" />
            <ReferenceLine
              x={putStrike}
              stroke="rgba(56, 189, 248, 0.7)"
              strokeDasharray="6 6"
              label={{ position: 'insideTopLeft', value: `Put strike $${putStrike}` }}
            />
            <ReferenceLine
              x={breakEven}
              stroke="rgba(245, 158, 11, 0.7)"
              strokeDasharray="4 4"
              label={{ position: 'insideTopRight', value: `Break-even $${breakEven.toFixed(2)}` }}
            />
            <Line type="monotone" dataKey="unhedged" stroke="#f97316" strokeWidth={2} dot={false} name="Unhedged" />
            <Line type="monotone" dataKey="hedged" stroke="#14b8a6" strokeWidth={2} dot={false} name="Hedged" />
            <Line
              type="monotone"
              dataKey="hedgedAfterTax"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              name="Hedged (after tax)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
