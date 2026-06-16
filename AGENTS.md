# AGENTS.md — ClearTrade Agent

Repo rails for any coding agent working here.

## Verify before claiming done

```bash
pnpm check   # tsc --noEmit
pnpm test    # vitest run
pnpm strategy
```

All must be green. `pnpm dry-run` should print sealed receipts with a risk verdict.
`pnpm strategy` should write the Track 2 JSON + markdown packet under `artifacts/`.

## Hard boundaries (non-negotiable)

- **No live wallet signing, no private keys in env, ever** in Track 2 / pass 1.
  Live mode (Track 1) is gated behind an explicit human go/no-go on Jun 22.
- **No customer/user funds.** Dedicated hackathon wallet only, when live.
- **No network calls in tests or dry-run.** The CMC fetcher is a deterministic
  offline stub until the competition sandbox tool list is confirmed.
- Do **not** add real CMC live-fetch logic without confirming the Open Questions
  in the spec first.
- Do **not** run live BNBAgent SDK registration, funding, settlement, or server
  processes without explicit human approval and sandbox credentials.

## Conventions

- Zod schema is the source of truth; TS types are inferred from it. Don't hand-write
  parallel types.
- The Risk Governor (`src/risk/governor.ts`) is a pure function — keep it pure and
  unit-tested. Check order is kill-switch › block › size-down. Never reorder.
- Receipts are sealed with `sealReceipt()`; `receiptHash` covers the body only.
  Hashing is canonical (sorted keys) so judges can re-derive it.
- No `Date.now()` / `Math.random()` inside the trade loop — inject a clock so
  dry-runs are reproducible.

## Spec

`~/brain/wiki/projects/agentshack/bnb-hack-cleartrade-agent.md` is canonical.
