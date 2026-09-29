/**
 * Track 2 export: writes the backtestable strategy packet judges can inspect.
 * This is deterministic and paper-only; it does not fetch live data or sign.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildBnbAgentSdkPlan } from "../src/bnbagent/adapter.js";
import { hashInputs } from "../src/receipt/hash.js";
import { parseStrategySpec } from "../src/schema/strategy.js";
import { demoStrategy } from "../src/strategy/demo.js";

const OUT_DIR = resolve("artifacts");
const JSON_PATH = resolve(OUT_DIR, "cleartrade-track2-strategy.json");
const REPORT_PATH = resolve(OUT_DIR, "cleartrade-track2-strategy.md");

const strategy = parseStrategySpec(demoStrategy);
const sampleTradeIntent = {
  chain: "bsc" as const,
  assetIn: "USDT",
  assetOut: "BNB",
  notionalUsd: 2_500,
  maxSlippageBps: strategy.executionRules.maxSlippageBps,
  rationale: "Track 2 strategy packet sample intent",
};
const bnbAgentSdkPlan = buildBnbAgentSdkPlan({
  strategy,
  tradeIntent: sampleTradeIntent,
  now: 1_750_000_000,
});
const packetBody = {
  artifact: "cleartrade-track2-strategy",
  artifactVersion: "0.1.0",
  competition: "BNB Hack: AI Trading Agent Edition",
  track: "Track 2 - Strategy Skills",
  status: "submission_candidate_paper_only",
  sponsorCapabilityReceipt: {
    primary: "CoinMarketCap Agent Hub / market data",
    mode: "declared_and_schema_bound",
    note: "Live CMC fetch is intentionally gated; the strategy packet declares the CMC inputs and replay contract without wallet signing.",
  },
  safetyBoundary: {
    liveSigning: "disabled",
    privateKeys: "not accepted by env or strategy packet",
    funds: "paper-only; no customer or user funds",
  },
  bnbAgentSdkPlan,
  strategy,
  verification: {
    commands: ["pnpm check", "pnpm test", "pnpm dry-run", "pnpm strategy"],
    dryRunReceipt: "pnpm dry-run emits sealed signal and risk receipts",
  },
};

const packet = {
  ...packetBody,
  artifactHash: hashInputs(packetBody),
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(JSON_PATH, `${JSON.stringify(packet, null, 2)}\n`);
await writeFile(REPORT_PATH, renderReport(packet));

console.log(`Wrote ${JSON_PATH}`);
console.log(`Wrote ${REPORT_PATH}`);
console.log(`artifactHash ${packet.artifactHash}`);

function renderReport(exported: typeof packet): string {
  return `# ClearTrade Track 2 Strategy Packet

## Submission Fit

- Competition: ${exported.competition}
- Track: ${exported.track}
- Status: ${exported.status}
- Sponsor capability: ${exported.sponsorCapabilityReceipt.primary}
- BNB Agent SDK: ${exported.bnbAgentSdkPlan.capabilities.join(" + ")}
- Artifact hash: \`${exported.artifactHash}\`

## Strategy

- ID: \`${exported.strategy.strategyId}\`
- Objective: \`${exported.strategy.objective}\`
- Universe: ${exported.strategy.universe.join(", ")}
- Timeframe: ${exported.strategy.timeframe}
- Primary metric: ${exported.strategy.evaluation.primaryMetric}
- Secondary metrics: ${exported.strategy.evaluation.secondaryMetrics.join(", ")}

## Backtest Contract

- Data source: ${exported.strategy.backtest.dataSource}
- Replay window: ${exported.strategy.backtest.replayWindow}
- Cost model: ${exported.strategy.backtest.costModel}

${exported.strategy.backtest.replayRules.map((rule) => `- ${rule}`).join("\n")}

## Safety Boundary

- Live signing: ${exported.safetyBoundary.liveSigning}
- Private keys: ${exported.safetyBoundary.privateKeys}
- Funds: ${exported.safetyBoundary.funds}
- BNBAgent wallet: ${exported.bnbAgentSdkPlan.safetyBoundary.wallet}
- BNBAgent network calls: ${exported.bnbAgentSdkPlan.safetyBoundary.networkCalls}
- BNBAgent on-chain submit: ${exported.bnbAgentSdkPlan.safetyBoundary.onChainSubmit}

## Verification

${exported.verification.commands.map((command) => `- \`${command}\``).join("\n")}

Run \`pnpm dry-run\` to inspect sealed signal and risk receipts.
`;
};
