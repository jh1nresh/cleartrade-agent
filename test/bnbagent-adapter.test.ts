import { describe, it, expect } from "vitest";
import { buildBnbAgentSdkPlan } from "../src/bnbagent/adapter.js";
import { hashInputs } from "../src/receipt/hash.js";
import { demoStrategy } from "../src/strategy/demo.js";

const sampleIntent = {
  chain: "bsc" as const,
  assetIn: "USDT",
  assetOut: "BNB",
  notionalUsd: 2_500,
  maxSlippageBps: 100,
  rationale: "test intent",
};

describe("BNBAgent SDK adapter", () => {
  it("builds an ERC-8004 registration file without live registration", () => {
    const plan = buildBnbAgentSdkPlan({
      strategy: demoStrategy,
      tradeIntent: sampleIntent,
      now: 1_750_000_000,
    });

    expect(plan.sdk.package).toBe("bnbagent");
    expect(plan.registrationFile.type).toBe(
      "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    );
    expect(plan.registrationFile.services[0]?.name).toBe("ERC-8183");
    expect(plan.registrationFile.registrations).toEqual([]);
    expect(plan.safetyBoundary.wallet).toBe("not_loaded");
  });

  it("builds a deterministic ERC-8183 dry-run job and deliverable manifest", () => {
    const plan = buildBnbAgentSdkPlan({
      strategy: demoStrategy,
      tradeIntent: sampleIntent,
      now: 1_750_000_000,
    });

    expect(plan.jobDescription.version).toBe(1);
    expect(plan.jobDescription.price).toBe("0");
    expect(plan.deliverableManifest.version).toBe(1);
    expect(plan.deliverableManifest.job_id).toBe(0);
    expect(plan.deliverableManifest.chain_id).toBe(97);
    expect(plan.safetyBoundary.onChainSubmit).toBe("disabled");
    expect(hashInputs(plan)).toMatch(/^[0-9a-f]{64}$/);
  });
});
