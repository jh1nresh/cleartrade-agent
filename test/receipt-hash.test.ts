import { describe, it, expect } from "vitest";
import { canonicalize, sealReceipt, verifyReceiptHash } from "../src/receipt/hash.js";
import type { ClearTradeReceiptBody } from "../src/schema/receipt.js";

const body: ClearTradeReceiptBody = {
  receiptId: "rcpt-001",
  runId: "run-abc",
  mode: "paper",
  kind: "signal",
  timestamp: "2026-06-16T00:00:00Z",
  inputsHash: "deadbeef",
  strategyId: "momentum-v0",
  signalSummary: "BNB momentum continuation",
  sourceRefs: ["cmc:BNB"],
};

describe("receipt hash", () => {
  it("is independent of object key order", () => {
    const reordered = {
      sourceRefs: ["cmc:BNB"],
      strategyId: "momentum-v0",
      signalSummary: "BNB momentum continuation",
      inputsHash: "deadbeef",
      timestamp: "2026-06-16T00:00:00Z",
      kind: "signal",
      mode: "paper",
      runId: "run-abc",
      receiptId: "rcpt-001",
    };
    expect(canonicalize(body)).toBe(canonicalize(reordered));
  });

  it("seals a receipt whose hash verifies", () => {
    const sealed = sealReceipt(body);
    expect(sealed.receiptHash).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyReceiptHash(sealed)).toBe(true);
  });

  it("detects tampering", () => {
    const sealed = sealReceipt(body);
    const tampered = { ...sealed, signalSummary: "FAKE — pumped" };
    expect(verifyReceiptHash(tampered)).toBe(false);
  });

  it("ignores undefined optional fields in the hash", () => {
    const withUndef = { ...body, tradeId: undefined };
    expect(canonicalize(withUndef)).toBe(canonicalize(body));
  });
});
