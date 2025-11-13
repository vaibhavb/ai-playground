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
    <Card className="border-border/70">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Hedged vs unhedged P/L</CardTitle>
        <CardDescription>
          Explore how protective puts reshape outcomes across the price path. Hover to compare gross and after-tax results.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="4 4" />
            <XAxis
              dataKey="price"
              stroke="rgba(148, 163, 184, 0.7)"
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.7)"
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                borderRadius: 16,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#e2e8f0',
              }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(value) => `Price $${value}`}
            />
            <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.4)" />
            <ReferenceLine
              x={putStrike}
              stroke="rgba(56, 189, 248, 0.6)"
              strokeDasharray="6 6"
              label={{ position: 'insideTopLeft', value: `Put strike $${putStrike}` }}
            />
            <ReferenceLine
              x={breakEven}
              stroke="rgba(251, 191, 36, 0.6)"
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
