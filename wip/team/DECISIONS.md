# The Burrow: Mako's decisions and standing rules

Collected 2026-11-18 from the decisions saved for the Burrow project, so that no single chat holds them. These are Mako's own decisions, in his words as closely as they were recorded. Where two entries disagree, the later date wins. Read this with `NORTH_STAR.md`, `ARCHITECTURE.md` and `RESUME.md`.

## What it is and who it is for

- The Burrow is a one-page budget app. It was first called M.H.R.2000 (The Money Headache Remover 2000). The name is "The Burrow" everywhere now.
- Mako builds it for himself first, then for his team, friends and family. About 10 people at most will use it, all for free. Claude builds it; Mako does not code.
- Success is not selling it or earning from it. It only succeeds if his team and friends actually keep using it. Every feature should make people invested in and aware of their money, and give them a place they want to come back to. He wants pushback on anything that does not serve that.
- It should feel like something he made for himself and for people who want it: personal in formatting (not in wording), never a corporate onboarding with unneeded info.

## North star (2026-11-17, "hard bake this in")

The one purpose is a bird's-eye view and clarity of money, so the person feels safe because they know exactly where all their money is, where it is stocking up, what is flowing in and out, and what they can spend. Ease of use and getting people to actually use it are implied. Every instruction and every feature is checked against this. Pixel art and look do not change it.

## Priorities, in order

1. Accuracy and stability like a spreadsheet. Nobody loses data.
2. Minimal UI, a bird's-eye view, wording like a manual or like him.
3. ~~A clean, rounded, Apple-like look. The square look was rejected.~~ Superseded 2026-11-18: the look is green glass over a nature scene, with a deep, lush feel. Rounded, never square.
4. ~~Quiet whooshes on page moves and a tiny click on buttons.~~ Superseded 2026-11-18: sounds are nature themed (wind, water drops), quiet.
5. Code that is efficient, snappy, lowest energy, and quick to adjust later.

Lens for every feature (2026-11-12): what is the priority from the user's side, and does this serve it? Anything off that line is unneeded and can be removed.

## The numbers

- All numbers are based on one dataset as stable as a Google Sheet. Everything derives from it, so a wrong number is not really possible (2026-11-18).
- Work everything out from the actual data: the transaction dates in the statements, never file names or what the person says about the files, unless they give other instructions. Keep to the spreadsheet way, everything as data sets (2026-11-12).
- Real numbers should come from uploaded bank or card statements, or from a prompt pasted into any AI. Setup asks only what statements cannot answer.
- Planned money that goes unspent at month end must not silently drop out. The app asks the person to choose where it goes, because being aware of where your money is matters most (2026-11-18). Current pile sizes are fine: goal piles show progress toward the goal, other piles show the amount.

## Visual first (2026-11-17, "hard bake this in as a rule")

If something can be shown visually instead of as numbers or text, and that makes it clearer, prefer the visual even if it costs more to build. Example: gold coins visibly splitting into each burrow on pay day, with small cute animations. "Even a kid can figure it out." Function first, polished art later, so simple is fine. When Mako gives an idea that could be shown visually, point that out and prioritise it.

## How the app is laid out

- Burrows (2026-11-16): one burrow per savings bucket or goal. Spending jars are not burrows. Home is one picture with a small burrow icon per bucket showing how full it is, plus a short note. Tapping one opens that burrow's own full-screen world: art only, with a default pop-up of stats and an add-receipt button. The coins in the door must match the real percentage.
- Each burrow gets a completely different world. Mako wants to design each one together with Claude, who asks him at the start of each. (Superseded 2026-11-19: one small 3D world for everything, see WORLD_3D.md; designs with Mako first, in the art step.) The first is Rainy Day: rain outside, safe, cozy, dark evening, lit, magic, creatures and life everywhere, all animated.
- Treasure chest (approved 2026-11-16): a second section under the burrows for the more fluid money. An easy overview of everything other than the burrows: necessities paid and allocated this month, play money for the month, plus education, financial freedom and give if people fund them.
- Education and Give should also be burrows, because they stock up (2026-11-17).
- He logs weekly. Play money is not tracked in detail; it stays a small number.
- Pay day (2026-11-17): enter the paycheck and see gold coins flow into each burrow, the treasure chest or a small money bag. A monthly screen to log receipts with coins going into each burrow. Weekly logging of play money and other spending. An overview, because he sees many numbers but no bird's-eye view.
- In burrow mode, "add money" is done entirely on that screen in a small inline panel. Then gold builds up in the burrow with sound and the animals dance.
- The squirrel-puts-a-gold-coin-in-the-burrow animation plays only at significant moments (a batch of expenses logged, first log, streak activation, big steps toward saving) and every time money is added on a burrow screen. Never spammy.
- The streak is no longer in the top left of the header. It appears only when he does something, such as logging, or at the bottom of Home.
- The onboarding starts with his video, as the first page on its own, with the questions after it. He plans to reshoot it with a new script that walks through the process.
- He wants an in-app money assistant that knows the whole financial picture, answers questions, changes what the app shows, and carries out decisions once agreed.

## Look and art

- Branding: the header reads "the burrow" with "for money freedom" under it, all lowercase. The favicon is the grassy burrow hill with a magical sparkle.
- Background: the version with the animated fairies and the waterfall in 3 layers (v36.3). The whole app in darker green for a deep, lush nature feel. Rejected: the mushroom-menu forest "world", the cobblestone banner, rocks and water, the newer forest graphics, and the original v36.0 background (too old).
- Lighting should vary instead of being all dark: brighter daytime with a sunbeam on the cottage; evening using the lamps, fireflies and a glowing waterfall. Waterfall streams curve and drift a few pixels.
- Time of day follows the season, matching real daylight times.
- Pixel-art nature theme on every box and menu: vines, flowers, small animals, hearts. Each box has something unique but one coherent theme, fitted into the empty spaces around the text. Immersive and interactive like a real space, not web-design icons.
- One rule set and one quality level for every graphic, written up as a brand guide. A unique, hand-made, not-AI-looking feel with personal flair. A "20-year pixel-art director" review pass before any variations are sent.
- Number one design rule: anything added must flow with whatever it is added to, not be stuck on and stopped. Card vines are subtle accents from a corner, not on every card, a different kind per card, with breathing room from the text. The purple Goals flowers stay.
- Strong art rule: never superimpose anything on the art. Labels and navigation, such as the "back to the burrow" signpost and road, are painted into the world's own graphic. Animals belong in the background and trees, with at most two or three in front.
- The squirrel is Elthen's free itch.io pixel-art sprite sheet (Mako supplied it), plus a gold-coin-carrying variation. Claude-drawn squirrels were rejected.
- All music is baked into the app. Anything that cannot play inside it is removed. The built-in Forest piece and Off remain.

## Hosting

- Repo: `makoism/money-headache-remover` on GitHub.
- Live address: https://the-burrow.mako-162.workers.dev (Cloudflare Worker `the-burrow`, created by Mako from the same repo). The old address, https://money-headache-remover.mako-162.workers.dev, stays up until people have moved their data across.
- Database: Cloudflare D1 `money-vault`.
- The Anthropic key lives only in the Cloudflare secret `ANTHROPIC_API_KEY`. Never in chat, never in the repo.
- The app's AI ran on the monthly API credits included with Mako's Max plan. After the move to the org plan those credits may need claiming again by a Team owner. Check the assistant on the live site.
- Mako is fine with his own AI credits paying for the app's AI if that gives the best experience, and also fine with offering people their own AI.
- The artifact link https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w stays as a mirror while it works (see decision 10 below).

## How Mako wants the work done

- Do not ask many small questions. Just go ahead. Keep building when he does not respond. Send each tested version. Make sure small things like formatting are not missed.
- For every big task, set a resume timer first, so the work wakes itself up if a limit is hit. Tell him in one line that it is set. If a usage limit stops the work, resume as soon as it resets, without waiting for him.
- When a piece of work is finished, send the link to the live page again.
- Check every instruction on The Burrow against the north star first.
- Before any build is sent: a panel of separate reviewer roles, each with its own criteria, including a fresh-eyes pass as someone who knows nothing about budgeting or finance, plus the full UI and onboarding. Every time he gives feedback, update the matching reviewer's criteria so it is never missed again.
- Two final gates on every release, each a fresh agent given only its brief and the finished build, never the builder's reasoning. One checks the north star and his core rules. One checks that every number is correct in every situation. Both must pass before shipping.
- Plain words. No em dashes anywhere.

## Not in the repo yet

Three documents were kept in the Claude project and should be copied into the repo: the bird's-eye design (the detailed plan for the next steps), the resume notes, and the QC roles.

## Decisions of 2026-11-18 (Mako's answers to PLAN.md)

1. **Cents.** Plan boxes keep cents for currencies that have them; yen stays whole. This reverses the older whole-unit rule on purpose: a migration test proves old whole-unit plans load unchanged, and the release notes say so.
2. **Bank below zero.** Home shows a plain amber line naming the month, the amount and the cause the model knows. Never red, no shame, never "cushion", and never say bills are unpaid unless the model says so.
3. **Month-end question with fewer than four receipts.** Ask anyway, with: "Only N receipts are logged, so this may be spending you have not logged yet." Keep "Decide later".
4. **Chest** is only where new pay waits on pay day. "This month" is separate and includes Free to spend.
5. **First pay or bills entry** becomes the usual amount for every month, unless the person changes a month. Older tests that assume month-only are judged one by one and updated naming this decision.
6. **S4 (first screen mostly numbers).** If a simple visual fix is small, build it before release. If it is big, Mako decides in two lines whether it ships as an exception. No other gate failure is an exception.
7. **Proof line.** No coin is counted twice: Total = Chest + This month + Burrows, and Free to spend is inside This month. One rule for Wallet mode (Free to spend not tracked) and one for Track mode, written as a test before the code.
8. **First open order:** the video, then statements or the AI prompt, then only the questions statements cannot answer, then place the money already there.
9. **Real figures.** From now on, rebuilt test helpers and plan documents use made-up numbers of the same shape. No new real figures go into the repo.
10. **The Claude artifact mirror** stays while it works (checked 2026-11-18: it loads and serves 38.28). Retire it once it stops working.

## Process change (Mako, 2026-11-18)

1. **v1** means 38.31 shipped. After that Mako uses it himself with his real numbers while step B is built, and step B is adjusted from what he finds. (Sharpened below: what v1 must show.)
2. **Checks by cost.** Cheap checks (`tests/verify.sh`) after every commit. The two gate agents run on a release candidate only. The seven-role panel runs when screens or wording changed in a release, and once before v1. Agents get screenshots and extracted screen text where possible, not the whole page.
3. **Steps 1 and 2 are time-boxed.** Keep the tests that protect numbers, data safety and Mako's real-numbers scenario. Retire the others with a written reason in the commit. Never retire a test to hide a failure.
4. **Step B is split.** B1: the ledger and "check your bank", shipped on its own first. B2: the Chest and the pay day ritual.
5. **No new art, music or video work** until v1 is in use.
6. **A fresh session for each step**, with a short handoff in RESUME.md, using the model that fits the job.

## Version one (Mako, 2026-11-18, standing decision)

- **Version one is: the picture, the four numbers and one next action. Everything else is hidden until it is needed.** Mako tests it himself with his own numbers.
- No new art, music or video work until version one is working (this replaces "until v1 is in use" above; same intent, the trigger is v1 working).

## Cost and speed rules (Mako, 2026-11-19)

1. **QC rounds have a stopping rule.** If the same finding fails two rounds, it goes to Mako in two lines instead of a third fix round. Only BLOCKERs stop a release; the panel's CONFUSING and POLISH items go on a list for after v1. (Gate failures are still never an exception, except S4 as decided above.)
2. **Each agent runs on the model that fits its job.** The two gates, money accuracy and data safety use the strongest model; novice, wording, layout, art and regression use a faster one (set in `.claude/agents/*.md`, `model:`). Fix rounds re-run only the agents whose reports failed.
3. **A finding that comes back becomes a script.** Anything a script can check (an amount written two ways, cents, tap targets under 44px, contrast) goes into `tests/verify.sh` or `check.sh`, so it is caught free on every commit and agents only look for what scripts cannot see.
4. **A session hands off when it gets large**, at about 150,000 tokens of history, not only at the end of a step. A short handoff in RESUME.md section 0 every time.
5. **Parallel sessions, safely (Mako, 2026-11-19).** Split the work into as many sessions as helps, as long as nothing overlaps: only one session at a time changes app files on the release branch; side sessions work on their own branches and touch only files no one else is changing (new tests, the oracle, docs); the main line merges them. Burning credits faster is fine; safety and data integrity come first.
6. **The efficiency agent** (`.claude/agents/efficiency.md`) reviews every new implementation plan and the current process, and its findings go to Mako.

## Answers on the eight open points (Mako, 2026-11-19)

1. **Freshness, in v1:** under the bank figure, say when the balance was entered, for example "Balance you entered on 18 Nov".
2. **Chest: change the word, keep one meaning per word everywhere.** The treasure chest picture is Free to spend (as Mako asked on 2026-11-17), so "Chest" is no longer the name for new pay waiting on pay day; that place gets its own word when it is built in step B2. Until then no screen uses "Chest" for anything but the Free to spend picture. (Supersedes decision 4's naming; the idea of a waiting place stays.)
3. **Giving piles up.** You save for gifts or charity and spend from the stock, so Giving is a burrow like Education and Investing. **Words (Claude's call, from Mako's "keep it consistent"):** a burrow is any place money piles up (goals, Education, Giving, Investing); "goal" means the amount a burrow is aiming for. Home, Plan and setup use the same words.
4. **Art comes last.** One art pass at the end, once the underlying structure (steps B and C) is complete. The sprinkles come last.
5. **Version one Home (Claude's call):** the picture, the four numbers and one next action, as decided. The pay split stays behind "Show" (it is this month's flow, not where the money is); the long "They add up" paragraph becomes the one proof line; the four numbers stay as the version one definition asks.
6. **Percents: keep as they are.** Places round to whole percents that add to 100; a goal's fill rounds down, so it never says full before it is.
7. **Setup step count (Claude's call):** no "of N" that can change mid-setup. Show the step's name and the progress dots only.
8. **The phone:** the squirrel did not show when money was added, and the burrow felt laggy (maybe the rain). The phone and the desktop must run the same build and work the same. Investigated before v1.

## The art step and the 3D world (Mako, 2026-11-19)

1. **All steam ahead on the base functionality and the base UI.** Nothing changes today. When the bare bones work, Mako uses the app for his own money and tests whether it is usable.
2. **Art comes last, and Mako is part of it closely.** No session starts any art work (pictures, the 3D world, the creature, lighting, sound design) without asking Mako first. When the base is ready, tell Mako that the art step can start.
3. **The 3D world is part of the art step:** one small stylized walkable world where every app action can be done. See WORLD_3D.md.
4. **One source of context.** Mako talks to one coordinating session; it records his decisions here and passes them to every working session. A working session never takes a direction from anywhere else.

## After the concept review (Mako, 2026-11-19)

1. **Launch checklist.** Every point the reviews found is in LAUNCH_CHECKLIST.md with the step that fixes it. v1 is for Mako alone (at least a week); the team test needs every "team" point and the 95% sweep; wider launch needs every point done or moved later by Mako in writing. Aim: covers about 95% of people and their situations before anyone else uses it.
2. **Several banks and accounts are core,** including pay-later apps. The major ones in the Philippines, Japan and France come first; other countries later.
3. **One simple door for many situations:** "Money came in" and "Money went out", each with a short list of kinds and a line on what each is for (pay, borrowed, paid back, family support...). Keep it simple.
4. **"What is in your bank right now" ships in v1,** as the reviews recommend.
5. **Mako is the final check.** Where the answer is a preference with no objective best, the team picks a default and adds a note for Mako with the first version that has the function; he decides by using it. Do not send him questions without the app in front of him.
6. **The 3D world** is decided when the art step comes. It stays on the list.

## Why this exists (Mako, 2026-11-19)
Recorded in full in NORTH_STAR.md, "Why this exists", so every agent and session reads it: built for Mako first as the money calculator he uses for life; money as a place that feels like home, not a form; it teaches the mindset as well as the numbers, for people who never learned to save; first impression "money management is this simple, I upload my stuff and it does it for me"; it holds your hand every step, one thing at a time (Typeform), every screen obvious or explaining itself on the spot (mindset first, then function), question marks with short videos by Mako (written words first).

## How Mako works with the team (Mako, 2026-11-19)

1. **Mako is visual and checks everything on his phone.** Every update to Mako comes with screenshots he can see in the chat, and with the link to click and try the app right there. Never a link-less or picture-less report.
2. **Previews before deploy:** a session that wants Mako to see a build publishes it as a private preview (the Artifact tool) and sends the link to the coordinating session with screenshots; the coordinating session passes both to Mako. After a deploy: the live link, https://the-burrow.mako-162.workers.dev, plus screenshots.
3. **Art: designs first, then build.** In the art step, the first thing Mako gets is designs (mockups or screenshots of options) on his phone. He and the team work on the designs together, and only then is anything implemented. No more building art first and correcting it after.
4. **Feedback comes from real use, not abstract questions.** Mako tests by using the app with his own money in real situations. Do not send him lists of questions without the app; send the app, with short notes of what to look at, and he brings things up from use.
5. **Several banks:** confirmed (LAUNCH_CHECKLIST.md A2).
6. **Cost rules 7 and 8 (Mako agreed to the efficiency review's proposals):** while art is frozen, the art director agent runs only when art files change; the regression runner agent is replaced by the pasted output of `./check.sh full` (everything on its list is already a script). That is 2 of 9 agents saved on every QC run.

## v1 must be fully usable (Mako, 2026-11-19)
Art is paused. v1 is for Mako to use for his real money, so everything must work and be clear through the UI alone. The art may not be pretty, but it must never get in the way: nothing covers a control or a number, nothing makes the page lag, nothing distracts from reading the money. Where existing art disrupts use, tone it down or hide it in v1 (that is a fix, not new art). The art work itself waits for the art step.

## Mako's own money, the shape v1 must fit (Mako, 2026-11-19; no amounts, the repo is public)
- One main bank account. Two credit cards, paid off in full on the 10th and the 11th. Pay: two incomes that land on the same day, the 10th, entered as one number. Android phone.
- "I would stop using it if it didn't give me clarity."
- What follows for v1: almost all spending goes on the cards and leaves the bank only on the 10th and 11th, right when pay lands. So the bank balance alone is not the truth mid-month: card spending is already spent but still in the bank. v1 must show it plainly: what is on each card now (typed, like the bank figure), when it is paid, and what the bank will hold after the cards are paid. The month should follow his pay day (the 10th), not the calendar, where that changes what is safe to spend.
- Testing: Android (Chrome, installed to the home screen) is the phone tested hardest. Test profiles use this shape with made-up numbers.

## Team test about the team; lighter QC (Mako agreed, 2026-11-19)
1. **The team test is built for the people in it.** Mako asks his two teammates the same shape questions he answered (where their money sits, how they are paid, cards and pay-later, phone; no amounts), and the team gate is set by what their shapes need. Moved to the wider-launch gate: the Japan and France account presets, password-protected statements (D5), the full one-question-per-screen flows (H3), and the full 95% sweep. Every "nobody loses data" point (section E) stays at the team gate.
2. **QC on the v1 candidate:** both gates in full; the panel reviews only the screens changed since round 4 plus a beginner walk of Home and setup. After v1, Mako's real use is the panel; a fix needs `check.sh full` plus the two gates.
3. **The ledger is designed on paper first** (side/ledger-design, LEDGER_DESIGN.md), proved with made-up event lists, before any ledger code. The rolling window folds into B1, except the fix that stops months being dropped on load (E6), which ships first because it loses data.
4. **The coordinator hands off too** at about 150k tokens: COORDINATOR.md holds the handoff, and Mako gets a new chat link.

## Pace: use the full allowance (Mako, 2026-11-19)
Mako has one usage reset token that expires at the end of November. Plan: use the whole weekly allowance by Sunday 22 Nov (or finish first), then again by Wednesday 25 or Thursday 26 Nov, when he uses the reset. So: run as many useful lanes in parallel as the safety rules allow (one session on app files of the release branch; side lanes on their own branches and named files), and never idle while useful work exists. Never spend for the sake of spending: no repeated QC rounds, no busywork. Every session keeps a resume timer so work restarts by itself after a limit. Sessions cannot see the weekly meter exactly; Mako can check it under Settings, Usage.

## The team's shape, answered by Mako (2026-11-19)
Mako answered the five shape questions himself. Do not wait for the teammates and do not ask again. The team gate is built for this:
1. **Where money sits:** what is standard in the Philippines: the usual banks, e-wallets such as GCash and Maya, cash, pay-later apps. Looked up by web search, then used for the account presets and the team gate.
2. **Pay:** monthly pay is the default. Separate pay is also supported (two incomes, or pay in two parts).
3. **Cards:** assume everyone has a card. Cards are core, not a special case.
4. **Phones:** it must work on both iPhone and Android.
5. **What would make them stop:** not answered for the team; use Mako's own: "if it didn't give me clarity".
(This replaces "Mako asks his two teammates" in "Team test about the team" point 1; the rest of that point stays.)

## The copy must not sound like AI, and must sound like Mako (Mako, 2026-11-19)
Mako read a sample of the written help texts and said: "this copy example you sent is way too AI, and that really deters me from using the app. It's like, damn, this is just slop."
1. **Two things, both required:** the copy does not sound like AI, and it sounds like Mako: talks like him, skips things like him, uses less punctuation (he does not use much).
2. **A new agent, the voice checker,** checks all of the copy in the app and every text written for it. It is built from (a) research online on what people have found makes writing sound like AI and how to avoid it, and (b) a proper analysis of how Mako talks, from his own messages. Mako can paste more of his chats and voice messages if needed; start with what exists.
3. **This is a reason he would stop using the app,** so it counts for v1: the screens he sees in v1 are checked and fixed first.
4. The older priority "wording like a manual or like him" now reads: like him. Plain is still right; manual-like is not.
(Voice guide: wip/team/VOICE.md. Agent: .claude/agents/qc-voice.md. No personal details or real figures from his messages go into the repo; the guide describes the style.)

## The ledger design: defaults taken, as notes for Mako (team, 2026-11-19)
LEDGER_DESIGN.md (branch side/ledger-design) is the design for step B1, proved on made-up event lists. These are the team's defaults, not Mako's decisions; he changes any of them by using the app (rule: Mako is the final check).
- Two lists, one rule: accounts are where money sits, places are what it is for; every coin is in exactly one place, so accounts = places = Total. What is owed sits in owed accounts, never in a place. Nothing is stored as a balance; everything adds up from dated events; the ledger is never trimmed.
- Cards are core: card spending moves the amount into a "for that card" line inside Bills left. Total stays, Free to spend drops. A card with an older balance shows two lines (this month's, and the older balance held like a loan).
- Pay-later buys touch no place; the instalments are bills. Borrowed money is owed. Money lent is still yours ("owed to you"), inside Total.
- Money in another currency sits beside Total until converted.
- A month runs from one pay day to the next. A second income on the same day does not start a new month.
- A place can go below zero, shown in amber, never refused.
- Moving a 38.31 copy: only typed figures move; the old plan is shown once beside them; a frozen copy is kept. A3 debt goals become loan accounts.
- Words until Mako picks: "Waiting" (new pay not yet placed), "for the card", "owed to you".

## Copy at the end, the cloud copy explained, yen default (Mako, 2026-11-19)
1. **All the copy is done at once, at the end** of the v1 points, in one batch. Mako agreed; he wanted the voice problem addressed first.
2. **Saving your data must be very clear.** Mako on the cloud copy today: "it's like copy this to the cloud to save your data. I don't know how that even works. Do I paste it in a new browser? There's not enough steps there." So the cloud copy explains itself step by step: what it is, what the code is for, exactly what to do on this device, and exactly what to do on another phone or browser to get the numbers back. The same for every other way of keeping data (backup file, restore, the snapshot before a load) and for every message about data that could be lost. One step at a time, plain, in his voice.
3. **The default currency is Japanese yen.** (It already is; it stays. The team link opening in pesos, checklist D1, is a link setting on top of that.)
4. Mako likes the updates in this form (short, what was found, what was done). If context is needed at any point, ask him.

## One copy pass with Mako, near the end (Mako, 2026-11-19)
1. For the smaller details (onboarding, copy, the help in the UI) **the north star check and the voice checker can be combined** into one review, and it can run near the end. That is fine.
2. **All the copy details are done in one pass with Mako.** He keeps his eye on it, and the team tweaks with him until the wording and all of the UI help are correct. Not screen by screen across many rounds.
How the team does it (coordinator's reading): the voice lane's rewrite is applied in one batch as the best first version; Mako gets the preview and reads the app itself; his notes are applied in quick rounds on the copy only (strings, hints, help; no logic), each round checked by the script and the combined copy check, until he says it is right. The two full gates still judge numbers and the north star on the candidate.

## How Mako writes, from his reaction to the first voice samples (Mako, 2026-11-19)
- He does not use many full stops. Where others put one he often writes a space, a hyphen and a space. "I know that's not grammatically correct, but that's how I do things." The team works out from his messages how he uses it, then uses it in the copy. (A plain hyphen with spaces. Em dashes stay out.)
- Fewer full stops, fewer short separate sentences, less abbreviation. Join a few sentences where it makes sense.
- "I want it to sound more like someone talking to you in normal conversation."


## The 3D world is desktop only (Mako, 2026-11-19)
Mako: "I don't see how it would work on mobile, nicely... I don't really want to add a joystick and stuff. It's just going to be a bad user experience exploring a 3D world on mobile. Also the processing speed would be different, so I think we just do it on the desktop version."
1. **The phone app stays as it is.** No 3D world, no joystick, no walking controls on phones.
2. **On desktop you can enter the world.** It is an extra way in, never the only way: every action still works in the normal app on every device.
3. The rest is unchanged: the world is part of the art step, designs with Mako first, nothing starts before he says so.
What follows (coordinator's reading, agreed with him in chat as the team's view): the world's "phones and QC" week in WORLD_3D.md shrinks to desktop checks; the phone needs its own warmth from the 2D art in the art step, since the phone is where he and the team use the app most; "desktop" is decided by a pointer and keyboard and a wide screen, not by the browser's name.

## The coordinator picks the model for each session (Mako, 2026-11-19)
Mako: "I'll just let you figure out what models to use in the other chats to run the most efficient way we can." He keeps his own chat with the coordinator on the strongest model at medium.
How the coordinator uses it (its own rule, built on cost rule 2):
- Strongest model: the main session (app code, numbers, data safety), the ledger and its tests, the two QC gates, money accuracy and data safety reviews, and the voice and copy work (the copy is a reason he would stop using the app).
- Faster, cheaper model: docs-only lanes, research, runbooks, persona walk scripts, novice, layout and regression reviews.
- How many sessions run at once matters more than the model: about five or six at most, fewer when nothing useful is unblocked; if Mako says the usage meter is running hot, cut to the main session plus one lane.

## Work goes on overnight, use the credits by Sunday, next best model when the strongest runs out (Mako, 2026-11-19, about 15:00 UTC)
Typed in MAIN 8's chat and relayed to the coordinator (not seen by the coordinator first hand): "when fable runs out make sure to use the next best model and switch. it's at 96% capacity" and "I'll check in the morning so make sure you are continuing work nonstop and just continue with the app until you hit the limits. I want to spend all of the credits by Sunday".
How the coordinator uses it:
- He does not look at the preview tonight. Work does not wait for him: the overnight queue is the QC findings that do not need his taste (checklist Q2, Q3, Q7, Q9, Q10), then one full check, a fix-round re-run of the gates, and the preview republished to the same link.
- Still his to judge, nothing built: Q1 (the "They add up" line), Q4 (the picture above the fold), every copy row, the pay day field, art and the 3D world.
- The earlier pacing rule (main session plus at most one lane, no extra QC rounds) is lifted as far as budget goes until the weekly reset on Sunday. One session at a time on app files stays.
- Models: the strongest while it lasts; when it runs out, new sessions and helpers start on the next best one.
- Unchanged: nothing deploys, nothing goes to main until he has seen the preview and the bank comparison and said go.

## Use all the credits and chats before the limit; watchdog on (Mako, 2026-11-20, about 02:40 UTC)
Said in MAIN 10's chat and relayed to coordinator 7 (not seen first hand):
- Use all the credits and chats before the weekly limit. MAIN 10 keeps going past its size handoff point instead of stopping, and runs helpers in parallel where safe. One session at a time on app files stays.
- The watchdog is approved: an hourly fresh session on Opus that pushes to his phone and starts a replacement main session if the current one dies on a limit. MAIN 10 fixed its prompt and fired a test run.
- Unchanged: nothing deploys, nothing goes to main until he has seen the preview and the bank comparison and said go.

## Every update starts with two rough percentages (Mako, 2026-11-20, about 02:45 UTC)
Said in MAIN 10's chat and relayed to coordinator 7 (not seen first hand). Standing rule for every update he asks for, from any session:
- Line 1: two rough percentages. First version ready for him with everything checked (about 80% at 02:45 UTC). Including art and the 3D world (about 45 to 50%).
- Line 2: what is being worked on now.
Also in RESUME section 7.

## Experience calls wait for his full run; the rest, the team decides (Mako, 2026-11-20, about 05:50 UTC)
Said in MAIN 10's chat and relayed to coordinator 8 (not seen first hand).
- Q1 (the "They add up" line), Q4 (picture below the fold on Home), "Check your bank vs plan start" and cards in their month all wait until he uses the app himself.
- Anything that needs him to judge the user experience waits for his full run on the finished build.
- For everything else: do what the team thinks is best and do not wait for him.
- When the build is ready he does one full run and gives all his feedback at once. So: no separate questions to him before that.

## Mako is in Japan: times in Japan time (2026-11-20, relayed by MAIN 10 at 05:55 UTC, 14:55 JST)
- Give Mako every time in Japan time (JST, UTC+9).
- Do not say "overnight" or "tonight" unless it is night in Japan.

## Full steam until Sunday 09:00 JST, never pause again (Mako, 21 Nov 00:45 JST = 20 Nov 15:45 UTC)
Said in MAIN 10's chat and relayed to coordinator 8 (not seen first hand).
- "Full steam ahead, run non stop until 9am on Sunday" (Sunday 23 Nov 09:00 JST = 22 Nov 00:00 UTC).
- About MAIN 10 pausing to wait for his feedback: "make sure this doesn't happen again. ever". No session waits on him while work remains; things for him go on the list for his full run.
- How: repo CLAUDE.md holds the never-stop rules; RESUME has a work queue to Sunday 09:00 JST; every MAIN and every coordinator gets its own hourly keep-going wake-up (MAIN 10: trig_01MsTYUWz5yhyBMMgDMiV7jw).

## Use all the credits before the reset (Mako, 21 Nov about 19:00 JST)
Said in MAIN 12's chat and relayed to coordinator 8 (not seen first hand): "use all of the credits possible. the reset is at 9am tomorrow." (Sunday 22 Nov 09:00 JST = 22 Nov 00:00 UTC, the same end as the non-stop window.)

## 2026-11-23 08:16 JST (relayed by MAIN 15): foundation, pay-to-pay
- Mako flagged that the engine plans in calendar months from a month-start balance, but people are paid on any day and in many cycles. The pay day and ledger designs (side/payday-design, side/ledger-design) already said pay-to-pay; the main build never took it in.
- MAIN 15 paused QC round 15 and is doing a foundation review: every calendar-month assumption, a pay-to-pay model anchored to today's bank, its size, and other likely setbacks. It goes to Mako as one recommendation.
- No polish work on top of the month model until Mako decides. The efficiency agent runs on the plan when it comes.

## The new foundation (Mako, 2026-11-23, answers to foundation_review/RECOMMENDATION.md)
1. **Rebuild the base before version one: yes.** The engine moves to dated events with accounts, today's bank as the anchor, pay and bill schedules, and a look ahead (RECOMMENDATION.md section 3). Built beside the old engine and switched over in one step.
2. **What Home calls the current stretch: Claude's recommendation.** Its dates, for example "10 Nov to 9 Dec". The month name only in history.
3. **Goal money: both.** "Kept in my bank, set aside" is an option (the default), and "moved to its own account" too.
4. **Card statement close days:** Mako does not know them. Setup asks for each card's statement close day with a plain explanation and a "not sure" answer; tests use made-up days.
5. **Minimum balance (Mako, 2026-11-23):** setup asks once, "Keep at least ___ in your bank?", with the box empty. Skipping means no minimum; it can be changed in Settings. No minimum is ever set without the person choosing it.
6. **Phone and desktop in version one (Mako, 2026-11-23):** if the same plan or settings item is changed on both devices before they sync, the app asks which to keep; the other version is kept so Undo works. Money that happened (spends, pay, transfers) always joins up on its own. Automatic field-by-field merging moves to stage 2. (Reverses DECISIONS_ROUND2 D4's "never asks"; recommended by efficiency_review_2.)
7. **How we build and what v1 starts with (Mako, 23 Nov evening JST, full text in foundation_review/DECISIONS_ROUND2.md):** AX thin slices that reach Mako, one engine, reference frozen, no new rule rounds; AZ app3 is its own page and lanes merge themselves; BE Mako has no old data, so v1 starts empty and the data move is not wired.
8. **Where v1 runs (Mako, 23 Nov about 21:30 JST, DECISIONS_ROUND2 BG):** a private, unlisted web address on the existing Cloudflare site, not a file. He was asked "That needs your OK to publish the new app to a private address, not the main site" and chose it. The question did not say this means a push to main (which redeploys the site), so it was held until he confirmed. **Mako, 24 Nov about 08:20 JST, answering "may MAIN 15 push only the new app's files to main once the walk passes?": "yes push".** This also accepts the real-page walk (71 hand-worked checks) in place of the old bank comparison, which had nothing to compare (BE).
9. **Cloud copy server changes (Mako, 24 Nov about 09:30 JST, "approve all"):** all five from app3/FOR_MAKO.md: (1) refuse a write that names no base when a copy exists, (2) refuse unknown or newer formats, (3) keep the last 10 dated versions, (4) leave a deleted marker, (5) daily write limit 400 to 1,500. He was told nothing goes live until he approves, so this approves deploying them: a push to main that changes only the cloud copy server code and its tests, with the old app unaffected. After it is live and checked, the cloud copy may be used on more than one device (lifts BG3). Mako, 24 Nov about 10:25 JST, asked "May I push it to main and make it live?": "yes". Coordinator pushed main-vault 4ab1f49 to main (fast-forward from ba79e69, 5 files).
10. **One chat (Mako, 24 Nov about 09:50 JST):** "I just want to talk to one chat ... make sure everything is always funneled to one chat, the coordinator one." No build or side session asks Mako anything directly or waits for him in its own chat. Every question, approval request and result goes to the coordinator session, which puts it to Mako with the text in front of him. For a push to main, the build session prepares the exact commit and the coordinator asks Mako in this chat; after his yes here, the coordinator itself pushes that prepared commit to main.
11. **Speed-ups for the next stage (Mako, 24 Nov about 10:00 JST, "yes these are both good"):** (1) the foundation reviewer runs on pieces that change the money engine or saved data, and on every plan before building; screen-only pieces are gated by a month walk with hand-worked figures. (2) Quick checks after each small change; the full check (about 45 browser tests and three month walks) runs before each merge.
12. **AI first (Mako, 24 Nov about 11:10 JST, on his first run of the live app3):** "it needs to all be AI first." Setup is a chat with the AI assistant: it welcomes the person, explains how The Burrow works, asks the questions (how many banks, is the pay already taxed, which bills on which dates), tells them where to find each figure when they don't know, takes answers and uploads in the chat, and when it has everything it fills in the app. The person can ask it anything about the app at any time. The assistant is always on screen, knows the whole picture and has full control of the numbers (it changes them through the same named actions as the screens, so every change shows what changed and can be undone). Day to day the person mostly talks to it ("here are my new receipts"), and it adds, sorts and reports. The screens stay as the place to see and check. He asked how this was missed: the in-app assistant that "carries out decisions once agreed" was already a decision (DECISIONS line 49), but v1 was built screens first under U1 ("every task through the UI alone") with the AI off on the server, so the assistant became a side feature. Needs ANTHROPIC_API_KEY on the site (asked 24 Nov).
13. **Pay is what lands in the bank (Mako, 24 Nov):** his main pay arrives with tax already taken off, and the setup never asked. The pay question must ask for the amount that lands in the bank (after tax), say so plainly, and the assistant asks "is this before or after tax?". A correctness fact about his money: a failing test the same day.
14. **Setup feedback from his first run (Mako, 24 Nov):** "everyday spending" means nothing to him as worded (what is it: food, play money?); bills cannot be removed and an empty amount shows an error with no way out; one save for the whole setup is wrong, he wants each section saved on its own with a "saved" notice, and Undo everywhere. One bank only is fine for now if it is intentional (it simplifies), though people do have several. Later, visual only: centre the arrows on drop-downs; numbers typed get thousands commas automatically. If he confirms, it is a narrow exception to "nothing to main": once the real-page walk passes, a push to main may add only the app3 files under a private path; the old app at the root must stay unchanged and nothing else may ride along. Everything else on main still waits for his go after the preview and the bank comparison. The cloud copy stays on one device until he approves the server changes in app3/FOR_MAKO.md.
15. **"Full steam ahead" (Mako, 24 Nov about 11:35 JST).** He did not answer "ask before each money change, or change with Undo" directly. Built as change-then-Undo from his own words ("full control over all the numbers", "I don't like that you can't undo things"), with a confirm only for deletes and changes over safe to spend; marked for his run.
16. **AI relay fix (Mako, 24 Nov about 11:45 JST, "yes" to "May I push it to main and make it live?"):** daily call cap keyed to the invite word (stored as an HMAC), 400 a day per household by default, prompt caching. Coordinator pushed main-relay 6740469 to main (fast-forward from 4ab1f49, 5 files: functions/api/ai.js and tests). Suggested to Mako: a $30 monthly spend limit in the Anthropic console.
17. **QC reviewers to be brought up to standard (Mako, 24 Nov about 11:45 JST, to coordinator 11):** "with this new direction, I think we need to update all of the QC agents ... the fact that we missed this whole AI first thing is pretty crazy to me ... it's crazy that you can't remove banks, add banks ... People need to be able to add different things, remove different things. And the fact that that's not an option tells me that the QC agents are not doing a good enough job. So I think they all need updating." He gave the task to the coordinator, to approach as it thinks best. Facts for the briefs: the assistant is the main way in; every kind of thing a person has can be added, changed and removed, with Undo.
18. **What Mako says must reach every part (Mako, 24 Nov about 12:15 JST, to coordinator 11):** "I want you to make sure that you are the head of all of this, that the context that I'm sending you here is actually getting passed to like every single chat, and that we are all on the same page. That's the biggest thing for me, is anything I send you here, if it doesn't trickle down into every part of what we're doing, then there's no point. So I want you to ensure that happens." Done as: wip/team/MAKO_SAYS.md, one page of everything he has said the app must be and do, owned by the coordinator, read by every session, helper and QC reviewer before work (CLAUDE.md); the coordinator sends every change to every running session and gets back what it changes; reviewers mark each line met or not on every build.
19. **Use Fable wherever it is better, and use every reset (Mako, 24 Nov about 12:25 JST, with a picture of his usage page):** "I want to use Fable as much as possible so I can use the two resets there so we can get this app done as soon as possible. I just want to use the resets after we max it out fully, so we don't waste any credits ... I want you to use Fable in the other chats wherever it is applicable ... base your resource allocation based on this because I want to go through all of the resets this week if possible or in the next few weeks." His page at that time: weekly limit for all models 93% used (resets Sunday 09:00 JST), Fable 4% used, the 5-hour window 52% used (resets 16:30 JST); one full reset (expires 11 Dec) and two Fable resets (expire 9 Mar 2027; each refills the 5-hour window and the Fable allowance and gives back what Fable used on the weekly limit). Done as: every reviewer and helper runs on Fable; the next main session runs on Fable; the coordinator tells Mako which reset to press and when (full reset when the all-models limit stops the work, a Fable reset each time the Fable allowance is used up). Replaces "next best model when the strongest runs out" for now.
20. **Out of resets; Opus after Fable is used up (Mako, 25 Nov about 09:25 JST):** "you haven't set it up so it continues after the session limit hits. we've wasted time. fix this once and for all" and "one of the resets didn't work. so we are out of resets. after fable maxes out we will need to switch to opus. can you make sure that won't cause any issues? ... we need to switch it to a lesser model so make sure nothing gets missed." What happened: on 24 Nov the 5-hour window stopped every session three times (about 14:00 to 17:50, 20:30 to 22:50, 23:35 to 03:50 JST) and the weekly limit then stopped everything from about 04:40 to 09:20 JST on 25 Nov; the coordinator stops with the rest, so it could not warn him. Done as: wip/team/RUNBOOK.md (the coordinator's job as steps any model can follow, with "Limits" and "Switch to Opus"); four resume-watch tasks into the coordinator at :01, :16, :31 and :46 that read the limit state, warn him before a limit fills where the state shows it, and wake any stopped build session; pacing rules (one builder helper and one reviewer per session at a time, reviewers capped, scripts before reviewers); every session pushes after every commit.
21. **Pause when he says so (Mako, 25 Nov about 10:00 JST, in coordinator 12's chat):** "pause for a bit. doing other chats and don't want to use up the session limit. but wrap it up so we don't lose progress." Done as: MAIN 16 and LANE B told to commit, push, mark their state pages PAUSED BY MAKO and stop; every keep-going and watch task disabled (list at the top of COORDINATOR.md). Work starts again only on his word in the coordinator's chat.
22. **A question carries everything he needs (Mako, 25 Nov about 10:20 JST):** "wtf is the candidate 2 question??? stop sending me these random things without context - if theres a question I need all of the info right in front of me please". Cause: three updates in a row said "the candidate 2 question is still open" with a team label and no content. Done as: never use team labels (candidate numbers, lane names, hashes) with him; every time a question is put or repeated, the message holds what it is, what changes for him, what does not, the risks, and the exact yes or no. No reminder lines about an open question without all of that.
23. **Update pushed to main on his yes (25 Nov about 10:30 JST):** asked in coordinator 12's chat with the full list (comma amounts stay saved, bank below zero, back button closes the sheet, remove rows in setup, pay after tax, install to home screen; not in: assistant as the main way in, add or remove banks; the two known faults). Mako typed "yes". Pushed ba17a838 (republish-c2bea7d, parent 6740469, 5 files under the private path only) to main.
