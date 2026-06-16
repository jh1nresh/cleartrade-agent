# ClearTrade Agent

> Auditable AI trading agent for BNB Hack. It trades only when CMC-backed signals
> pass a drawdown-aware Risk Governor, and it leaves a hash-verifiable **receipt**
> for every signal, risk decision, execution, and post-trade evaluation.

The differentiator is not "AI predicts price." It's that **every action has a
receipt trail** judges, users, and agent marketplaces can inspect:

```
Why did it trade? · Was the risk allowed? · What did it sign? · What happened after?
```

Full spec: `~/brain/wiki/projects/agentshack/bnb-hack-cleartrade-agent.md`.

## Status

Pass 1 (Track 2, paper-only) scaffold. **No wallet, no live trading, no secrets.**
Live Track 1 is gated behind an explicit Jun-22 go/no-go.

## Setup

```bash
pnpm install
cp .env.example .env.local   # CMC_API_KEY optional; stub works offline
```

## Commands

| Command | What it does |
|---|---|
| `pnpm check` | `tsc --noEmit` type check |
| `pnpm test` | schema + receipt-hash + risk-governor unit tests |
| `pnpm dry-run` | end-to-end paper loop → prints sealed receipts (nothing signed) |

## Architecture (pass 1 implemented in **bold**)

```
CMC market data
  -> Signal Scout            (src/cmc/fetcher.ts — stub)
  -> Strategy Tournament     (Jun 18)
  -> Risk Governor           **src/risk/governor.ts**
  -> Trade Intent
  -> Execution Adapter       (Jun 19 — Trust Wallet Agent Kit, dry-run first)
  -> Receipt Writer          **src/receipt/hash.ts**
  -> Post-Trade Evaluator    (Jun 18)
```

- **Strategy spec** — `src/schema/strategy.ts` (zod; validated, backtestable)
- **Receipt schema + hash** — `src/schema/receipt.ts`, `src/receipt/hash.ts`
- **Risk Governor** — `src/risk/governor.ts` (kill-switch › block › size-down)
- **Demo strategy** — `src/strategy/demo.ts` (`bnb-momentum-v0`)

## Safety boundary (do not cross without explicit approval)

- No live wallet signing in pass 1. `CMC_API_KEY` set → live fetch throws on purpose.
- No private keys in env. Live signing goes through Trust Wallet Agent Kit only.
- No customer/user funds, ever. Dedicated hackathon wallet only, Jun 22+.

## Build schedule

`Jun 16 scaffold (this)` → `Jun 17 CMC + Signal Scout` → `Jun 18 tournament + evaluator`
→ `Jun 19 dry-run execution adapter` → `Jun 20 dashboard + video` → `Jun 21 Track 2 final + go/no-go`.
