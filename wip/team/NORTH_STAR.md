# North star (set by Mako, 2026-11-17). Read this before any change.

The one purpose of The Burrow:

**A person can see, at a glance, where all of their money is, where it is stocking up, what is flowing in and out, and what is safe to spend. They feel safe because nothing is unknown.**

Everything else serves that: ease of use, getting people to keep using it, the setup, the art, the assistant, the checks.

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
