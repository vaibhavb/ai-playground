import PropTypes from 'prop-types';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const currencyFormatter = (value) =>
  `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const labelMap = {
  hedged: 'Hedged',
  unhedged: 'Unhedged',
  hedgedAfterTax: 'Hedged after tax',
};

export function ScenarioChart({ data, putStrike, isDark, symbol }) {
  return (
    <div className="card chart-card">
      <h2>Scenario Analysis</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 30 }}>
          <CartesianGrid stroke={isDark ? '#1f2937' : '#e2e8f0'} strokeDasharray="4 4" />
          <XAxis
            dataKey="price"
            stroke={isDark ? '#cbd5f5' : '#475467'}
            tickFormatter={currencyFormatter}
            type="number"
            domain={['auto', 'auto']}
            label={{
              value: `Future ${symbol} price`,
              position: 'insideBottom',
              offset: -20,
              fill: isDark ? '#cbd5f5' : '#475467',
            }}
          />
          <YAxis
            stroke={isDark ? '#cbd5f5' : '#475467'}
            tickFormatter={currencyFormatter}
            width={90}
            label={{
              value: 'Profit / Loss',
              angle: -90,
              position: 'insideLeft',
              fill: isDark ? '#cbd5f5' : '#475467',
              offset: 10,
            }}
          />
          <Tooltip
            formatter={(value, name) => [
              currencyFormatter(value),
              `${labelMap[name] ?? name} P/L`,
            ]}
            labelFormatter={(value) => `${symbol} @ ${currencyFormatter(value)}`}
            contentStyle={{
              background: isDark ? '#1e293b' : '#fff',
              borderRadius: 12,
              borderColor: isDark ? '#334155' : '#d5dde5',
            }}
          />
          <Legend
            wrapperStyle={{ color: isDark ? '#cbd5f5' : '#1f2933' }}
            verticalAlign="bottom"
            height={28}
          />
          <ReferenceLine
            y={0}
            stroke={isDark ? '#475467' : '#cbd5f5'}
            strokeDasharray="2 4"
            label={{
              value: 'Break-even',
              position: 'insideLeft',
              fill: isDark ? '#cbd5f5' : '#475467',
            }}
          />
          <Line
            type="monotone"
            dataKey="unhedged"
            stroke="#f97316"
            strokeWidth={3}
            dot={false}
            name="Unhedged"
          />
          <Line
            type="monotone"
            dataKey="hedged"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
            name="Hedged"
          />
          <Line
            type="monotone"
            dataKey="hedgedAfterTax"
            stroke="#7c3aed"
            strokeWidth={3}
            strokeDasharray="4 4"
            dot={false}
            name="Hedged after tax"
          />
          <ReferenceLine
            x={putStrike}
            stroke="#38bdf8"
            strokeDasharray="6 6"
            label={{
              value: `Put Strike $${putStrike}`,
              position: 'top',
              fill: isDark ? '#e2e8f0' : '#0f172a',
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

ScenarioChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number.isRequired,
      hedged: PropTypes.number.isRequired,
      unhedged: PropTypes.number.isRequired,
      hedgedAfterTax: PropTypes.number.isRequired,
    })
  ).isRequired,
  putStrike: PropTypes.number.isRequired,
  isDark: PropTypes.bool.isRequired,
  symbol: PropTypes.string.isRequired,
};

export default ScenarioChart;
