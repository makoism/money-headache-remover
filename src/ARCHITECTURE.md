# The Burrow: how it is built

One page. No framework, no libraries, no outside requests from the page itself. The source is a set of small files in this folder; `build.sh` joins them into one HTML file (`../money-map-team.html`). The same page is published two ways: as the Claude artifact (a mirror where AI runs on the viewer's own Claude account) and as the site on Cloudflare Pages (`../site`, the main address: the owner's relay answers AI requests, and an encrypted cloud copy is available).

## Layers
```
model.js      pure arithmetic and the small mutation primitives (no page, no clock, no storage)
actions.js    ACT: named, checked, undoable changes; the only door the setup, import, assistant and screens should use
ui*.js        screens and flows; they read S, call ACT or the model, and draw
ui41/ui42     adapters to the outside: the AI route (relay or viewer's Claude) and the cloud copy
../site/functions   the server: /api/ai (relay with caps), /api/vault (encrypted copies), /api/health
```

## Why it is built this way (research, Nov 2026)
- **Functional core, imperative shell.** All money maths lives in `model.js` as pure functions (no page, no clock, no storage). The other files read the state, call the model and draw. Pure maths can be checked by script against an independent calculation, which is how the number checks work.
- **Idle must cost nothing.** WebKit's power guidance: finish work fast, then return to idle; avoid timers and script-driven animation; use CSS transitions. Google's INP guidance: audit what runs while the page sits idle, and keep every task under about 50 ms. The guard test (`tests/guard.js`) enforces both.
- **Measure, do not guess.** The first measurement found a loop in the date-picker label sync that rewrote the same text at screen speed (3% CPU idle, 9% on Receipts). Fixed by writing only when the text changed.
- **Single file, modular source.** One file means no network waterfall and it works offline. The source is split so a change touches one small file.
- No minifying: startup scripting is about 60 ms, so the cost of unreadable code is not worth it.

## Files
| File | What it holds |
|---|---|
| `model.js` | The money model: `calcAll`, `goalInfo`, `jarsOf`, `viewOf`, `statusOf`, `receiptStats`, `sweepPlay` (a month's unspent play money into a goal, that month only). A goal carries `why`, the reason in the person's words (`WHY_MAX` 80). `setVal` scope `once` or `month` is one month; `after` is from that month on. Pure. Never change without the number checks. |
| `ui0.js` | State `S`, normalising saved data, saving (`persist`, `flush`), small helpers |
| `actions.js` | `ACT`: transactions with undo (`ACT.tx`, `ACT.undo`), setters for pay, lines, goals, jars, receipts, name, currency, Home layout, `ACT.sweep(ym, goalId, amount)`; `ACT.summary()` reads the key numbers |
| `ui1.js` to `ui4.js` | The Plan tab (lines, ledger), bar and legend, road chart, tooltips, Receipts |
| `style.css` (top) | THE RULESET: the tokens every screen is built from. Corners grow with padding (`--r-ctl` 14, `--r-ctl-s` 12, `--r-ctl-xs` 10, `--r-box` 18, `--r-panel` 24, `--r-card` 28, pills 980); one card padding (`--pad-card`) and one distance between cards (`--gap-card`); type tiers `--t-micro` 13 to `--t-h1`; control heights `--ctl-h` 52, `--btn-h` 44, `--btn-h-s` 38, `--btn-h-l` 52. Use a token, never a raw number, for any of these |
| `art.js` | The nature line art: `ART` (inline SVG for grass, sprig, vine, sprout, branch, drawn in `--leaf`), `art(kind)`, `ART_SEATS` (Scan, Month hero, ledger, the backup reminder, All months, the Settings card, the Receipts form) and `placeArt()`; fern, twig, flower and the `corner` vine (the garland around the hello video) come from `/tmp/v35/mkart2.py`, the rest from `/tmp/v30/mkart.py`. Every setup screen gets a plant: a step's own `art`, else `ART_BY_PART` (ui45.js); `fitTourArt` hides it when the words reach it, and `pixFit` does the same for art inside cards |
| `pixel.js` | The pixel art: `PIX` (axolotl, ocelot, tulip, daisy, sunflower, sprout, cactus, mushroom, clover as crisp SVG), `pix(kind, scale)`, `PIX_SEATS` (host, sprites, scale, corner), `placePix()` and `pixFit()` (a sprite hides itself when words or controls reach its corner; `put()` re-seats after a redraw, `pixQueue()` re-checks on resize), `peek(kind)` (the axolotl pops up bottom-left on a big celebration, the ocelot walks in from the right on a medium one, never under reduced motion). Regenerate with `/tmp/v32/mkpix.py` |
| `ui44.js` | The celebration: falling leaves on the `#confetti` canvas and the one-line cheer toast |
| `stmt.js` | Statements to numbers, pure: `stmtCleanRows` (one file's rows, checked), `stmtGroups` (files of one account, told apart by the transaction dates and printed periods, never file names; periods joined end to end), `stmtMerge` (duplicates once, within an account), `stmtMerchants`, `stmtNumbers` (pay, balance, bills, subs, loans, card, questions, the months line), `stmtReceipts`. Unit test: `node /tmp/v29/stmt_test.js` (42) |
| `ui45s.js` | Setup screens (the typed money screen, bills, jars fold and split, goals, reveal), `SUBS` (subscription list and price hints by country) |
| `ui45c.js` | Before the uploads: the conversation screen (`STEP_CHAT`). Asks the kinds of account, how many, their names; explains why, what happens, how categories work; `ONB_FAQ` answers common questions without AI, typed ones go to `askFn` with `ONB_GUIDE`. Saved in `S.ui.onb`; `onbApply` turns the answers into the upload boxes |
| `ui45u.js` | Setup from statements: the Your statements screen (upload; the any-AI route where Claude cannot be reached; Type the numbers instead), the review screen, `importApply`. `IMP_FORMAT` + `importClean` are the pasted-answer contract |
| `ui45v.js` | The statement reader: one fixed-shape job per file (`STMT_ROWS_SCHEMA`; a text file over 120 lines goes in parts that come back as one read), four at a time, then one category job per new merchant (`STMT_CATS_SCHEMA`, `STMT_CAT_GUIDE`); progress lines, `stmtReviewHTML` (what was read, categories with a tap for the rows behind each merchant), `stmtRecat`, `stmtAfterApply` (receipts with `src:'stmt'`, learned categories in `S.ui.cats`). The tool is offered with `tool_choice` auto and asked for in the prompt: Sonnet 5.5 refuses a forced tool |
| `ui45x.js` | Setup extras (card calculator, subscriptions, goals add-another, `JAR_LINES`), **sound effects** (`SFXD` recipes, levels, routing) |
| `music.js` | `MUSIC`: the setup's background piece (original, generative: pad, bell melody with echoes, wind, drops), started on the first tap in the setup, quiet while the hello video plays, off with Music off or Sound off, stopped when the setup closes. `MUSIC.render(ctx, out, seconds)` schedules it into an offline context for checks |
| `world.js` | The world: the pages live on a scroll that a hand raises over the scene; the orb (hands drawn by rule on a canvas, a glass sphere with CSS stars and orbiting sparks, tinted by `--realm`) holds the small controls |
| `realm.js` | The six realms: `REALMS` (name, one line, palette turn for the old LIFE scenes), `REALM_GLOW`, `pickRealm` (random, never the same twice running, `?realm=` pins one; the dream one is rare) |
| `card.js` | The realm title card shown on each open (name and one line, fades in and out in about 3.5 seconds, never blocks a tap; skipped when `?realm=`, `?tod=`, `?lifetest`, `?sfxtest` or `?nocard` is in the address) |
| `scene.js`, `sprites.js`, `life.js` | The old scene engine and the Fairy Woods (`wood`) and plain mode; `life.js` is the older creature system (LIFE) |
| `vgfx.js`, `vista.js`, `vcommon.js` | The depth engine ("HD-2D for the browser"): stacked canvas layers moved by pointer/tilt parallax, per-layer blur and haze, a screen-blend light canvas, CSS god rays and weather. A realm registers a set with `VISTA.reg(id, {stageK, eco, pal, layout, rays, weather, layers, lights})`; painters work in viewport units. Live drawing runs at 6 fps and only while visible |
| `lifekit.js` | ECO, the network engine: nodes (spirit, plant, creature, home, house) and links (root, feed, talk, vine, wire). Touching or hearing anything sends glyph bubbles, pulses along links and expanding waves; the realm's Spirit connects everything. Bubble count is capped (6 wide, 3 narrow) |
| `vs_*.js` | One scene set per realm: `vs_wood` (LIFE based), `vs_crystal` (Crystal Heart, Elders, veins in the floor), `vs_sea` (Old Jelly, ribbons of light), `vs_shire` (Heart Tree, roots cut open under the grass, Greenlings carry energy through them), `vs_chiba` (cats with odd physics, the Great Cat), `vs_dream` (the Sleeper moon, silver threads to everything, a mirror sea). Each has at least 7 creatures (2 or more magical), 8 plant kinds, a goal house that builds in 8 stages with progress (`g.tk.stage()`), four moods |
| `nook_realm.js`, `vs_wood_forest.js` | Fairy Woods (the only realm in use; `ONLY_REALM = 'wood'` in `realm.js`, `?realm=` still shows others, set `''` to restore random). Native layered scene, no picture: glowing mushrooms are painted by `gshroom`, `grade` adds the teal vignette, far trees/trunks/roots come from `NK.forest`. Body gets `shroom-menu`, the orb is hidden (CSS), folk, huts, lanterns and the depth post-process are off. The menu is mushrooms: big ones open Home, Receipts, Plan; small ones are Streak, Sound, Music, Settings, Ask, Help (`L.shrooms`, `L.tools`; on a phone `L.tools[0]` and `[5]` are placed so every button is on screen). Tool taps click the real (hidden) buttons through `nd.tap`, deferred 40 ms so the outside-click handler does not close the panel. The goal house is a toadstool ring (stages 0-7, `?stage=N` forces one). Hover shows an icon bubble; clickable mushrooms shine softly; after 20 s of no input a hint shows (one re-arming timeout). `?lifetest` exposes `__ECO` and `__PX()` for tap tests. `vs_wood_pic.js` and the picture code are inert and not in the build. Other realms are paused (`vs_extra*.js` are not in the build). |
| `ambient.js` | Per-realm sound beds and event voices (`AMBI.setRealm`, `AMBI.sound`) |
| `ui45t.js` | Hello-video transcript (Mako's words, timed) |
| `ui45.js` | The tour engine: `TOUR` order (video and welcome, currency, statements, review, typed money, bills, split, goals, play money, done), open, close, next, back, autosave, hello video, the hill scene (`homeScene`, drawn in the look's accent) |
| `ui46.js` | Help menu, Ask Claude (viewer's own Claude account), copy-for-any-AI route |
| `ui47.js` | Date and month pickers |
| `ui48.js` | Coach marks (spotlight tour of a tab, only from Help: Explain this tab) |
| `ui41.js` | The AI route: `relayFn()` mirrors Claude's `sample` surface over the site's `/api/ai`; `relayHealth`, anon id, invite code |
| `ui42.js` | The cloud copy: recovery code, keys (PBKDF2 + HKDF), AES-GCM, push after each save, restore, conflict notice |
| `ui43.js` | Saving safety: IndexedDB second copy with automatic restore, backup reminder cards on Home |
| `ui49.js` | Scan receipts card |
| `ui6.js` | Home: status, next step (first steps, finish last month, the month-end top-up offer `sweepOffer`/`doSweep`/`undoSweep`, Make it exact), hero goal (the reason as its headline, what this month adds and what is to go), play money, streak, badges (`BADGES`, now ten), add-a-goal wizard |
| `ui5.js` | Wiring all events, Settings backup/restore, startup |
| `style.css`, `body.html` | Look and static markup (`@font-face` first, then the two palettes). `body.html` has `@@VER@@` and `@@STAMP@@` placeholders |
| `VERSION` | Line 1: version number. Line 2: date and time shown at the bottom and in Help. |
| `RELAY` | One line: the site's address, used only by copies opened as a file. Empty until the site exists. |
| `test_team.js`, `tests/` | Main suite and guard tests. More regression scripts live in `/tmp/v22`, `/tmp/v25`, `/tmp/v27`. |

All `ui*.js` files share one scope (one IIFE) in the order set in `build.sh`. Function declarations can be used before the file they are in; `const`/`let` values must be defined earlier in the build order than their first call at startup.

## Where to make common changes
| Change | Where |
|---|---|
| A subscription price or country hint | `SUBS` in `ui45s.js` (`[id, name, US, Japan, Philippines]`) |
| A sound, its level or character | `SFXD` in `ui45x.js`: `air` (wind), `rustle` (leaves), `drop` (water), `bird`, `hum`; `trim` sets the family levels; leaves, drops and the bird go to the bright output (`o.hi`) |
| The setup music (notes, chords, pace, level) | `music.js`: `DEG` and `CHORDS` (F major pentatonic plus the seventh), `LEVEL`, `PAD`, the timings in `changeChord`, `nextNote`, `step` |
| The typefaces | `@font-face` at the top of `style.css` (Nunito Sans for reading, Fraunces for titles and big numbers; files in `../fonts`, copied next to the page by `../pwa/make_pwa.py`); `--f` and `--fd` |
| The look (greens, glass, aurora) | the two palettes at the top of `style.css` (Day = light root, Forest = dark), `--aurora`, the glass rule and `.art-*` placements; the streak colour is `--streak`; PWA colours in `../pwa/make_pwa.py` and the icons |
| A celebration (leaves, sparks, the peek guys) | `celebrate`, `leafColors`, `leafFrame` in `ui44.js` (it calls `peek('axolotl')` for big and `peek('ocelot')` for medium); `sparkBurst` (small leaves on switches and sliders) in `ui45x.js` |
| The hello video's garden | `garden()`, `fromMako()` in `ui45.js` (four turned copies of `ART.corner`, two pixel-flower groups, the note in Caveat with an SVG arrow); `.vgarden`, `.vg-*`, `.from-mako` in `style.css`; the handwriting face is `fonts/caveat-latin.woff2` (OFL), `--fh`, used for that one note only |
| Where a plant sits | line art: `ART_SEATS` in `art.js` and the `.art-*` rules in `style.css`; pixel art: `PIX_SEATS` in `pixel.js` (`tr`, `br`, `bl` corners in `.pixc`). New sprite: a grid in `/tmp/v32/mkpix.py`, then paste the generated `PIX` block |
| The split sliders (jars, goals) | `moveShare`, `spreadFree` in `ui45s.js` (a slider changes only its own share; the rest is unassigned), `spPaint`, `splitApply`, `splitSpread`, `splitGive` in `ui45x.js` |
| The statement account boxes | `impAccts`, `acctNew`, `acctHTML`, `paintAccts` in `ui45u.js`; a job carries `acct` and `stmtTagRead` stamps each read; `stmtGroups` groups boxed reads by box; receipts carry the account as `s`; `S.ui.accts` remembers the names |
| The computer camera | `camOpen`, `camShot`, `camClose` in `ui49.js` (phones keep the native capture input) |
| Setup wording or order | the step definitions in `ui45s.js`, `ui45u.js` and `ui45.js`; the order is the `TOUR` array in `ui45.js` (`skipIf` drops the typed screens once statements gave the numbers) |
| A Home card | its `render…` function in `ui6.js`; markup slot in `body.html`; order and visibility via `HOME_SECTIONS` and `ACT.setHome` |
| The reason behind a goal (the Why line) | asked in `goalStep` (`ui45s.js`, `#tourGWhy`), the goal editor (`goalFormHTML` in `ui1.js`, `data-g="why"`) and the add-goal wizard (`#gwWhy`); shown by `renderHero`, `goalRowHtml`, `renderGoals` (`#jw-id`), the Setup done block (`ui45.js`), the celebrations, and the assistant's picture (`for:`) |
| The month-end top-up (unspent play money to a goal) | `sweepOffer` decides when (last month has four receipts or a statement, something left, a goal with room, not answered yet: `S.ui.sweep[ym]`), `doSweep` moves it through `ACT.sweep`, `undoSweep` takes it back; the model side is `sweepPlay` in `model.js` |
| What the statement reader asks Claude for | `STMT_ROWS_SCHEMA`, `STMT_CATS_SCHEMA` and `STMT_CAT_GUIDE` in `ui45v.js`; the arithmetic that turns rows into numbers is `stmtNumbers` in `stmt.js` (change the unit test with it). The pasted-answer route keeps `importRules` and `IMP_FORMAT` in `ui45u.js`, with `importClean` to match |
| The category words | `STMT_CATS`, `STMT_BILL_CATS`, `STMT_LINE` in `stmt.js`; the stub's keyword map in `../site/tests/stub_anthropic.js` for the tests |
| Which files the AI can read | `IMG_TYPES` and `DOC_LIMITS` in `ui41.js` (PDFs go up as document blocks on the relay route only; `askDoc` in `ui46.js` is null elsewhere), mirrored by `MAX_DOCS` in `../site/functions/api/ai.js` |
| What the assistant may do | `ASST_GUIDE` (the list Claude reads) and `asstCheck` (the checked actions) in `ui4a.js`; both must agree; `asstPicture` is what it knows |
| The Home "Next" card and the finish-last-month nudge | `renderNext` and `monthToClose` in `ui6.js`; `done.bills` is set when a bill amount is typed, when no bills are ticked, or when the jars screen is passed (ticking alone is not entering); `Show first steps` in Settings brings a hidden card back |
| Goal money in the setup | `ltsBudget` in `ui45s.js` (the Long-Term Savings jar's money, by the jars screen's own arithmetic: whole percents of the pay the bills leave); `settleGoals` gives a lone goal the whole jar (capped by what it still needs), the split screen (`STEP_SPLIT`) shares it between two or more |
| A card that hit a snag, the error log, Report a problem | `safe(fn, host, where)`, `logErr`, `errLog` (`mhr-errlog`, last 12) in `ui0.js`; `reportText`, `openReport` in `ui46.js` (version, device, screen, look, counts, last errors; no money) |
| Two tabs, a clock set back, a newer version online | `storedIsNewer`, the `storage` listener and `adoptOther` in `ui0.js` (`persist` only ever raises `rev`); the update offer `#upd` (`mhr:update` from the registration script in `../pwa/make_pwa.py`, handled in `ui5.js`) |
| The scenery behind the page | `scene.js` (`SCENE`): below 720px wide there is no scene behind the words, only `paintSign` (a wooden sign painted into the header's `--sign`) and `#sceneBot` (a stream along the bottom with stone seats measured under Ask and Help). Above that: one pixel canvas, still layer painted per size and mood, living layer at 6 fps, veil over the page column; moods by the clock (`?tod=` fixes one); `S.ui.scene === false` turns it off (music panel). Since 36.2 it is a deep old forest (trunks in mist, cottage, fairy ring, rune stones, waterfall pool with a spirit stag, fairies); the cozy cabin version is in git history at 36.1. Music on/off is one setting: the Settings switch, the setup button and the panel all go through `DJ.setSrc`. |
| Top bar: streak, mute, music | `paintTopStreak` in `ui6.js`; `dj.js` (`DJ`, `ALBUMS`, `djSrc`, `volOf`): one-tap mute (`S.ui.mute`), volume `S.ui.vol` through `SFX.out()`/`SFX.vol()` in `ui45x.js`, sources Forest / an album / Off (`S.ui.dj`, `S.ui.music`); albums stream through YouTube's visible player in `#djDock`, loaded only when chosen; add an album to `ALBUMS` |
| Animals in card corners | `PIX_SEATS` in `pixel.js` (sprites from `/tmp/v37/mkpix.py`); the line-art seats in `art.js` are down to the hero vine |
| Undo after Zero all or Restore samples | `offerUndo` in `ui5.js` (`#undoBar`, 15 seconds) |
| Typed commas in amount boxes | `moneyTyped` in `ui6.js`: a comma is a decimal point only for `COMMA_DEC` currencies, otherwise dropped (the box regroups thousands itself) |
| A receipt dated after today | `futureOk` in `ui4.js` (asks once, logs on the second tap); `selByReceipt` lets the Plan pages return to the month in hand after the list followed a receipt into another month |
| AI limits, models, the code word | the Cloudflare project's Variables (see `../site/SETUP.md`) |
| Colours, spacing | variables at the top of `style.css` |
| Sample numbers per currency | `presetState` in `model.js` |
| The version | `VERSION` |

## Contracts: do not edit casually
- `askExtractPrompt` and `scanMessage` in `ui46.js`, `IMP_FORMAT` / `importClean` in `ui45u.js`, and the two schemas in `ui45v.js` are read by machines (Claude and other AIs). Changing a field name breaks reading photos, statements and pasted setups.
- The relay request shape (`functions/api/ai.js` validate) and `relayFn` in `ui41.js` must agree. The vault record shape (`functions/api/vault`) and `ui42.js` must agree.
- Storage key `money-map-template-v2` and the shape of `S`: only add fields; `normalize` fills defaults, so older saved copies keep loading.
- `model.js` outputs feed every screen; any change must pass the full number checks.
- `rev` in the saved copy only goes up (`persist`); a tab never writes over a newer copy, so a clock set back or a second tab cannot lose a save.

## Rules for new code
1. **Idle is zero.** No `setInterval`, no polling, no `requestAnimationFrame` loops except while an animation is visibly running. A MutationObserver callback must never write to the DOM unconditionally (it would re-trigger itself).
2. **Write the DOM only when something changed** (`put()` in `ui6.js`, `dpSet` in `ui47.js`).
3. **Animate only `transform` and `opacity`** with CSS, not script.
4. **Do work after the first paint**: sound engine, video and Ask Claude start on first use, never at load.
5. **No outside requests** (fonts, scripts, analytics). The guard fails if one appears.
6. **Keep tasks short** (under 50 ms); split work and let the browser paint between parts.
7. **Content is data**: lists of prices, categories, wording go in a table at the top of a file, not inside logic.

## Checks and release
```
./check.sh          # about 1 minute: build, syntax, main suite, safety tests, idle and speed guard
./check.sh full     # adds all regression scripts, the number checks and the installable app (about 25 minutes); a script that cannot start counts as a failure. Run nothing else that opens a browser meanwhile.
cd ../site && ./tests/dev.sh && node tests/relay.test.js && node tests/page_relay.js && node tests/page_vault.js && node tests/page_import.js   # the server and the hosted page
```
Site release: `cd ../site && ./build_site.sh`, copy into the GitHub clone (`/home/claude/money-headache-remover`), commit, push `main`; Cloudflare deploys within a minute; check `/api/health` and the Version stamp on the live address.
Release: edit source, update `VERSION`, `./check.sh full` (it builds and tests the app package too), publish (`list_files`, `get_artifact`, `publish_files` with `mode: patch` and the current live version), check the live page, add a dated entry to the Project doc.

## Known limits
- In the artifact, data lives in the browser (localStorage plus a second copy in IndexedDB); clearing site data removes both; only a backup file survives. On the site, the optional cloud copy survives anything as long as the person keeps the recovery code. The artifact cannot reach the relay or the vault (its pages may not call other hosts).
- Sounds were only measured offline, never heard on a real speaker. Not tested on a real phone or iPhone Safari.
- The customer-experience pass (v35.1) walked the page as a new person on a phone (`/tmp/v36/ux_*.js`: naive and filled setups, the site's statement path, every tab and sheet, a crawl that taps every control). `/tmp/v36/ux_test.js` keeps what it fixed; redo the walk after any change to the setup's order or to Home.

| `scene.js` phone scene (38.2) | The phone keeps the 36.4 layout. The banner is a mossy cobblestone frame (`cobble`, `paintSign`) around one flat dark reading panel. The bottom is nine big boulders (four in a back row whose tops are the skyline, five in front), an arched hollow cut around Ask and Help, trickles that run between the boulders, and a stream 20 units tall: dark under the bank and brighter near you, the bank mirrored in it with ripples that grow toward the viewer, current bands that run faster when nearer, glints, rings and foam round two stones. `BH` 62, `yF = BH - 22`; the CSS bottoms for Ask/Help/cheer/undo are lifted to match. |
