# SIDE M, the voice lane: handoff

Written 2026-11-19 by the first SIDE M session at its 150k handoff, updated the same day by the second (SIDE M2) at its own. Branch `side/voice`, taken from `wip-38.31` at 47e6bf6. No app file is changed.

## What is done

| File | State |
|---|---|
| `wip/team/VOICE.md` | Done, with Mako's notes on the first samples in it (B13 to B16, his hyphen, Part E). Changes again whenever he reacts |
| `.claude/agents/qc-voice.md` | Done. Three counts per line (AI, Mako, knows what to do next), carries the wording editor's glossary checks, reads only VOICE.md, NORTH_STAR.md and the text |
| `wip/team/tests/qc/voice_lint.js` | Done and self-tested. Reads the source strings, prints findings, never fails the build. `--strict`, `--all`, `--text`, `--tsv`, `--since`, known file `voice_known.txt` |
| Samples for Mako | Sent twice to the coordinator. The second set has his notes in it. No reaction on the second set yet |

## Second session (SIDE M2, 2026-11-19): what it added

| File | State |
|---|---|
| `wip/team/HELP_TEXTS_V2.md` | Done. 28 entries, glossary words that sound off listed at the end. Entry 20 (cloud copy, four steps) was shown to Mako, no reaction yet. It must be checked again against the real buttons when the cloud copy steps (E15) land |
| `wip/team/tests/qc/copy_apply.js` | Done, `--self` passes. Applies a table, fails and writes nothing unless each old string is there exactly once, keeps `${...}`, compares the code token for token, lists test files that quote an old string, takes follow-up tables in order |
| `wip/team/COPY_V1.md` | First batch: 275 rows for setup, Plan, Receipts, Help text in body.html, Home and More, messages in model.js, stmt.js, ui0.js. Proved on a scratch copy of origin/wip-38.31 at 77a8f0a: applied, built, the built script parses. Lint before 34 strong and 202 weak, after 16 strong and 187 weak. The 275 new lines on their own: 0 strong |
| `wip/team/tests/qc/voice_strings_20538e3.tsv` | The listing COPY_V1.md was made from. `node tests/qc/voice_lint.js --since tests/qc/voice_strings_20538e3.tsv` shows strings added after it |

Reports go to coordinator 3, session_01BFpKEWbWX57dzJueLvseiT.

## What is not done (the next SIDE M session starts here)

1. **A fresh qc-voice agent has not read the 275 new lines.** I read parts A to E line by line myself, part F (ui7.js, ui8.js, 47 rows) only through its maker's own reread. Run qc-voice on `grep "^+ " COPY_V1.md` (only the new lines, with VOICE.md and NORTH_STAR.md) and fix what it finds in COPY_V1.md itself, since the batch is not applied yet. Rerun `copy_apply.js --check` after any edit.
2. **Settings and everything about saving** (the cloud copy, recovery code, backup, restore, the snapshot before a load, data that could be lost): not started, waits for coordinator 3 to say E15 has landed. Files: body.html lines 267 to 390, ui5.js, ui42.js, ui43.js, and the LATE lists at the end of COPY_V1.md (about 36 strings in setup, Plan, Home). Judge these hardest (VOICE.md B15): every tap named by its button word, then what you see.
3. **Dialogs and smaller files not listed yet:** ui41.js, ui47.js, ui48.js, ui49.js, ui4b.js, ui44.js, ui3.js, world.js, and the lines a person sees in ui46.js and ui4a.js (most of those two is prompt text for Claude, leave that). The remaining strong lint findings sit in ui45v.js 6, ui46.js 3, ui48.js 2, ui42.js 1 and one each in model.js, ui0.js, ui2.js, ui45s.js. Check each: a row, or a line in voice_known.txt with the reason.
4. **Refetch before handing in.** The table was listed at 20538e3 and applied clean at 77a8f0a. The main session keeps changing screens, so run `--check` against the newest origin/wip-38.31 and `--since` for new strings each time.
5. **Hand edits the script cannot do** are listed in COPY_V1.md (two strings that are in a file twice, one semicolon made by code, two labels left alone).
6. **Mako's notes** come back as a few rows at a time: write them as a small follow-up table (same row format, old strings as COPY_V1 left them) and follow "How a note from Mako becomes a rule" below.

How the rows were made, if you do it again: the session forked itself once per group of files, each fork wrote rows into a scratch file and ran `copy_apply.js --check` on it, and one small script joined them. Old strings never include the quotes around them. A fork per 250 to 350 strings worked.

## For the main session

- Line for check.sh when the main session wants it in the fast script tier (it never fails as it is): `node tests/qc/voice_lint.js --quiet`. As a gate later: `node tests/qc/voice_lint.js --strict`, with accepted findings in `tests/qc/voice_known.txt`.
- qc-voice takes the place of qc-wording in the panel. I did not edit qc-wording.md or QC_ROLES.md. Text for QC_ROLES.md section 6:

  > ## 6. Voice checker (replaces the wording editor, Mako 2026-11-19)
  > - Every line gets three answers: does it sound like AI, does it sound like Mako, does the person know what it means and what to do next. The rules are in VOICE.md, the agent is qc-voice.
  > - Never em dashes, never exclamation marks, sentence case, his spaced hyphen is the only dash.
  > - One word per thing (glossary above). Buttons name the action. Errors say what to do. No retired words.
  > - It reads only VOICE.md, NORTH_STAR.md and the text. `node tests/qc/voice_lint.js` runs first and its output is pasted in as pointers.
  > Learned from Mako: "way too AI, this is just slop" about comfort lines and neat closers. Less full stops, join the sentences, like someone talking to you in normal conversation. For saving and the cloud copy: every step, what you do and what you then see.

## What the voice analysis rests on

- **37 of his own messages, about 5,000 words**, all from 2026-11-18 and 19: the old coordinator session (read in full, 42 messages, 9 of them pasted prompts written by Claude and left out) and the newest page of the new coordinator session. About 20 are long dictated ones, 17 are short typed ones.
- **The transcript of his welcome video** in the app (ui45t.js), about 1,100 words. The best sample of him explaining a money idea.
- His words as quoted in DECISIONS.md and NORTH_STAR.md, and his reaction to the first samples (through the coordinator).
- Not read: session_01BFpKEWVrwMZsRp6aFJ67Fm (nothing collected before the usage limit hit) and all but the newest page of the new coordinator session. session_01BFpKEZaBEJL18hdR9Evh7n gave one message and it was a pasted prompt. Nothing in git is his own writing: the "Mako (via Claude)" commits are Claude's words.
- The messages themselves are in no file in the repo. They were read in a scratch folder that is gone with the session.

The web research (why text reads as AI) was done through search summaries only. The session's network rules blocked opening Wikipedia, arxiv and the style guide sites, so no page was read in full. VOICE.md says so and marks what is counted, what editors agree on and what is folklore.

## What I'm unsure of

1. **His hyphen.** Not one " - " in the 37 messages. The rule in VOICE.md Part C is built from his one description of it. Where exactly he puts it, how often, and whether the next word is capitalised are guesses.
2. **How far "less full stops" goes.** I drop the last full stop on one line notes and join two thoughts. Whether a longer help text should end without one too, I don't know.
3. **Capitals.** He types lowercase. The app keeps sentence case so it doesn't look broken. He hasn't said.
4. **"Less abbreviation."** I read it as clipped copy with words left out, since he types btw and idk himself and said it together with "less separated sentences". The coordinator read it as no shortened forms and no symbols for words. VOICE.md B14 covers both.
5. **How casual.** "actually", "a bit", "just" are his, but nearly all the sample is him talking to an AI about building an app, not to a friend about money. The video is the only place he does that.
6. **Dictation.** His phone's dictation adds its own full stops and commas, so the punctuation in the long messages is the phone's, not his.

## What would settle it

- Ten or so messages he typed by hand to a friend (any topic), with the hyphen in them. That settles 1, 2 and 3 in one go.
- His reaction to the second sample set, line by line: which line sounds most like him and which least. "Which one is most you" gets a better answer than "do you like it".
- A voice note of him explaining one screen to a friend (Free to spend is enough).

## How a note from Mako becomes a rule

1. Take his note and the exact line it was about.
2. Find the rule in VOICE.md it belongs to. If there is one, add his line as a before and the fixed line as an after, with the date. If there is none, add a rule (next B or A number) with what he said in a few of his words, the before and the after.
3. If a script can see it, add it to voice_lint.js with a self-test case, so it is caught for free.
4. Fix the line in a small follow-up table for copy_apply.js, then run voice_lint with `--since` and a fresh qc-voice on the changed rows only.
5. Search the rest of the copy for the same miss (`voice_lint.js`, or grep) and fix those in the same table, so he doesn't have to say it twice.
