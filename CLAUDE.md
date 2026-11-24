# The Burrow: rules every session follows

Read `wip/team/RESUME.md` section 0 (top entry) and section 7 before doing anything else.

Then read `wip/team/MAKO_SAYS.md` in full (Mako, 2026-11-24: "anything I send you here, if it doesn't trickle down into every part of what we're doing, then there's no point"). It is everything Mako has said the app must be and do. The coordinator owns it and nobody else edits it. Read it again whenever the coordinator says it changed, and answer the coordinator with what the change means for your work. Every plan names the lines it serves. Every brief you write for a helper or a reviewer starts with "read wip/team/MAKO_SAYS.md first". If you hear Mako's words from anywhere else, send them to the coordinator.

Then read `wip/team/LESSONS.md` (Mako, 2026-11-23: "keep this as reference ... to help ensure that this never happens again"). Before any plan or build step, check it against the warning signs there, and run the qc-foundation agent on the plan before building.

## Never stop and wait (Mako, 2026-11-21, "make sure this doesn't happen again. ever")

- While there is work left in the RESUME work queue, a build or coordinator session never ends a turn to wait for Mako, for feedback, for a reply, or because a step is "done". Finishing one item means starting the next one in the same turn.
- Questions that only Mako can answer (how the app should feel, layout, wording choices) are written down in the queue file as "for Mako's run" and the work moves on to the next item. They are never a reason to stop.
- The only things a turn may wait on are running jobs this session started (a check, a QC agent). Even then, do other queue work in the meantime when it does not disturb the running job.
- At the start of every session that does long work, make sure a keep-going wake-up exists: an hourly scheduled task bound to that session telling it to carry on with the queue. Remove it when the work window Mako gave is over.
- Before handing off for size, start the replacement session and give it the queue. Never hand off into silence.
- When Mako asks how it is going, answer in a few lines and keep working in the same turn.

## Other standing rules

- One chat (Mako, 2026-11-24, DECISIONS new foundation 10): never ask Mako anything directly or wait for him in your own chat. Send every question, approval request and result to the coordinator session ("Burrow coordinator ... (talk to this one)") with send_message. For a push to main, prepare the exact commit and send its hash to the coordinator, who asks Mako and does the push after his yes.

- Mako is in Japan (JST, UTC+9). Give times in Japan time.
- Every update starts with two rough percentages (first version ready for him, everything checked; and including the art and the 3D world) and what is being worked on.
- Plain words, no em dashes. No real figures in the repo. Nothing deploys and nothing is pushed to `main` without Mako.
- Test first, one item per commit, then the check for the new app: `wip/team/app3/check3.sh` (quick level after each small change, full before each merge). It cleans up its own test browsers. Never `pkill` browsers: that kills every other lane's and reviewer's tests at once.
