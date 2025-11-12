import PropTypes from 'prop-types';

const currencyFormatter = (value) =>
  `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export function ScenarioTable({ rows, checkpoints }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Outcome Table</h2>
        <p className="card-subtitle">
          Anchor on key NVDA prices plus any checkpoints you add. Values update in real time as
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
    })
  ).isRequired,
  checkpoints: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default ScenarioTable;
