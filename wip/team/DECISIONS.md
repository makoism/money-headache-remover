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
- Each burrow gets a completely different world. Mako wants to design each one together with Claude, who asks him at the start of each. The first is Rainy Day: rain outside, safe, cozy, dark evening, lit, magic, creatures and life everywhere, all animated.
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

