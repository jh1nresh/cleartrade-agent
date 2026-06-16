## What

<!-- one-line summary of the change -->

## Track / phase

- [ ] Track 2 (paper / strategy skill)
- [ ] Track 1 (live — requires go/no-go approval)

## Verification

- [ ] `pnpm check` passes (tsc)
- [ ] `pnpm test` passes
- [ ] `pnpm dry-run` prints sealed receipts (if loop touched)

## Safety checklist

- [ ] No private keys / secrets added to the repo or env example
- [ ] No live wallet signing path enabled without explicit approval
- [ ] No customer/user-fund handling introduced
- [ ] Risk Governor limits not loosened (or: loosening is logged + has a risk receipt)
- [ ] No network calls added to tests or dry-run

## Receipts / evidence

<!-- paste dry-run receipt output, test summary, or screenshots -->
