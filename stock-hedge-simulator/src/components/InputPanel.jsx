import { useMemo } from 'react';
import PropTypes from 'prop-types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const sharePresets = [100, 500, 1000, 1500, 2000, 3000];
const strikePresets = [120, 140, 150, 160, 175, 200];
const premiumPresets = [5, 7.5, 10, 12.5, 15];
const contractsPresets = [5, 8, 10, 12, 15, 20];
const futurePricePresets = [80, 100, 120, 150, 187, 220, 250];

export function InputPanel({
  inputs,
  onNumberChange,
  onTextChange,
  onExpirationChange,
  onReset,
  onUseTodayPrice,
  onMaxProtection,
  isFetchingPrice,
  fetchError,
  scenarioCheckpoints,
  onAddCheckpoint,
  onUpdateCheckpoint,
  onRemoveCheckpoint,
}) {
  const contractsNeeded = useMemo(
    () => Math.ceil(inputs.sharesOwned / 100),
    [inputs.sharesOwned]
  );

  const selectValue = (value, presets) => (presets.includes(value) ? value : '');
  const handlePresetChange = (field) => (event) => {
    const { value } = event.target;
    if (!value) return;
    onNumberChange(field, Number(value));
  };

  return (
    <div className="card">
      <h2>Controls</h2>
      <div className="button-row" style={{ marginBottom: '1rem' }}>
        <button className="button" type="button" onClick={onReset}>
          Reset to Default
        </button>
        <button
          className="button"
          type="button"
          onClick={onUseTodayPrice}
          disabled={isFetchingPrice}
        >
          {isFetchingPrice ? 'Fetching price…' : "Use Today's NVDA Price"}
        </button>
        <button className="button" type="button" onClick={onMaxProtection}>
          Max Protection
        </button>
      </div>
      {fetchError ? (
        <p className="badge" role="alert">
          Could not load live data: {fetchError}
        </p>
      ) : null}

      <section>
        <h3 className="section-title">Stock Position</h3>
        <div className="input-group">
          <label htmlFor="sharesOwned">Shares owned</label>
          <div className="control-grid">
            <input
              id="sharesOwned"
              type="number"
              min={0}
              step={100}
              value={inputs.sharesOwned}
              onChange={(event) =>
                onNumberChange('sharesOwned', Number(event.target.value) || 0)
              }
            />
            <select
              aria-label="Share quick pick"
              value={selectValue(inputs.sharesOwned, sharePresets)}
              onChange={handlePresetChange('sharesOwned')}
            >
              <option value="">Pick preset…</option>
              {sharePresets.map((option) => (
                <option key={option} value={option}>
                  {option.toLocaleString()} shares
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="sharePurchasePrice">Purchase price per share</label>
          <input
            id="sharePurchasePrice"
            type="number"
            min={0}
            step={0.01}
            value={inputs.sharePurchasePrice}
            onChange={(event) =>
              onNumberChange(
                'sharePurchasePrice',
                Number(event.target.value) || 0
              )
            }
          />
        </div>
      </section>

      <section>
        <h3 className="section-title">Protective Put</h3>
        <div className="input-group">
          <label htmlFor="putStrike">Put strike</label>
          <div className="slider-row">
            <input
              id="putStrike"
              type="range"
              min={50}
              max={400}
              step={1}
              value={inputs.putStrike}
              onChange={(event) =>
                onNumberChange('putStrike', Number(event.target.value))
              }
            />
            <input
              type="number"
              min={0}
              step={1}
              value={inputs.putStrike}
              onChange={(event) =>
                onNumberChange('putStrike', Number(event.target.value) || 0)
              }
            />
          </div>
          <div className="quick-select">
            <label className="sr-only" htmlFor="putStrikePreset">
              Strike quick pick
            </label>
            <select
              id="putStrikePreset"
              value={selectValue(inputs.putStrike, strikePresets)}
              onChange={handlePresetChange('putStrike')}
            >
              <option value="">Strike presets…</option>
              {strikePresets.map((strike) => (
                <option key={strike} value={strike}>
                  ${strike}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="putExpirationDate">Expiration</label>
          <input
            id="putExpirationDate"
            type="date"
            value={inputs.putExpirationDate}
            onChange={(event) => onExpirationChange(event.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="contractsBought">Contracts bought</label>
          <div className="input-inline">
            <input
              id="contractsBought"
              type="number"
              min={0}
              step={1}
              value={inputs.contractsBought}
              onChange={(event) =>
                onNumberChange('contractsBought', Number(event.target.value) || 0)
              }
            />
            <span className="badge">
              {contractsNeeded} contracts covers {inputs.sharesOwned} shares
            </span>
          </div>
          <div className="quick-select">
            <label className="sr-only" htmlFor="contractsPreset">
              Contract quick pick
            </label>
            <select
              id="contractsPreset"
              value={selectValue(inputs.contractsBought, contractsPresets)}
              onChange={handlePresetChange('contractsBought')}
            >
              <option value="">Match contracts…</option>
              {contractsPresets.map((contract) => (
                <option key={contract} value={contract}>
                  {contract} contracts
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="premiumPerShare">Premium per share</label>
          <div className="control-grid">
            <input
              id="premiumPerShare"
              type="number"
              min={0}
              step={0.01}
              value={inputs.premiumPerShare}
              onChange={(event) =>
                onNumberChange('premiumPerShare', Number(event.target.value) || 0)
              }
            />
            <select
              aria-label="Premium quick pick"
              value={selectValue(inputs.premiumPerShare, premiumPresets)}
              onChange={handlePresetChange('premiumPerShare')}
            >
              <option value="">Premium presets…</option>
              {premiumPresets.map((premium) => (
                <option key={premium} value={premium}>
                  ${premium}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="section-title">Scenario</h3>
        <div className="input-group">
          <label htmlFor="futureStockPrice">Future NVDA price</label>
          <div className="slider-row">
            <input
              id="futureStockPrice"
              type="range"
              min={30}
              max={500}
              step={1}
              value={inputs.futureStockPrice}
              onChange={(event) =>
                onNumberChange('futureStockPrice', Number(event.target.value))
              }
            />
            <input
              type="number"
              min={0}
              step={1}
              value={inputs.futureStockPrice}
              onChange={(event) =>
                onNumberChange('futureStockPrice', Number(event.target.value) || 0)
              }
            />
          </div>
          <div className="quick-select">
            <label className="sr-only" htmlFor="futurePricePreset">
              Future price quick pick
            </label>
            <select
              id="futurePricePreset"
              value={selectValue(inputs.futureStockPrice, futurePricePresets)}
              onChange={handlePresetChange('futureStockPrice')}
            >
              <option value="">Scenario presets…</option>
              {futurePricePresets.map((price) => (
                <option key={price} value={price}>
                  ${price}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="analysisDate">Analysis date</label>
          <input
            id="analysisDate"
            type="date"
            value={inputs.analysisDate}
            onChange={(event) => onTextChange('analysisDate', event.target.value)}
          />
        </div>
      </section>

      <section>
        <h3 className="section-title">Future Price Checkpoints</h3>
        <p style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Model additional outcomes beyond the default table. Enter prices to
          instantly see their hedged impact.
        </p>
        <div className="panels">
          {scenarioCheckpoints.map((checkpoint) => (
            <div className="scenario-row" key={checkpoint.id}>
              <input
                type="number"
                min={0}
                step={1}
                value={checkpoint.price}
                onChange={(event) =>
                  onUpdateCheckpoint(checkpoint.id, Number(event.target.value) || 0)
                }
              />
              <button
                type="button"
                className="button"
                onClick={() => onRemoveCheckpoint(checkpoint.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="button primary"
          style={{ marginTop: '0.75rem' }}
          onClick={onAddCheckpoint}
        >
          Add checkpoint at {currencyFormatter.format(inputs.futureStockPrice)}
        </button>
      </section>
    </div>
  );
}

InputPanel.propTypes = {
  inputs: PropTypes.shape({
    sharesOwned: PropTypes.number.isRequired,
    sharePurchasePrice: PropTypes.number.isRequired,
    putStrike: PropTypes.number.isRequired,
    putExpirationDate: PropTypes.string.isRequired,
    contractsBought: PropTypes.number.isRequired,
    premiumPerShare: PropTypes.number.isRequired,
    futureStockPrice: PropTypes.number.isRequired,
    analysisDate: PropTypes.string.isRequired,
  }).isRequired,
  onNumberChange: PropTypes.func.isRequired,
  onTextChange: PropTypes.func.isRequired,
  onExpirationChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onUseTodayPrice: PropTypes.func.isRequired,
  onMaxProtection: PropTypes.func.isRequired,
  isFetchingPrice: PropTypes.bool.isRequired,
  fetchError: PropTypes.string,
  scenarioCheckpoints: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number.isRequired, price: PropTypes.number.isRequired })
  ).isRequired,
  onAddCheckpoint: PropTypes.func.isRequired,
  onUpdateCheckpoint: PropTypes.func.isRequired,
  onRemoveCheckpoint: PropTypes.func.isRequired,
};

InputPanel.defaultProps = {
  fetchError: null,
};

export default InputPanel;
