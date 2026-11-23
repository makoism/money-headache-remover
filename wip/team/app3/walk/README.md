# Real-page walks (history)

The permanent gate is `app3/tests/e3_walk.js`. It is walk 4's run A (setup on 24 Nov 2026 to a check-in on 15 Feb 2027) with the hand-worked safe to spend and bank at every step, and `app3/check3.sh` runs it every time.

The folders here are the scripts of the four walks, kept as history so a finding can be traced back to the walk that found it. They are not gates and are not kept up to date with the app, so a step may no longer pass as written.

- `v1`: the first walk (walk1.js to walk6.js, then backup, origin, stmt, tabs). Its `lib.js` was never kept; `v2/lib.js` has the same helpers, so copy it in to run these.
- `v2`: the second walk (DECISIONS_ROUND2 BI), with the saved books it read from.
- `v3`: the third walk (BJ).
- `v4`: the fourth walk, the one `tests/e3_walk.js` was made from.

## How to run one

1. Build the page: `cd wip/team/app3 && ./build3.sh`.
2. Each `lib.js` opens `PAGE`, the page in the main checkout (`/home/user/money-headache-remover/wip/team/app3/index.html`). From a worktree, change `PAGE` in that `lib.js` to your own `index.html`.
3. The steps share one browser profile folder, given as the first argument, and run in order (s1, s2, and on). For example:

   ```
   cd wip/team/app3/walk/v4
   node s1_setup.js /tmp/walk4
   node s2_nov.js /tmp/walk4
   ```

   Some steps take more arguments; the top of each script reads them from `process.argv`. `dump.js <folder>` prints what the page holds.

They use Playwright from `/opt/node-tools/node_modules/playwright` and Chrome at `/usr/bin/google-chrome`. All amounts are made up.
