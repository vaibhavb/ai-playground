import PropTypes from 'prop-types';

const currencyFormatter = (value) =>
  `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function ScenarioTable({ rows, checkpoints, taxRate, symbol }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Outcome Table</h2>
        <p className="card-subtitle">
          Anchor on key {symbol} prices plus any checkpoints you add. Values update in real time as
          you tweak the controls.
        </p>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Price</th>
            <th scope="col">Stock P/L</th>
            <th scope="col">Put payout</th>
            <th scope="col">Net result</th>
            <th scope="col">Tax impact ({percentFormatter.format(taxRate)})</th>
            <th scope="col">Net after tax</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.price}>
              <td>{currencyFormatter(row.price)}</td>
              <td>{currencyFormatter(row.stockPL)}</td>
              <td>{currencyFormatter(row.putValue)}</td>
              <td className={row.netResult >= 0 ? 'pl-positive' : 'pl-negative'}>
                {currencyFormatter(row.netResult)}
              </td>
              <td className={row.taxImpact >= 0 ? 'pl-negative' : 'pl-positive'}>
                {currencyFormatter(row.taxImpact)}
              </td>
              <td className={row.netAfterTax >= 0 ? 'pl-positive' : 'pl-negative'}>
                {currencyFormatter(row.netAfterTax)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {checkpoints.length > 0 ? (
        <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
          Custom checkpoints: {checkpoints.map((price) => currencyFormatter(price)).join(', ')}
        </p>
      ) : null}
    </div>
  );
}

ScenarioTable.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number.isRequired,
      stockPL: PropTypes.number.isRequired,
      putValue: PropTypes.number.isRequired,
      netResult: PropTypes.number.isRequired,
      taxImpact: PropTypes.number.isRequired,
      netAfterTax: PropTypes.number.isRequired,
    })
  ).isRequired,
  checkpoints: PropTypes.arrayOf(PropTypes.number).isRequired,
  taxRate: PropTypes.number.isRequired,
  symbol: PropTypes.string.isRequired,
};

export default ScenarioTable;
