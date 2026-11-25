# The AI join: what must be fixed before it goes to Mako (24 Nov 2026 night, MAIN 16)

Read wip/team/MAKO_SAYS.md first.

Serves M1, M2, M3, M6, M14, M17, M36, M37, M61, M67 (AI first: the assistant is the main way in, setup is a chat, it changes and shows with Undo, nobody loses data). Sources, read both in full: wip/team/qc_reports/2026-11-24_ai_merge/foundation.md and qc-assistant.md (both FAIL on lane/ai-merge b7ecd7f), and the join helper's seven "a person gets stuck" points (listed under I below). The plan this builds is foundation_review/AI_FIRST_PLAN.md.

Order. Test first, each test seen failing, one item per commit. Data safety first.

**A. Merge origin/lane/controls-base** (foundation, foundational 1 and 2). It brings the dated period start (a job change by chat no longer freezes the pay periods) and the saved Undo journal (Undo on an assistant card works after a reload). The reviewer's dry run: engine, store and app3/src join cleanly; check3.sh, sw3.js and DECISIONS_ROUND2.md conflict (keep both sides; rebuild). Then two page tests that cross the join: a job change by chat on 5 Jan and the period on 20 Mar; a bill changed by chat, a reload, Undo on the kept card.
**B. The cloud copy turned on right after a chat setup sends nothing and says nothing** (foundation 5; M61, M67, M19). Turning the cloud copy on ends the fill's hold, so the first copy is sent. Test: chat setup, cloud on, a second device joins with the code and has the book.
**C. "Fill in my Burrow" needs a whole answer** (foundation 3; M2, M7, M42). Not offered until the draft has: the country, the currency (its own answer; amounts typed before it changed are asked again: foundation 6, assistant blocker 6), the bank today, a pay or "no fixed pay", and everyday money and the minimum each answered or skipped in words.
**D. Start over and the fill's Undo** (foundation 4, assistant blocker 7). Start over is offered only while it can work; after that the card says in plain words how to change things instead. The fill card's Undo on a phone returns to one welcome with one chat box. One page test for each that crosses the real core, with no faked half.
**E. One failed call must not turn the assistant off** (assistant blocker 2). After "no connection", "Too many requests" or a daily limit, the next message is tried again; only a clear "off" answer from the server shows "the assistant is off".
**F. "Set up on the screens" never carries an old figure as today's** (foundation 7; M36, M37). A bank or card box is left empty when the chat's figure is not from today.
**G. One assistant.** The header "Ask" opens the panel; the old Ask sheet and its "Nothing changes until you tap Apply" rule are gone from the page (its tests move to the panel or are retired with a reason). One wording for "the assistant is off" in the panel and in Settings.
**H. What the assistant is told** (chat3_core.js SYSTEM, guide and context; M17, M3, M6, M30):
1. It never offers to read a file, statement, payslip or screenshot until that is built (assistant blocker 1).
2. The first screen already asks the first question (assistant job 1).
3. "I don't know" has a way on for every question: the bank figure can be left for later with the draft kept, and the close day says where to find it (job 3).
4. It is told which screen is open (job 4, 8; SORTED C7) and given a map of what the screens can do that it cannot yet, so a refusal says where (job 6; SORTED A12, A24, A25). A refused card is headed "Not changed".
5. A bank figure far from what the app expected is asked first, with the gap in words (assistant blocker 4; M6's third reason: never write an amount silently that looks like a slip).
6. A spend with no account named, when cards exist, asks "card or bank?" once and remembers the answer for the chat (M30).
7. Adding a bank asks both of its questions in one go.
**I. The join helper's stuck points.**
1. Two unnamed rows of one kind: the message sits next to the rows, at each section's Save, not only at See my money.
2. Pay every n weeks with the day blank: the day's questions are still asked (as setupfix did).
3. After "Set up on the screens" the person sees which sections still need Save, and why, in one line at the top.
4. Leaving the made-up numbers with no book lands on the assistant, not the forms. The bar is there in the made-up numbers and on "Set up on the screens" too (assistant M1 gaps).

**Not in this pass, named in scope for the candidate:** reading files in the chat (AI_FIRST_PLAN slice 3: M2 uploads, M4 receipts, M9); the 23 grid NOs the assistant cannot do yet (CONTROLS_PLAN slices; loans, goals, cards, accounts, statements, reminders, backup by asking); the nine questions setup never asks (a list for AI_FIRST_PLAN, one slice); a walk with the real AI (the coordinator arranges it on the live site).
