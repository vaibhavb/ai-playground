# Stock Hedge Simulator

## Prompt
Create an experiment titled **Stock Hedge Simulator** that delivers a React playground where users can explore hedging a long NVDA stock position with protective puts. The build must expose controls for shares owned, cost basis, option characteristics, price scenarios, and visualise hedged vs. unhedged outcomes with live-updating analytics.

## What Was Built
- A Vite + React + TypeScript single-page app styled with Tailwind CSS, shadcn/ui primitives, lucide icons, and Framer Motion animations.
- Compact two-column layout that keeps the knob controls anchored while results, charts, and tables flow in a spacious analysis rail.
- Shared calculation engine that matches the provided hedging equations and feeds every visual with stock, option, tax, and net metrics in real time.

## Latest Enhancements

### UI Redesign: "Financial Terminal Noir" (Nov 2025)
Completely rebuilt the interface with a bold, distinctive aesthetic inspired by Bloomberg terminals and modernist financial design:

- **Typography System:** Playfair Display (serif) for editorial headlines paired with JetBrains Mono (monospace) for data precision
- **Dark Brutalist Foundation:** Deep black backgrounds (rgb(8,8,12)) with electric cyan accents and strategic emerald/crimson for profit/loss states
- **Atmospheric Effects:**
  - Subtle grid overlay background texture
  - Radial gradient glows from corners
  - SVG noise texture for depth
  - Backdrop blur and layered transparency
- **Kinetic Data Visualization:** Smooth morphing number animations with spring physics, hover-triggered glow effects, and tabular number spacing
- **Premium Card Design:** Glass-morphic cards with gradient borders, inner accent glows, and micro-interaction scale transforms
- **Terminal-Style Header:** Status indicator with pulsing cyan dot, version badge, live data timestamp, and 6xl Playfair headline

The redesign transforms generic UI into a sophisticated, data-dense terminal that feels purpose-built for financial analytics.

### Core Features
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
