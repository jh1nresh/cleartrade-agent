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
| `pnpm strategy` | writes the Track 2 strategy JSON + markdown packet to `artifacts/` |

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
- **BNB AI Agent SDK adapter** — `src/bnbagent/adapter.ts` (ERC-8004 / ERC-8183 dry-run receipt)

## Track 2 submission packet

Current target: **Track 2 — Strategy Skills**. The sponsor capability is
CoinMarketCap Agent Hub / market data, declared in the strategy schema and export
packet. Live CMC fetching is still gated until the sandbox tool list is confirmed;
the submission packet is a deterministic, paper-only strategy contract.

```bash
pnpm strategy
pnpm dry-run
```

Submission artifacts:

- `artifacts/cleartrade-track2-strategy.json` — machine-readable strategy packet
- `artifacts/cleartrade-track2-strategy.md` — judge-readable strategy report

The strategy packet includes sponsor capabilities, CMC signal inputs, backtest
window, replay rules, cost model, BNB AI Agent SDK dry-run plan, safety boundary,
and verification commands.

## BNB AI Agent SDK integration

ClearTrade declares the BNB AI Agent SDK sponsor capability through a dry-run
adapter that mirrors the official Python `bnbagent` SDK's ERC-8004 registration
file and ERC-8183 job / deliverable manifest shapes
([docs](https://docs.bnbchain.org/developer-kit/bnbagent-sdk/)). In Track 2 mode
it does not load a wallet, call the network, register an agent, fund escrow, or
submit a deliverable on-chain.

Current integration surface:

- `src/bnbagent/adapter.ts` builds the ERC-8004 registration file, ERC-8183 job
  description, and deliverable manifest.
- `pnpm dry-run` emits an execution receipt with `venue:
  BNBAgent SDK ERC-8183 dry-run`.
- `pnpm strategy` includes the same BNB Agent SDK plan in the JSON + markdown
  submission packet.

Live SDK usage remains gated behind explicit approval because the Python SDK
requires wallet credentials for ERC-8004 registration and ERC-8183 settlement.

## Safety boundary (do not cross without explicit approval)

- No live wallet signing in pass 1. `CMC_API_KEY` set → live fetch throws on purpose.
- No private keys in env. Live signing goes through Trust Wallet Agent Kit only.
- No customer/user funds, ever. Dedicated hackathon wallet only, Jun 22+.

## Build schedule

`Jun 16 scaffold (this)` → `Jun 17 CMC + Signal Scout` → `Jun 18 tournament + evaluator`
→ `Jun 19 dry-run execution adapter` → `Jun 20 dashboard + video` → `Jun 21 Track 2 final + go/no-go`.
