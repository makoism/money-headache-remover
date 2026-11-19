# North star (set by Mako, 2026-11-17). Read this before any change.

The one purpose of The Burrow:

**A person can see, at a glance, where all of their money is, where it is stocking up, what is flowing in and out, and what is safe to spend. They feel safe because nothing is unknown.**

Everything else serves that: ease of use, getting people to keep using it, the setup, the art, the assistant, the checks.

## Why this exists (Mako, 2026-11-19, in his words as closely as possible)
- **Mako builds it for himself first: the end-all money calculator he will use for the rest of his life**, to get his own finances in order. Spreadsheets and systems work, but he has to build them, keep them up and fix the maths when it is wrong. The Burrow does that for him. If it is perfect for him and he uses it every week, other people will likely love it too.
- **Money as a place, not a form.** Everything lives online now, and almost nothing feels like home. Money apps skip that and go straight to function. The Burrow joins the two: an actual place where your money lives, that feels alive, cute and warm (the art, and later the 3D world), on top of maths that is never wrong.
- **It teaches the mindset, not only the numbers.** Many people never learned how to think about money. A screen full of correct numbers does not help someone who does not know what the numbers mean or what to do with them: they get discouraged and stop. Mako grew up with saving; most of the people he builds this for did not. The Burrow bridges that gap.
- **The first impression: "Money management is this simple."** "I can upload all my stuff here and it does it all for me." Statements in, the picture out, very little to type or keep up.
- **It holds your hand every step of the way.**
  - One thing at a time, like Typeform: one question or one idea per screen, never a wall.
  - Every screen is obvious at a glance. If something is not obvious, it explains itself right there: first the mindset (why this matters, how to think about it), then the function (what to tap).
  - A question mark next to anything that needs it, with a short video of Mako explaining the mindset (recorded later; the written words first, so Help is never empty).
  - Copy written with care: plain, warm, like a person who has their money handled, never like a manual nobody reads and never "too AI".
  - The setup tour is a start, not enough. The hand-holding goes on inside the app, wherever a new person could get lost.

## How to judge any change against this
Ask, as a person who never learned about money: do I know what this screen means, why it matters to me, and what to do next, without asking anyone? Does it feel like a place I would want to come back to? Would it let Mako stop keeping a spreadsheet? If not, it is not done.

## How to use it
- Check every instruction and every feature against it before building. Ask: does this make the money picture clearer, truer or easier to keep up? If not, say so and push back.
- The picture must tie to reality: what the app shows adds up to what is really in the person's accounts, and it says how fresh that is.
- One bird's-eye view comes first. Numbers sit under a picture, never instead of one.
- Pixel art and styling never change this goal; they must not hide or crowd the picture.
- Reviewer roles in QC_ROLES.md check against this file, including the first-time user who knows nothing about money.

## Visual first (set by Mako, 2026-11-17, a hard rule)
If something can be shown visually instead of as numbers or words, and that makes it clearer, the visual is always preferred, even when it costs more to build. A kid should be able to understand the screen. Example: on pay day gold coins visibly split into each burrow with a small cute animation; a pile of coins shows how much is in a place; a full or empty burrow shows progress. Function first; polish and style come later, so a simple version is fine, but it must be visual.
- Numbers sit under a picture, never instead of one.
- When an idea or instruction could be shown visually, point that out to Mako and prioritise it.
- Reviewer roles check: could this be a picture? Is a number or sentence doing a job a picture should do?

## The final gate: an independent QC agent (Mako, 2026-11-17, every release from now on)
Before anything goes live, a separate agent does the last check. It is given only: this file (the north star and visual-first rule), the plain rules (wording like a manual, nobody loses data, ease of use, no clickable that does nothing), and the finished build to open and look at. It is not given the builder's reasoning, the plan or the test results, so it judges like a stranger. It reports PASS or a list of fails, each tied to a rule. A fail is fixed or brought to Mako, and the agent runs again before shipping. Nothing is deployed on a fail. The prompt is kept in QC_AGENT.md.

## The design that follows from it
See `claude/burrow-bird-eye-design.md` in the Mako's Finances project (the burrow cutaway, pay day, the week check-in, the ledger rules).

## A second gate: the number-logic agent (Mako, 2026-11-17)
Alongside the QC agent, a separate number-logic agent checks that every number is correct in every scenario (typos, wrong receipts, overspending, blanks). It runs at the same time as the QC agent on every release and step. See QC_NUMBERS.md.
