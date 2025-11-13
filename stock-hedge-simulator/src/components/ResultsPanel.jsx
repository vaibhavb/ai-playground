import PropTypes from 'prop-types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function ResultsPanel({
  metrics,
}) {
  const netClassName = metrics.netPL >= 0 ? 'positive' : 'negative';
  const afterTaxClassName = metrics.netAfterTax >= 0 ? 'positive' : 'negative';
  const taxClassName = metrics.taxImpact >= 0 ? 'negative' : 'positive';
  return (
    <div className="card">
      <h2>Hedge Summary</h2>
      <div className="results-grid">
        <div className="result-item">
          <span>Stock P/L</span>
          <strong>{currencyFormatter.format(metrics.stockPL)}</strong>
        </div>
        <div className="result-item">
          <span>Put intrinsic value</span>
          <strong>{currencyFormatter.format(metrics.putValue)}</strong>
        </div>
        <div className="result-item">
          <span>Total put cost</span>
          <strong>{currencyFormatter.format(metrics.putCost)}</strong>
        </div>
        <div className={`result-item net ${netClassName}`}>
          <span>Net result</span>
          <strong>{currencyFormatter.format(metrics.netPL)}</strong>
        </div>
        <div className={`result-item net ${taxClassName}`}>
          <span>Tax impact ({percentFormatter.format(metrics.taxRate)})</span>
          <strong>{currencyFormatter.format(metrics.taxImpact)}</strong>
        </div>
        <div className={`result-item net ${afterTaxClassName}`}>
          <span>Net after tax</span>
          <strong>{currencyFormatter.format(metrics.netAfterTax)}</strong>
        </div>
        <div className="result-item">
          <span>Hedge effectiveness</span>
          <strong>
            {metrics.hedgeEffectiveness != null
              ? percentFormatter.format(metrics.hedgeEffectiveness)
              : '—'}
          </strong>
        </div>
        <div className="result-item">
          <span>Protected downside</span>
          <strong>{metrics.protectedDownside}</strong>
        </div>
        <div className="result-item">
          <span>Break-even with hedge</span>
          <strong>{currencyFormatter.format(metrics.breakEvenPrice)}</strong>
        </div>
      </div>
    </div>
  );
}

ResultsPanel.propTypes = {
  metrics: PropTypes.shape({
    stockPL: PropTypes.number.isRequired,
    putValue: PropTypes.number.isRequired,
    putCost: PropTypes.number.isRequired,
    netPL: PropTypes.number.isRequired,
    taxImpact: PropTypes.number.isRequired,
    netAfterTax: PropTypes.number.isRequired,
    hedgeEffectiveness: PropTypes.number,
    protectedDownside: PropTypes.string.isRequired,
    breakEvenPrice: PropTypes.number.isRequired,
    taxRate: PropTypes.number.isRequired,
  }).isRequired,
};

export default ResultsPanel;
