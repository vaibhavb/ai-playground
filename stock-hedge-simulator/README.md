# Stock Hedge Simulator

## Prompt
Create an experiment titled **Stock Hedge Simulator** that delivers a React playground where users can explore hedging a long NVDA stock position with protective puts. The build must expose controls for shares owned, cost basis, option characteristics, price scenarios, and visualise hedged vs. unhedged outcomes with live-updating analytics.

## What Was Built
- A Vite-powered React single-page app that models live stock hedges with protective puts, starting with NVDA, BRK.B, ASML, and AAPL tickers and extensible to others.
- Modular components for the input controls, hedge result cards, scenario chart, and tabular breakdowns.
- Computation engine matching the provided equations for stock P/L, put payoff, put cost, net results, and break-even price.
- Interactive chart (Recharts) contrasting hedged vs. unhedged P/L across a dynamically generated price range with a strike reference line.
- Dynamic future-price checkpoint manager so users can add bespoke scenario rows alongside the required default scenarios.
- Instant recalculation as the user manipulates sliders, numeric inputs, and helper buttons (reset, quote refresh, max protection coverage, and live price syncing).
- Responsive design with optional dark mode for mobile and desktop usability.

## Latest Enhancements

- **Multi-ticker hedging:** Switch between NVDA, BRK.B, ASML, and AAPL (or extend the list) with automatic cost-basis syncing from live Stooq quotes.
- **Live option discovery:** Pull near-the-money put quotes from Yahoo Finance and apply strikes, expirations, and premiums to the model with one click, falling back gracefully when data is unavailable.
- **After-tax analytics:** Layer tax assumptions into the cash-flow engine to compare gross vs. after-tax hedged outcomes across the scenario table, summary cards, and chart.
- **Easier knobs & dials:** Every key input still pairs its slider/number entry with a curated dropdown for quick presets so changes only take a tap.
- **Future-ready deployment:** The GitHub Pages workflow auto-discovers every Vite experiment directory, builds each with its own base path, and stages them for the static site without additional config.

## Running Locally
```
cd stock-hedge-simulator
npm install
npm run dev
```

## Build
```
npm run build
```

## Test
```
npm test
```

## Notes
- Quote refresh pulls the latest close from Stooq; when a symbol is changed the simulator syncs cost basis, strike, and scenario price to the new market level.
- Put quote discovery leverages Yahoo Finance's option chain endpoint. If the request is blocked or returns no data, manual premium inputs continue to work as before.
- Hedge effectiveness is presented as the proportion of downside (or upside capture) retained after purchasing the protective puts.
- The simulator defaults to 1,000 shares hedged with ten contracts and a 25% tax rate, aligning with the initial specification but now easily adjustable.
