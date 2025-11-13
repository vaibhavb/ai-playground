# Stock Hedge Simulator

## Prompt
Create an experiment titled **Stock Hedge Simulator** that delivers a React playground where users can explore hedging a long NVDA stock position with protective puts. The build must expose controls for shares owned, cost basis, option characteristics, price scenarios, and visualise hedged vs. unhedged outcomes with live-updating analytics.

## What Was Built
- A Vite-powered React single-page app that models NVDA stock hedged with protective puts in real time.
- Modular components for the input controls, hedge result cards, scenario chart, and tabular breakdowns.
- Computation engine matching the provided equations for stock P/L, put payoff, put cost, net results, and break-even price.
- Interactive chart (Recharts) contrasting hedged vs. unhedged P/L across a dynamically generated price range with a strike reference line.
- Dynamic future-price checkpoint manager so users can add bespoke scenario rows alongside the required default scenarios.
- Instant recalculation as the user manipulates sliders, numeric inputs, and helper buttons (reset, live NVDA price fetch, and max protection coverage).
- Responsive design with optional dark mode for mobile and desktop usability.

## Latest Enhancements
- **Easier knobs & dials:** Every key input now pairs its slider/number entry with a curated dropdown for quick presets, so changing shares, strikes, premiums, and target prices only takes a tap.
- **Reflowed insights:** Results, the outcome table, and the line chart stack in a dedicated insights column so the graph sits directly beneath the table it explains.
- **Readable analytics:** Scenario tables highlight positive vs. negative outcomes, the net P/L card uses color-coded emphasis, and the chart adds zero-line and axis labels for easier interpretation.
- **Future-ready deployment:** The GitHub Pages workflow auto-discovers every Vite experiment directory, builds each with its own base path, and stages them for the static site without additional config.
- **Verified math engine:** Core hedge formulas now live in dedicated utilities with Vitest coverage to lock in stock, option, and risk metrics for every scenario.

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
- The "Use Today's NVDA Price" shortcut fetches live quote data from Yahoo Finance when network access is available.
- Hedge effectiveness is presented as the proportion of downside (or upside capture) retained after purchasing the protective puts.
- The simulator defaults to 1,000 NVDA shares hedged with ten contracts of a $150 put purchased for $10 premium, matching the specification.
