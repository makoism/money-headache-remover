# The Burrow: rules every session follows

Read `wip/team/RESUME.md` section 0 (top entry) and section 7 before doing anything else.

## Never stop and wait (Mako, 2026-11-21, "make sure this doesn't happen again. ever")

- While there is work left in the RESUME work queue, a build or coordinator session never ends a turn to wait for Mako, for feedback, for a reply, or because a step is "done". Finishing one item means starting the next one in the same turn.
- Questions that only Mako can answer (how the app should feel, layout, wording choices) are written down in the queue file as "for Mako's run" and the work moves on to the next item. They are never a reason to stop.
- The only things a turn may wait on are running jobs this session started (a check, a QC agent). Even then, do other queue work in the meantime when it does not disturb the running job.
- At the start of every session that does long work, make sure a keep-going wake-up exists: an hourly scheduled task bound to that session telling it to carry on with the queue. Remove it when the work window Mako gave is over.
- Before handing off for size, start the replacement session and give it the queue. Never hand off into silence.
- When Mako asks how it is going, answer in a few lines and keep working in the same turn.

## Other standing rules

- Mako is in Japan (JST, UTC+9). Give times in Japan time.
- Every update starts with two rough percentages (first version ready for him, everything checked; and including the art and the 3D world) and what is being worked on.
- Plain words, no em dashes. No real figures in the repo. Nothing deploys and nothing is pushed to `main` without Mako.
- Test first, one item per commit, `./check.sh` after each. Kill leftover test browsers first: `pkill -f chrome-linux64/chrome`.
