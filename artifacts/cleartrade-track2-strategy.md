# ClearTrade Track 2 Strategy Packet

## Submission Fit

- Competition: BNB Hack: AI Trading Agent Edition
- Track: Track 2 - Strategy Skills
- Status: submission_candidate_paper_only
- Sponsor capability: CoinMarketCap Agent Hub / market data
- Artifact hash: `99c528ddfda7db46095251223ff255c93eb1e0466479f14a08c05708d17cfde5`

## Strategy

- ID: `bnb-momentum-v0`
- Objective: `track2_strategy_skill`
- Universe: BNB, CAKE
- Timeframe: 1h
- Primary metric: pnl_after_costs
- Secondary metrics: max_drawdown, win_rate, turnover, receipt_coverage

## Backtest Contract

- Data source: CoinMarketCap Agent Hub / market-data snapshots
- Replay window: 2026-06-22T00:00:00Z to 2026-06-28T23:59:59Z
- Cost model: spot execution with configured slippage cap and simulated fees

- evaluate entry and exit rules on closed 1h candles
- reject trades when CMC data is older than 120 seconds
- record one sealed receipt for every signal and risk decision
- score pnl_after_costs with max_drawdown, win_rate, turnover, and receipt_coverage

## Safety Boundary

- Live signing: disabled
- Private keys: not accepted by env or strategy packet
- Funds: paper-only; no customer or user funds

## Verification

- `pnpm check`
- `pnpm test`
- `pnpm dry-run`
- `pnpm strategy`

Run `pnpm dry-run` to inspect sealed signal and risk receipts.
