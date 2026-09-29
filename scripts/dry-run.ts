/**
 * Dry-run: the end-to-end Track 2 loop with NO live signing.
 *   CMC stub -> signal receipt -> trade intent -> Risk Governor -> risk receipt
 * Every step is sealed into a hash-verifiable receipt and printed. This is the
 * artifact a judge inspects. Run: `pnpm dry-run`.
 */
import { fetchSignalVector } from "../src/cmc/fetcher.js";
import { buildBnbAgentSdkPlan } from "../src/bnbagent/adapter.js";
import { evaluateRisk, type RiskState } from "../src/risk/governor.js";
import { DEFAULT_RISK_CONFIG } from "../src/risk/config.js";
import { sealReceipt, hashInputs } from "../src/receipt/hash.js";
import { demoStrategy } from "../src/strategy/demo.js";
import type { ClearTradeReceipt } from "../src/schema/receipt.js";

// Fixed clock so a dry-run is reproducible (no Date.now() in the loop).
const NOW = 1_750_000_000;
const runId = "dryrun-001";
const receipts: ClearTradeReceipt[] = [];

const signal = await fetchSignalVector({
  universe: demoStrategy.universe,
  now: () => NOW,
});

receipts.push(
  sealReceipt({
    receiptId: "rcpt-signal-1",
    runId,
    mode: "paper",
    kind: "signal",
    timestamp: new Date(NOW * 1000).toISOString(),
    inputsHash: hashInputs(signal),
    strategyId: demoStrategy.strategyId,
    signalSummary: `fetched ${signal.snapshots.length} snapshots from ${signal.source}`,
    sourceRefs: signal.snapshots.map((s) => `cmc:${s.symbol}`),
  }),
);

const bnb = signal.snapshots.find((s) => s.symbol === "BNB");
if (!bnb) throw new Error("BNB snapshot missing from stub");

const intent = {
  chain: "bsc" as const,
  assetIn: "USDT",
  assetOut: "BNB",
  notionalUsd: 3_000,
  maxSlippageBps: demoStrategy.executionRules.maxSlippageBps,
  rationale: "EMA cross + RSI in momentum band (demo)",
};

const state: RiskState = {
  equityUsd: 10_000,
  currentDrawdownPct: 1.5,
  dailyLossPct: 0,
  consecutiveLosses: 0,
  dataAgeSec: NOW - signal.fetchedAt,
  marketLiquidityUsd: bnb.liquidityUsd,
  quotedSlippageBps: 45,
};

const verdict = evaluateRisk(intent, state, DEFAULT_RISK_CONFIG);
const bnbAgentPlan = buildBnbAgentSdkPlan({
  strategy: demoStrategy,
  tradeIntent: { ...intent, notionalUsd: verdict.approvedNotionalUsd },
  now: NOW,
});

receipts.push(
  sealReceipt({
    receiptId: "rcpt-risk-1",
    runId,
    mode: "paper",
    kind: "risk",
    timestamp: new Date(NOW * 1000).toISOString(),
    inputsHash: hashInputs({ intent, state, config: DEFAULT_RISK_CONFIG }),
    strategyId: demoStrategy.strategyId,
    riskDecision: verdict.decision,
    tradeIntent: { ...intent, notionalUsd: verdict.approvedNotionalUsd },
    execution: { status: "not_sent" }, // dry-run: never sent
    sourceRefs: ["rcpt-signal-1"],
  }),
);

receipts.push(
  sealReceipt({
    receiptId: "rcpt-execution-1",
    runId,
    mode: "paper",
    kind: "execution",
    timestamp: new Date(NOW * 1000).toISOString(),
    inputsHash: hashInputs(bnbAgentPlan),
    strategyId: demoStrategy.strategyId,
    execution: {
      status: "not_sent",
      venue: "BNBAgent SDK ERC-8183 dry-run",
    },
    sourceRefs: ["rcpt-risk-1", "bnbagent:erc8004", "bnbagent:erc8183"],
  }),
);

console.log(`ClearTrade dry-run (${runId}) — mode=paper, nothing signed.\n`);
console.log(`Risk verdict: ${verdict.decision}`);
console.log(`  reasons: ${verdict.reasons.join("; ")}`);
console.log(`  approved notional: $${verdict.approvedNotionalUsd}\n`);
console.log(
  `BNBAgent SDK: ${bnbAgentPlan.mode}, ${bnbAgentPlan.capabilities.join(" + ")}, on-chain submit ${bnbAgentPlan.safetyBoundary.onChainSubmit}\n`,
);
console.log(JSON.stringify(receipts, null, 2));
