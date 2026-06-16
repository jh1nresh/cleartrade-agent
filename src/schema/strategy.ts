import { z } from "zod";

/**
 * ClearTrade strategy spec — the backtestable artifact a Track 2 submission produces.
 * Zod schema is the source of truth; the TS type is inferred from it so runtime
 * validation and compile-time types can never drift apart.
 */
export const TimeframeSchema = z.enum(["5m", "15m", "1h", "4h", "1d"]);

export const RiskRulesSchema = z.object({
  maxPositionPct: z.number().positive().max(100),
  maxDailyLossPct: z.number().positive().max(100),
  maxDrawdownPct: z.number().positive().max(100),
  stopLossRule: z.string().min(1),
  takeProfitRule: z.string().min(1).optional(),
  killSwitch: z.array(z.string().min(1)).min(1),
});

export const ExecutionRulesSchema = z.object({
  mode: z.enum(["paper", "dry_run", "live_gated"]),
  maxSlippageBps: z.number().int().nonnegative(),
  minLiquidityUsd: z.number().nonnegative(),
  simulatedCosts: z.boolean(),
});

export const ClearTradeStrategySpecSchema = z.object({
  strategyId: z.string().min(1),
  objective: z.enum(["track1_live_pnl", "track2_strategy_skill"]),
  universe: z.array(z.string().min(1)).min(1),
  timeframe: TimeframeSchema,
  signalInputs: z.object({
    cmcMarketData: z.array(z.string()).min(1),
    technicalIndicators: z.array(z.string()),
    sentiment: z.array(z.string()).optional(),
    newsNarratives: z.array(z.string()).optional(),
    onchainSignals: z.array(z.string()).optional(),
  }),
  entryRules: z.array(z.string().min(1)).min(1),
  exitRules: z.array(z.string().min(1)).min(1),
  riskRules: RiskRulesSchema,
  executionRules: ExecutionRulesSchema,
  evaluation: z.object({
    primaryMetric: z.literal("pnl_after_costs"),
    secondaryMetrics: z.array(
      z.enum(["max_drawdown", "win_rate", "turnover", "receipt_coverage"]),
    ),
  }),
});

export type ClearTradeStrategySpec = z.infer<typeof ClearTradeStrategySpecSchema>;

/** Parse + validate; throws ZodError with a readable path on failure. */
export function parseStrategySpec(input: unknown): ClearTradeStrategySpec {
  return ClearTradeStrategySpecSchema.parse(input);
}
