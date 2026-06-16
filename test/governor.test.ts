import { describe, it, expect } from "vitest";
import { evaluateRisk, type RiskState } from "../src/risk/governor.js";
import { DEFAULT_RISK_CONFIG } from "../src/risk/config.js";

const intent = {
  chain: "bsc" as const,
  assetIn: "USDT",
  assetOut: "BNB",
  notionalUsd: 1_000,
  maxSlippageBps: 50,
  rationale: "momentum continuation",
};

const healthyState: RiskState = {
  equityUsd: 10_000,
  currentDrawdownPct: 2,
  dailyLossPct: 1,
  consecutiveLosses: 0,
  dataAgeSec: 10,
  marketLiquidityUsd: 5_000_000,
  quotedSlippageBps: 40,
};

const cfg = DEFAULT_RISK_CONFIG;

describe("risk governor", () => {
  it("allows a healthy in-budget trade", () => {
    const v = evaluateRisk(intent, healthyState, cfg);
    expect(v.decision).toBe("allow");
    expect(v.approvedNotionalUsd).toBe(1_000);
  });

  it("kill-switches when drawdown breaches the cap", () => {
    const v = evaluateRisk(
      intent,
      { ...healthyState, currentDrawdownPct: cfg.maxDrawdownPct },
      cfg,
    );
    expect(v.decision).toBe("kill_switch");
    expect(v.approvedNotionalUsd).toBe(0);
  });

  it("kill-switches after too many consecutive losses", () => {
    const v = evaluateRisk(
      intent,
      { ...healthyState, consecutiveLosses: cfg.maxConsecutiveLosses },
      cfg,
    );
    expect(v.decision).toBe("kill_switch");
  });

  it("blocks on stale data", () => {
    const v = evaluateRisk(
      intent,
      { ...healthyState, dataAgeSec: cfg.staleDataMaxAgeSec + 1 },
      cfg,
    );
    expect(v.decision).toBe("block");
  });

  it("blocks on thin liquidity", () => {
    const v = evaluateRisk(
      intent,
      { ...healthyState, marketLiquidityUsd: cfg.minLiquidityUsd - 1 },
      cfg,
    );
    expect(v.decision).toBe("block");
  });

  it("blocks when quoted slippage exceeds the cap", () => {
    const v = evaluateRisk(
      intent,
      { ...healthyState, quotedSlippageBps: cfg.maxSlippageBps + 1 },
      cfg,
    );
    expect(v.decision).toBe("block");
  });

  it("sizes down a notional above the position cap", () => {
    const v = evaluateRisk(
      { ...intent, notionalUsd: 9_000 },
      healthyState,
      cfg,
    );
    expect(v.decision).toBe("size_down");
    // 25% of 10k equity
    expect(v.approvedNotionalUsd).toBe(2_500);
  });

  it("prioritises kill-switch over block over size-down", () => {
    const worstCase: RiskState = {
      ...healthyState,
      currentDrawdownPct: cfg.maxDrawdownPct + 5, // kill
      dataAgeSec: cfg.staleDataMaxAgeSec + 100, // block
    };
    const v = evaluateRisk({ ...intent, notionalUsd: 9_000 }, worstCase, cfg);
    expect(v.decision).toBe("kill_switch");
  });
});
