import { z } from "zod";

/**
 * ClearTradeReceipt — the audit trail. One receipt per signal / risk decision /
 * execution / evaluation. `receiptHash` is computed over the receipt body
 * (every field except the hash itself) so a judge can re-derive and verify it.
 */
export const ReceiptKindSchema = z.enum([
  "signal",
  "risk",
  "execution",
  "evaluation",
]);

export const RiskDecisionSchema = z.enum([
  "allow",
  "block",
  "size_down",
  "kill_switch",
]);

export const TradeIntentSchema = z.object({
  chain: z.literal("bsc"),
  assetIn: z.string().min(1),
  assetOut: z.string().min(1),
  notionalUsd: z.number().nonnegative(),
  maxSlippageBps: z.number().int().nonnegative(),
  rationale: z.string().min(1),
});

export const ExecutionResultSchema = z.object({
  txHash: z.string().optional(),
  venue: z.string().optional(),
  status: z.enum(["not_sent", "sent", "confirmed", "failed"]),
  realizedSlippageBps: z.number().optional(),
});

export const EvaluationResultSchema = z.object({
  pnlUsd: z.number().optional(),
  pnlPct: z.number().optional(),
  drawdownPct: z.number().optional(),
  ruleCompliance: z.enum(["pass", "fail", "weak"]),
  notes: z.string(),
});

/** Receipt body — everything that gets hashed. `receiptHash` is added on top. */
export const ClearTradeReceiptBodySchema = z.object({
  receiptId: z.string().min(1),
  runId: z.string().min(1),
  tradeId: z.string().optional(),
  mode: z.enum(["paper", "dry_run", "live"]),
  kind: ReceiptKindSchema,
  timestamp: z.string().min(1),
  inputsHash: z.string().min(1),
  strategyId: z.string().min(1),
  signalSummary: z.string().optional(),
  riskDecision: RiskDecisionSchema.optional(),
  tradeIntent: TradeIntentSchema.optional(),
  execution: ExecutionResultSchema.optional(),
  evaluation: EvaluationResultSchema.optional(),
  sourceRefs: z.array(z.string()),
});

export const ClearTradeReceiptSchema = ClearTradeReceiptBodySchema.extend({
  receiptHash: z.string().min(1),
});

export type ClearTradeReceiptBody = z.infer<typeof ClearTradeReceiptBodySchema>;
export type ClearTradeReceipt = z.infer<typeof ClearTradeReceiptSchema>;

export function parseReceipt(input: unknown): ClearTradeReceipt {
  return ClearTradeReceiptSchema.parse(input);
}
