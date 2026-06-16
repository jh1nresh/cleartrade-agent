import { createHash } from "node:crypto";
import {
  type ClearTradeReceipt,
  type ClearTradeReceiptBody,
  ClearTradeReceiptBodySchema,
} from "../schema/receipt.js";

/**
 * Deterministic, order-independent JSON canonicalization. Object keys are sorted
 * recursively so the same logical receipt always hashes to the same digest,
 * regardless of property insertion order. Arrays keep their order (order is
 * semantically meaningful for e.g. sourceRefs).
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
  return `{${entries.join(",")}}`;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Hash the receipt body (the hash never covers itself). */
export function hashReceiptBody(body: ClearTradeReceiptBody): string {
  return sha256Hex(canonicalize(body));
}

/** Validate a body then seal it with its receiptHash → a complete receipt. */
export function sealReceipt(body: ClearTradeReceiptBody): ClearTradeReceipt {
  const validated = ClearTradeReceiptBodySchema.parse(body);
  return { ...validated, receiptHash: hashReceiptBody(validated) };
}

/** True iff the receipt's stored hash matches a fresh hash of its body. */
export function verifyReceiptHash(receipt: ClearTradeReceipt): boolean {
  const { receiptHash, ...body } = receipt;
  return hashReceiptBody(body as ClearTradeReceiptBody) === receiptHash;
}

/** Convenience: hash arbitrary inputs for a receipt's `inputsHash` field. */
export function hashInputs(inputs: unknown): string {
  return sha256Hex(canonicalize(inputs));
}
