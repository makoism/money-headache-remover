# Lane: ledger core (side N). Handoff, work in progress

Branch `side/ledger-core`. State on 2026-11-19 04:35 UTC:
- `wip/team/ledger.js` written. `MODEL=ledger.js node tests/next/ledger_fuzz.js` passes (run from wip/team).
- Still to do: adapter for ledger_conservation.js, tests/next/ledger_diff.js, ledger_edge.js, Philippine personas and gaps
  (side/ph-accounts), migrate3831 from cfg.bankNow / cfg.bankNowAt / S.cards, the full handoff text in this file.
