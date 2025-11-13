# Stock Hedge Simulator

## Prompt
Create an experiment titled **Stock Hedge Simulator** that delivers a React playground where users can explore hedging a long NVDA stock position with protective puts. The build must expose controls for shares owned, cost basis, option characteristics, price scenarios, and visualise hedged vs. unhedged outcomes with live-updating analytics.

## What Was Built
- A Vite + React + TypeScript single-page app styled with Tailwind CSS, shadcn/ui primitives, lucide icons, and Framer Motion animations.
- Compact two-column layout that keeps the knob controls anchored while results, charts, and tables flow in a spacious analysis rail.
- Shared calculation engine that matches the provided hedging equations and feeds every visual with stock, option, tax, and net metrics in real time.

## Latest Enhancements
- **Multi-symbol hedging with live quotes:** Quick presets cover NVDA, BRK.B, ASML, and MSFT while custom tickers auto-normalise for Yahoo Finance fetches; a refresh button pulls the latest price and snaps cost basis in one click.
- **Options Profit Calculator integration:** The app fans out across several CORS-friendly mirrors of the OptionsProfitCalculator API so protective put chains can be searched, filtered by expiration, and applied directly to the simulator.
- **Tax-aware analytics:** Gross, tax impact, and after-tax nets appear together across summary cards, scenario tables, and the Recharts visualisation.
- **Scenario checkpoint manager:** Add or remove bespoke price targets alongside the baseline stress points and see each reflected in the table and chart instantly.
- **Type-safe testing:** Vitest suites cover both the hedging math utilities and the Yahoo Finance quote adapter to ensure future tweaks keep the finance model intact.

## Running Locally
```bash
cd stock-hedge-simulator
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Test
```bash
npm test
```

## Notes
- Yahoo Finance quotes power the live pricing inputs; symbols with dots (e.g. `BRK.B`) are normalised to the hyphenated format that Yahoo expects.
- Put quotes come from https://www.optionsprofitcalculator.com/ajax/getOptions using a tiered proxy strategy to avoid Cloudflare roadblocks; if all endpoints fail the UI gracefully falls back to manual entry.
- Tailwind utility classes are merged with shadcn/ui variants to keep controls compact and visually consistent across the light-weight dashboard.
