# The Burrow's QC reviewers (rewritten 24 Nov 2026 for the new app, app3)

Mako, 24 Nov 2026, after his first run of version one: "the fact that we missed this whole AI first thing is pretty crazy to me ... it's crazy that you can't remove banks, add banks ... the QC agents are not doing a good enough job. So I think they all need updating."

## What was wrong
1. Every reviewer brief still described the old app. None could run on app3 as written.
2. On app3 only three reviewers ever ran (foundation, numbers, north star), with instructions typed on the spot and never saved, and no report kept. The first-run, data safety, layout and wording reviewers never ran on it.
3. Every reviewer walked a fixed list of jobs that worked. Nobody counted what a person could not do (lesson 3).
4. Reviewers were forbidden to read what the owner had asked for, so none could say "this is correct and not what he wants" (lesson 5).
5. A rule let findings be filed "for Mako's run" unless a figure was wrong, so "I could not do it" was parked.

## What changed
- `wip/team/qc/QC_COMMON.md`: one page every reviewer follows (the build, how to open it, the rules, the report). Paths live there and nowhere else.
- `wip/team/MAKO_SAYS.md`: every reviewer reads the owner's words and marks each line MET, NOT MET or NOT BUILT on every build.
- Two new gates: **qc-controls** (add, change, remove, undo for every kind of thing, counted in a grid) and **qc-assistant** (AI first).
- "I could not do it" is always a blocker. Only taste goes to Mako.
- Every report is saved in `wip/team/qc_reports/<round>/<role>.md`. The reviewer gets its agent file, the build path and the round folder, and nothing else. No extra instructions typed on the spot: if a brief is wrong, fix the brief.
- Three briefs are retired: money accuracy (the same job as qc-numbers), wording (qc-voice does it) and regression (`check3.sh` does it).

## The reviewers (each is `.claude/agents/<name>.md`; the brief is the whole instruction)
| Reviewer | Its question | When it runs |
| --- | --- | --- |
| qc-foundation | Can the engine and saved data hold real lives, and does the plan build what the owner asked for? | Every plan before building. Every slice that changes the engine, the saved data or the write door. Every release. |
| qc-north-star (gate) | Is this the app the owner described, and can a stranger use it? | Every release and every candidate for Mako's link. |
| qc-numbers (gate) | Is every figure right, worked out by hand? | Every release, and whenever a figure can change. |
| qc-controls (gate) | Can a person add, change, remove and undo everything, and get out of every box? | Every release, and every slice that adds or changes a screen. |
| qc-assistant (gate) | Is the assistant the main way in, and can it do everything with Undo? | Every release, and every slice that touches the assistant or setup. |
| qc-novice | A first run by someone who never learned about money, used the way Mako used it. | Every release, and every slice that changes what a person sees. |
| qc-data-safety | Can a person lose their numbers by any ordinary accident? | Every release, and whenever saving, cloud copy, backup or the assistant's changes are touched. |
| qc-layout-touch | Every screen at every size, reachable and readable. | Every release, and every slice that changes a screen. |
| qc-voice | Does any line sound like AI, does it sound like Mako, does the person know what to do next? | Any words before Mako sees them, the assistant's own lines included. |
| qc-art-director | The art rules. | Only when art changes. Art waits for Mako. |
| efficiency | Is the plan the fastest safe way? (Reviews the process, not the app.) | Every new plan. |

## How to run a round
1. Build the page and run the full check: `cd wip/team/app3 && ./check3.sh > ../qc_reports/<round>/check3.txt 2>&1`. Round names: `<date>_<what>`, for example `2026-11-25_candidate3`.
2. Make the screen pack: `node wip/team/qc/pack3.js wip/team/qc_reports/<round>/screens`.
3. Start every reviewer that applies at the same time, each a fresh agent, each given only: the build path and the round folder. Never reuse a reviewer that saw an earlier build.
4. Every FAIL is fixed. A finding seen in an earlier round is fixed at its cause, by building the missing shared piece (lesson 2), and the reviewer's grid or list gains the case.
5. Run again, fresh reviewers, only the ones that failed plus any whose area the fixes touched.
6. A release or a candidate for Mako's link needs PASS from all five gates and no NOT MET or NOT BUILT left unexplained. What is NOT BUILT on purpose (a later slice) is listed for Mako in plain words with the candidate, never hidden.
7. Commit the round folder.

## Scripts beat reviewers
Anything a reviewer finds twice becomes a script in `check3.sh`. The controls grid should become a table in the app with a test that walks it, so a missing door fails the check before any reviewer runs. Reviewers then spend their time on what scripts cannot see.

## How to update
- Mako's words go into MAKO_SAYS.md the same hour (the coordinator does this). Reviewers pick them up from there with no other change.
- A new kind of miss goes into the brief of the reviewer that should have caught it, as a general check, never as one case. If no reviewer owns it, add one.
- The coordinator owns the briefs. A build session that thinks a brief is wrong tells the coordinator.
- After any change to a brief, test it on a build with known faults: it must find them without being told.
