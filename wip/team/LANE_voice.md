# SIDE M, the voice lane: handoff

Written 2026-11-19 by the first SIDE M session at its 150k handoff. Branch `side/voice`, taken from `wip-38.31` at 47e6bf6. No app file is changed.

## What is done

| File | State |
|---|---|
| `wip/team/VOICE.md` | Done, with Mako's notes on the first samples in it (B13 to B16, his hyphen, Part E). Changes again whenever he reacts |
| `.claude/agents/qc-voice.md` | Done. Three counts per line (AI, Mako, knows what to do next), carries the wording editor's glossary checks, reads only VOICE.md, NORTH_STAR.md and the text |
| `wip/team/tests/qc/voice_lint.js` | Done and self-tested. Reads the source strings, prints findings, never fails the build. `--strict`, `--all`, `--text`, `--tsv`, `--since`, known file `voice_known.txt` |
| Samples for Mako | Sent twice to the coordinator. The second set has his notes in it. No reaction on the second set yet |

## What is not done (the next SIDE M session starts here)

1. **COPY_V1.md and `tests/qc/copy_apply.js`.** Not started. How to do it:
   - `git fetch origin wip-38.31 && git merge origin/wip-38.31` first, as late as possible, the main session is still adding screens (bank now, cards, owed line, the cloud copy flow E15).
   - `cd wip/team && bash tests/setup_env.sh`, then `node tests/qc/voice_lint.js --tsv > /tmp/strings.tsv` gives every string with file, line and kind (about 2,800). Keep that file's commit hash in COPY_V1.md so `--since` can list what was added later.
   - v1 screens only: Home with More (ui6.js, ui8.js, ui7.js), setup (ui45.js, ui45c.js, ui45s.js, ui45x.js, ui45u.js), Receipts and Plan (body.html, ui1.js, ui2.js, ui4.js), Settings (body.html, ui42.js, ui5.js), messages and errors (model.js, ui6.js toasts). Skip the art files (life.js, vs_*.js, realm.js), prompts sent to Claude (ui45v.js, ui46.js, ui4a.js mostly) and ui45t.js (his own video transcript).
   - The table is exact: file, old string (as it is in the source, so it can be found), new string. Verdict column: AI, Mako, next step. 20 worst at the top. Strings about saving, the cloud copy, the code, backup, restore come first and are judged hardest (VOICE.md B15).
   - Never rename a glossary word or a button word tests rely on ("Free to spend", "Bills left", "Saved", "Total", "Burrows", "Undo" and the rest). If one sounds wrong, list it apart for Mako.
   - A button or label rewrite is never longer than the original.
   - copy_apply.js applies the table, fails unless each old string is in its file exactly once, lists every test file that quotes an old string (grep `tests/` and `../../tests/`), and must take a small follow-up table on top of the first batch (Mako's copy rounds on the preview).
   - Then run the real qc-voice agent on the rewrites (fresh, only the new strings) before handing in.
2. **HELP_TEXTS_V2.md.** Not started. Source: `git show origin/side/help-texts:wip/team/HELP_TEXTS.md`, 28 entries. Same ideas, new words. Three are already rewritten in the second sample (Free to spend, Card spending, A missed week), take those as the pattern. Drop the same three-box shape where an entry doesn't need it (VOICE.md A10). `node tests/qc/voice_lint.js --text` on the old file gives 28 strong findings to start from.
3. **The lint's first run on the app** says 34 strong and 200 weak in about 2,800 strings. The strong ones are mostly semicolons, "no guilt" (10 places), "many people", "unlocks". These go into COPY_V1.md. Some strings from prompts still slip in (ui45v.js), tighten `looksLikeProse` or add them to voice_known.txt with the reason.
4. **More of his messages.** See below.

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
