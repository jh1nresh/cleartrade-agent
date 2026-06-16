/**
 * CMC data fetcher — STUB for Jun 16. Track 2 only needs the shape locked so
 * Signal Scout and the strategy generator can be built against it. Real CMC /
 * Agent Hub wiring lands Jun 17 once the competition sandbox tool list is
 * confirmed (see Open Questions in the spec).
 *
 * In paper mode with no CMC_API_KEY, returns a deterministic fixture so tests
 * and dry-runs are reproducible and offline.
 */

export interface MarketSnapshot {
  symbol: string;
  priceUsd: number;
  volume24hUsd: number;
  marketCapUsd: number;
  pctChange24h: number;
  liquidityUsd: number;
  /** Unix seconds the snapshot was taken. Caller computes staleness. */
  asOf: number;
}

export interface SignalVector {
  source: "cmc-stub" | "cmc-live";
  snapshots: MarketSnapshot[];
  /** Unix seconds; lets the Risk Governor reject stale data. */
  fetchedAt: number;
}

export interface FetchOptions {
  universe: string[];
  apiKey?: string;
  /** Injectable clock for deterministic tests (Unix seconds). */
  now?: () => number;
}

const STUB_PRICES: Record<string, Omit<MarketSnapshot, "symbol" | "asOf">> = {
  BNB: {
    priceUsd: 600,
    volume24hUsd: 1_800_000_000,
    marketCapUsd: 90_000_000_000,
    pctChange24h: 2.4,
    liquidityUsd: 5_000_000,
  },
  CAKE: {
    priceUsd: 2.1,
    volume24hUsd: 120_000_000,
    marketCapUsd: 650_000_000,
    pctChange24h: -1.2,
    liquidityUsd: 800_000,
  },
};

/**
 * Returns a SignalVector. With an apiKey present this is where the live CMC call
 * goes (TODO Jun 17). Without one, returns the offline fixture.
 */
export async function fetchSignalVector(
  opts: FetchOptions,
): Promise<SignalVector> {
  const now = opts.now ? opts.now() : Math.floor(epochSeconds());

  if (opts.apiKey) {
    // TODO(Jun 17): real CMC / Agent Hub fetch. Intentionally not implemented in
    // pass 1 — no network calls until the sandbox tool list is confirmed.
    throw new Error(
      "live CMC fetch not implemented yet (pass 1 is paper-only); unset CMC_API_KEY to use the stub",
    );
  }

  const snapshots: MarketSnapshot[] = opts.universe.map((rawSymbol) => {
    const symbol = rawSymbol.toUpperCase();
    const base = STUB_PRICES[symbol];
    if (!base) {
      // Unknown symbol → flat, low-liquidity fixture so risk gates can reject it.
      return {
        symbol,
        priceUsd: 1,
        volume24hUsd: 0,
        marketCapUsd: 0,
        pctChange24h: 0,
        liquidityUsd: 0,
        asOf: now,
      };
    }
    return { symbol, ...base, asOf: now };
  });

  return { source: "cmc-stub", snapshots, fetchedAt: now };
}

// Wrapped so the rest of the module never calls Date.now() directly; tests
// always inject `now`.
function epochSeconds(): number {
  return Date.now() / 1000;
}
