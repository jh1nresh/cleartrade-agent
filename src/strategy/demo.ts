import type { ClearTradeStrategySpec } from "../schema/strategy.js";

/**
 * One worked demo strategy — momentum continuation on BNB. Doubles as the
 * Track 2 example deliverable and the fixture the schema tests validate.
 */
export const demoStrategy: ClearTradeStrategySpec = {
  strategyId: "bnb-momentum-v0",
  objective: "track2_strategy_skill",
  sponsorCapabilities: ["coinmarketcap_agent_hub", "coinmarketcap_market_data"],
  universe: ["BNB", "CAKE"],
  timeframe: "1h",
  signalInputs: {
    cmcMarketData: ["price", "volume24h", "marketCap", "pctChange24h"],
    technicalIndicators: ["ema_fast_slow_cross", "rsi"],
    sentiment: ["cmc_trending_rank"],
  },
  entryRules: [
    "EMA(12) crosses above EMA(26) on the 1h close",
    "RSI(14) between 50 and 70 (momentum, not overbought)",
    "24h volume above 30-day median (volume confirmation)",
  ],
  exitRules: [
    "EMA(12) crosses back below EMA(26)",
    "stop-loss hit",
    "RSI(14) > 80 (overbought; take partial profit)",
  ],
  riskRules: {
    maxPositionPct: 25,
    maxDailyLossPct: 5,
    maxDrawdownPct: 12,
    stopLossRule: "fixed -4% from entry, tightened to breakeven after +3%",
    takeProfitRule: "scale out 50% at +6%, trail the rest",
    killSwitch: [
      "drawdown >= 12%",
      "3 consecutive losing trades",
      "CMC data older than 120s",
      "receipt writer failure",
    ],
  },
  executionRules: {
    mode: "paper",
    maxSlippageBps: 100,
    minLiquidityUsd: 250_000,
    simulatedCosts: true,
  },
  backtest: {
    dataSource: "CoinMarketCap Agent Hub / market-data snapshots",
    replayWindow: "2026-06-22T00:00:00Z to 2026-06-28T23:59:59Z",
    costModel: "spot execution with configured slippage cap and simulated fees",
    replayRules: [
      "evaluate entry and exit rules on closed 1h candles",
      "reject trades when CMC data is older than 120 seconds",
      "record one sealed receipt for every signal and risk decision",
      "score pnl_after_costs with max_drawdown, win_rate, turnover, and receipt_coverage",
    ],
  },
  evaluation: {
    primaryMetric: "pnl_after_costs",
    secondaryMetrics: ["max_drawdown", "win_rate", "turnover", "receipt_coverage"],
  },
};
