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
});
