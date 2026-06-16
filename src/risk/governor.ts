import { type RiskConfig } from "./config.js";
import { type TradeIntentSchema } from "../schema/receipt.js";
import type { z } from "zod";

type TradeIntent = z.infer<typeof TradeIntentSchema>;

/** Live account/run state the governor judges a trade against. */
export interface RiskState {
  equityUsd: number;
  /** Drawdown so far this run, as a positive percentage (e.g. 8 = -8%). */
  currentDrawdownPct: number;
  /** Realized loss today as a positive percentage. */
  dailyLossPct: number;
  consecutiveLosses: number;
  /** Age of the freshest signal data feeding this decision, in seconds. */
  dataAgeSec: number;
  /** Liquidity of the target market in USD. */
  marketLiquidityUsd: number;
  /** Quoted slippage for this intent, in bps. */
  quotedSlippageBps: number;
}

export type RiskDecision = "allow" | "block" | "size_down" | "kill_switch";

export interface RiskVerdict {
  decision: RiskDecision;
  /** Approved notional after any size-down. 0 when blocked / kill-switched. */
  approvedNotionalUsd: number;
  reasons: string[];
}

/**
 * The gate every trade intent must pass before it can reach a signer.
 * Pure function of (intent, state, config) so it is trivially unit-testable and
 * produces the same verdict a judge would re-derive from the risk receipt.
 *
 * Order matters: kill-switch conditions are checked first (hard stop), then
 * hard blocks, then size-down. Never the reverse.
 */
export function evaluateRisk(
  intent: TradeIntent,
  state: RiskState,
  config: RiskConfig,
): RiskVerdict {
  const reasons: string[] = [];

  // 1. Kill-switch: structural failures that should halt all trading.
  if (state.currentDrawdownPct >= config.maxDrawdownPct) {
    reasons.push(
      `drawdown ${state.currentDrawdownPct}% >= cap ${config.maxDrawdownPct}%`,
    );
  }
  if (state.consecutiveLosses >= config.maxConsecutiveLosses) {
    reasons.push(
      `consecutive losses ${state.consecutiveLosses} >= cap ${config.maxConsecutiveLosses}`,
    );
  }
  if (reasons.length > 0) {
    return { decision: "kill_switch", approvedNotionalUsd: 0, reasons };
  }

  // 2. Hard blocks: this trade is unsafe even if trading can continue.
  if (state.dataAgeSec > config.staleDataMaxAgeSec) {
    reasons.push(
      `stale data ${state.dataAgeSec}s > max ${config.staleDataMaxAgeSec}s`,
    );
  }
  if (state.dailyLossPct >= config.maxDailyLossPct) {
    reasons.push(
      `daily loss ${state.dailyLossPct}% >= cap ${config.maxDailyLossPct}%`,
    );
  }
  if (state.marketLiquidityUsd < config.minLiquidityUsd) {
    reasons.push(
      `liquidity $${state.marketLiquidityUsd} < min $${config.minLiquidityUsd}`,
    );
  }
  if (state.quotedSlippageBps > config.maxSlippageBps) {
    reasons.push(
      `slippage ${state.quotedSlippageBps}bps > max ${config.maxSlippageBps}bps`,
    );
  }
  if (intent.maxSlippageBps > config.maxSlippageBps) {
    reasons.push(
      `intent slippage tolerance ${intent.maxSlippageBps}bps > max ${config.maxSlippageBps}bps`,
    );
  }
  if (reasons.length > 0) {
    return { decision: "block", approvedNotionalUsd: 0, reasons };
  }

  // 3. Size-down: trade is allowed but notional exceeds the position cap.
  const maxNotional = (state.equityUsd * config.maxPositionPct) / 100;
  if (intent.notionalUsd > maxNotional) {
    return {
      decision: "size_down",
      approvedNotionalUsd: maxNotional,
      reasons: [
        `notional $${intent.notionalUsd} > cap $${maxNotional} (${config.maxPositionPct}% of equity); sized down`,
      ],
    };
  }

  return {
    decision: "allow",
    approvedNotionalUsd: intent.notionalUsd,
    reasons: ["within all risk limits"],
  };
}
