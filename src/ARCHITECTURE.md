# M.H.R.2000 (The Money Headache Remover 2000): how it is built

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
| `model.js` | The money model: `calcAll`, `goalInfo`, `jarsOf`, `viewOf`, `statusOf`, `receiptStats`. Pure. Never change without the number checks. |
| `ui0.js` | State `S`, normalising saved data, saving (`persist`, `flush`), small helpers |
| `actions.js` | `ACT`: transactions with undo (`ACT.tx`, `ACT.undo`), setters for pay, lines, goals, jars, receipts, name, currency, Home layout; `ACT.summary()` reads the key numbers |
| `ui1.js` to `ui4.js` | The Plan tab (lines, ledger), bar and legend, road chart, tooltips, Receipts |
| `ui44.js` | Confetti and the one-line cheer toast |
| `ui45s.js` | Setup screens (questions), `SUBS` (subscription list and price hints by country) |
| `ui45u.js` | Setup from statements: the source step (upload here, use any AI, type it in), the review screen, `importApply`. `IMP_FORMAT` + `importClean` are a machine contract |
| `ui45x.js` | Welcome extras, the shrine, **sound effects** (`SFXD` recipes, levels, routing) |
| `ui45t.js` | Hello-video transcript (Mako's words, timed) |
| `ui45.js` | The tour engine: open, close, next, back, autosave, welcome house drawing |
| `ui46.js` | Help menu, Ask Claude (viewer's own Claude account), copy-for-any-AI route |
| `ui47.js` | Date and month pickers |
| `ui48.js` | Coach marks (spotlight tours of each tab) |
| `ui41.js` | The AI route: `relayFn()` mirrors Claude's `sample` surface over the site's `/api/ai`; `relayHealth`, anon id, invite code |
| `ui42.js` | The cloud copy: recovery code, keys (PBKDF2 + HKDF), AES-GCM, push after each save, restore, conflict notice |
| `ui43.js` | Saving safety: IndexedDB second copy with automatic restore, backup reminder cards on Home |
| `ui49.js` | Scan receipts card |
| `ui6.js` | Home: status, next step, hero goal, play money, streak, badges, add-a-goal wizard |
| `ui5.js` | Wiring all events, Settings backup/restore, the copy-for-AI prompt, startup |
| `style.css`, `body.html` | Look and static markup. `body.html` has `@@VER@@` and `@@STAMP@@` placeholders |
| `VERSION` | Line 1: version number. Line 2: date and time shown at the bottom and in Help. |
| `RELAY` | One line: the site's address, used only by copies opened as a file. Empty until the site exists. |
| `test_team.js`, `tests/` | Main suite and guard tests. More regression scripts live in `/tmp/v22`, `/tmp/v25`, `/tmp/v27`. |

All `ui*.js` files share one scope (one IIFE) in the order set in `build.sh`. Function declarations can be used before the file they are in; `const`/`let` values must be defined earlier in the build order than their first call at startup.

## Where to make common changes
| Change | Where |
|---|---|
| A subscription price or country hint | `SUBS` in `ui45s.js` (`[id, name, US, Japan, Philippines]`) |
| A sound, its level or character | `SFXD`, `CLICK`, `trim` in `ui45x.js` |
| Setup wording | the step definitions in `ui45s.js` and `ui45.js` |
| A Home card | its `render…` function in `ui6.js`; markup slot in `body.html`; order and visibility via `HOME_SECTIONS` and `ACT.setHome` |
| What the statement import asks for | `importRules` and `IMP_FORMAT` in `ui45u.js`, with `importClean` updated to match |
| Which files the AI can read | `IMG_TYPES` and `DOC_LIMITS` in `ui41.js` (PDFs go up as document blocks on the relay route only; `askDoc` in `ui46.js` is null elsewhere), mirrored by `MAX_DOCS` in `../site/functions/api/ai.js` |
| What the assistant may do | `ASST_GUIDE` (the list Claude reads) and `asstCheck` (the checked actions) in `ui4a.js`; both must agree; `asstPicture` is what it knows |
| The Home "Next" card and the finish-last-month nudge | `renderNext` and `monthToClose` in `ui6.js` |
| AI limits, models, the code word | the Cloudflare project's Variables (see `../site/SETUP.md`) |
| Colours, spacing | variables at the top of `style.css` |
| Sample numbers per currency | `presetState` in `model.js` |
| The version | `VERSION` |

## Contracts: do not edit casually
- `askExtractPrompt`, `scanMessage` and the AI-prompt JSON format in `ui46.js` / `ui5.js`, and `IMP_FORMAT` / `importClean` in `ui45u.js`, are read by machines (Claude and other AIs). Changing a field name breaks reading photos and pasted setups.
- The relay request shape (`functions/api/ai.js` validate) and `relayFn` in `ui41.js` must agree. The vault record shape (`functions/api/vault`) and `ui42.js` must agree.
- Storage key `money-map-template-v2` and the shape of `S`: only add fields; `normalize` fills defaults, so older saved copies keep loading.
- `model.js` outputs feed every screen; any change must pass the full number checks.

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
./check.sh full     # adds all regression scripts and the number checks (about 10 minutes)
cd ../site && ./tests/dev.sh && node tests/relay.test.js && node tests/page_relay.js && node tests/page_vault.js && node tests/page_import.js   # the server and the hosted page
```
Site release: `cd ../site && ./build_site.sh`, copy into the GitHub clone (`/home/claude/money-headache-remover`), commit, push `main`; Cloudflare deploys within a minute; check `/api/health` and the Version stamp on the live address.
Release: edit source, update `VERSION`, `./check.sh full`, rebuild the app package (`cd ../pwa && python3 make_pwa.py`, test with `node /tmp/team_pwa.js`, 8 PASS expected), publish (`list_files`, `get_artifact`, `publish_files` with `mode: patch` and the current live version), check the live page, add a dated entry to the Project doc.

## Known limits
- In the artifact, data lives in the browser (localStorage plus a second copy in IndexedDB); clearing site data removes both; only a backup file survives. On the site, the optional cloud copy survives anything as long as the person keeps the recovery code. The artifact cannot reach the relay or the vault (its pages may not call other hosts).
- Sounds were only measured offline, never heard on a real speaker. Not tested on a real phone or iPhone Safari.
