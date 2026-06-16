import { z } from "zod";

/**
 * Default risk budget for the hackathon. Conservative on purpose: Track 1 scoring
 * punishes drawdown, so the governor caps exposure hard. Override via a JSON file
 * pointed to by CLEARTRADE_RISK_CONFIG, but never loosen these without a logged
 * decision + a fresh risk receipt.
 */
export const RiskConfigSchema = z.object({
  maxPositionPct: z.number().positive().max(100),
  maxDailyLossPct: z.number().positive().max(100),
  maxDrawdownPct: z.number().positive().max(100),
  maxSlippageBps: z.number().int().nonnegative(),
  minLiquidityUsd: z.number().nonnegative(),
  maxConsecutiveLosses: z.number().int().positive(),
  staleDataMaxAgeSec: z.number().int().positive(),
});

export type RiskConfig = z.infer<typeof RiskConfigSchema>;

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxPositionPct: 25, // high-conviction sleeve cap (barbell: 70-85% idle)
  maxDailyLossPct: 5,
  maxDrawdownPct: 12,
  maxSlippageBps: 100, // 1%
  minLiquidityUsd: 250_000,
  maxConsecutiveLosses: 3,
  staleDataMaxAgeSec: 120,
};
