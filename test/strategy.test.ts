import { describe, it, expect } from "vitest";
import { parseStrategySpec } from "../src/schema/strategy.js";
import { demoStrategy } from "../src/strategy/demo.js";

describe("strategy schema", () => {
  it("accepts the demo strategy", () => {
    expect(() => parseStrategySpec(demoStrategy)).not.toThrow();
  });

  it("rejects a position cap over 100%", () => {
    const bad = {
      ...demoStrategy,
      riskRules: { ...demoStrategy.riskRules, maxPositionPct: 150 },
    };
    expect(() => parseStrategySpec(bad)).toThrow();
  });

  it("rejects an empty universe", () => {
    const bad = { ...demoStrategy, universe: [] };
    expect(() => parseStrategySpec(bad)).toThrow();
  });

  it("rejects a kill switch with no conditions", () => {
    const bad = {
      ...demoStrategy,
      riskRules: { ...demoStrategy.riskRules, killSwitch: [] },
    };
    expect(() => parseStrategySpec(bad)).toThrow();
  });

  it("requires at least one sponsor capability", () => {
    const bad = { ...demoStrategy, sponsorCapabilities: [] };
    expect(() => parseStrategySpec(bad)).toThrow();
  });

  it("declares the BNB AI Agent SDK sponsor capability", () => {
    expect(demoStrategy.sponsorCapabilities).toContain("bnb_ai_agent_sdk");
  });

  it("requires replay rules for the backtest contract", () => {
    const bad = {
      ...demoStrategy,
      backtest: { ...demoStrategy.backtest, replayRules: [] },
    };
    expect(() => parseStrategySpec(bad)).toThrow();
  });
});
