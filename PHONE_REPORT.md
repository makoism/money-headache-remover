# Phone check: 38.28 (live) and 38.31 (coming)

Mako's report from his phone on the live site, 38.28: "the squirrel didn't show up when I added money, and it was laggy feeling, might have just been the animation speed of the rain? just want to make sure it's the same build as the desktop and works the same."

Read-only check. No app file was changed. Every number below was measured in this session; none are estimates.

## Short answer

1. **Same build: yes.** A phone and a desktop get the same page, byte for byte, and the same 17 files. Nothing on the server looks at the device. An installed app shows the new version as soon as it opens with internet. The only way to keep seeing an old version is to leave the app open on screen through a deploy. There is one small bug: after a deploy, an app that already shows the new version still says "A newer version is ready."
2. **The squirrel on a burrow screen works on phones.** In both builds, on every phone tested (including 4x and 6x slowdown), adding money on a burrow screen runs the coin trips. The phone setting "Reduce motion" (iPhone) or "Remove animations" (Android) skips them, and that is by design. Three real bugs can still make the squirrel hard or impossible to see on a phone:
   - **38.28 (live):** the *corner* squirrel (used by every add-money moment outside a burrow screen) plays on phones, but most of it is hidden behind the Ask and Help buttons.
   - **38.31:** the corner squirrel never plays at all on a screen narrower than 1260 px, so it never plays on any phone or small tablet.
   - **38.31:** on short phones (iPhone SE size and similar), the new page-dots bar covers the squirrel at the burrow door.
3. **Lag: mostly by design, plus two fixable costs.** The rainy burrow redraws every 66 ms (about 15 frames a second) on purpose, which looks steppy next to a 60-frame phone. The rain itself is cheap. The fixable costs are:
   - The Home forest keeps animating behind the burrow screen, where nobody can see it (about 30% of the burrow's script time).
   - Tapping Add freezes the page for 165 to 346 ms on a slow phone, right when the first squirrel trip starts.

Questions for Mako that would settle what he saw: which phone; is Reduce motion (iPhone: Settings, Accessibility, Motion) or Remove animations (Android) on; and did he add money on a burrow screen (the "Add money" button inside a burrow) or somewhere else, such as moving last month's leftover into a goal on Home.

## How it was checked

- Builds: `public/index.html` from origin/main (38.28, the live page, 1,691,377 bytes; identical to `public/index.html` on wip-38.31) and `wip/money-map-team.html` on wip-38.31 (38.31).
- Browser: the Chromium and puppeteer-core set up by `tests/setup_env.sh`. Devices are puppeteer's own descriptors (iPhone 13, iPhone SE, Pixel 5, Galaxy S9+, iPad Mini) with touch, screen size and user agent, plus a 1440 x 900 desktop. Throttling is CDP `Emulation.setCPUThrottlingRate` at 1x, 4x and 6x. Each run used a fresh browser, one at a time. Screenshots are at deviceScaleFactor 2.
- Limit: an "iPhone" here is Chromium shaped like an iPhone, not Safari. Safari's own service worker and its frame pacing cannot be tested in this container. The live site cannot be reached from here.
- Serving: each script started a small localhost server for its own run and closed it at the end, so the service worker registers as it does on the live site.
- Data: the app's own ¥ sample plan (from `presetState('¥')`), set up as finished (tour done), with the date fixed to 17 Nov 2026 and ¥20,000 free to spend. "Emergency fund" is the rainy burrow.
- The scripts and screenshots are in the session's scratchpad, not in the repo (this branch holds only this report). They are short: `lib.js`, `update.js`, `squirrel.js`, `corner.js`, `overlap.js`, `perf.js`, `attrib.py`.

## 1. Same build

| Device | HTML bytes | Same as main's public/index.html | Files fetched |
|---|---|---|---|
| iPhone 13 | 1,691,377 | yes | 17, same list |
| Pixel 5 | 1,691,377 | yes | 17, same list |
| Desktop 1440 | 1,691,377 | yes | 17, same list |

`worker/index.js` sends every non-API request to `env.ASSETS.fetch(request)` and has no device logic. The page differs on a phone only through its own screen-size rules (CSS and `innerWidth` checks), and those rules are where the differences below come from.

**What the installed app does after a new deploy** (Pixel 5, Chromium service worker; a deploy here means the version text changed and a new cache name in `sw.js`, which is what every real build changes):

| Case | What the person sees |
|---|---|
| A. App open in the background during the deploy, then brought back | Still the old version on screen. About 1 s after coming back: "A newer version is ready. Reload". Tapping Reload shows the new version. |
| B. App closed during the deploy, opened again with internet | The **new** version right away (the service worker fetches from the network first). Then, about 2 s later, "A newer version is ready. Reload" appears anyway. Reload changes nothing. **Bug B4.** |
| C. No internet | From the code (`public/sw.js`): the copy saved at the last online visit. Chromium's offline switch does not reach the service worker, so this case was read from the code, not measured. |
| D. App left on screen, never hidden, through the deploy | Old version, no offer, for as long as it stays on screen (8 s measured). The check runs only when the page comes back into view. By design. |

So a phone can only show an older build in case D, or with no internet. Mako's phone showing "Version 38.28" matches the live build.

## 2. The squirrel when adding money

There are two different squirrels:

- **Burrow coin trips** (`burrows.js` `feed()` and `drawCoins()`): the add-money panel on a burrow screen. Their only rule is reduced motion. The 150 s limit, the overspent rule and screen size do **not** apply.
- **Corner squirrel** (`squirrel.js` `SQ.stash()`): moving last month's leftover into a goal on Home (`ui6.js`), a goal reaching a quarter, the first receipt, a batch of 3 receipts, a new streak week. Rules: reduced motion, at most once per 150 s, skipped when overspent (receipt moments only). In 38.31 it is also skipped when the screen is narrower than 1260 px.

The burrow trips were detected by counting the squirrel's own sprite frames (coin-carrying run frames 20 to 24 x 19 and the 14 x 13 "holding the coin" frame) drawn on the burrow's effects canvas. These sizes never appear with no add (checked over 3 s). The trips were then confirmed by eye in the screenshots.

**Burrow coin trips** (add ¥5,000 to Emergency fund with the panel):

| Build | Device | Slowdown | Squirrel frames | Result |
|---|---|---|---|---|
| 38.28 | iPhone 13 | none | ran (seen in screenshot) | runs |
| 38.31 | iPhone 13 | none | 36 | runs |
| 38.28 / 38.31 | Pixel 5 | none | ran / ran | runs |
| 38.28 / 38.31 | iPhone 13 | 6x | 32 / 32 | runs |
| 38.31 | Pixel 5 | 4x | 34 | runs |
| 38.28 / 38.31 | iPhone SE 320 x 568 | none | 36 / 36 | runs, but covered in 38.31 (bug B3) |
| 38.28 / 38.31 | Galaxy S9+ 320 x 658 | none | 36 / 36 | runs, feet covered in 38.31 |
| 38.28 / 38.31 | iPhone 13, reduced motion | none | 0 / 0 | skipped, by design |

No page errors in any run.

**Corner squirrel** (called through the `?sqtest` hook; "plays" means it agreed to play and its canvas appeared):

| Build | iPhone 13 (390) | iPhone SE (320) | Pixel 5 (393) | Galaxy S9+ (320) | iPad Mini (768) | Desktop (1440) |
|---|---|---|---|---|---|---|
| 38.28 | plays | plays | plays | plays | plays | plays |
| 38.31 | **never** | **never** | **never** | **never** | **never** | plays |

A second call right after the first was refused in every case (the 150 s rule, as designed).

On a 38.28 phone, the corner squirrel's panel (240 x 96 px, bottom left, z-index 70) sits under the Ask and Help buttons, so only its tail and head show. It is easy to miss. That is a likely reason for "didn't show up" if Mako added money from Home.

**Page dots over the door (38.31 only).** 38.31 lifted the burrow page dots 66 px and gave them a dark pill with 44 px targets (commit 8989f32, `style.css` lines 1822 to 1826). Measured on the rainy burrow during a trip (CSS px, squirrel 57 px tall):

| Screen | 38.28: squirrel covered | 38.31: squirrel covered |
|---|---|---|
| 320 x 568 (iPhone SE) | 0 | 24 px (42%) |
| 360 x 640 | 0 | 12 px (21%) |
| 320 x 658 (Galaxy S9+) | 0 | 6 px (11%) |
| 375 x 667 (iPhone 8) | 0 | 6 px (11%) |
| 390 x 700 and taller | 0 | 0 |

These are heights inside the browser. On a real phone, Safari's or Chrome's own bars make the page shorter than the screen, so more phones fall into the covered rows.

## 3. Lag

Measured for 6 s on Home, 6 s on the rainy burrow, and 4 s on the burrow right after tapping Add. "CPU" is the share of time the page's main thread was busy (CDP `TaskDuration`). "Redraw gap" is the time between two redraws of the burrow's rain layer. "Long tasks" counts tasks over 50 ms.

| Build, device, slowdown | Home CPU | Burrow CPU | Burrow + add CPU | Burrow redraw gap, mean / p95 / max ms | Long tasks after Add | Long tasks idle |
|---|---|---|---|---|---|---|
| 38.28 desktop 1x | 1.7% | 5.7% | 7.6% | 67 / 68 / 71 | 0 | 0 |
| 38.28 iPhone 13 1x | 1.3% | 4.9% | 7.3% | 67 / 68 / 76 | 0 | 0 |
| 38.28 iPhone 13 4x | 5.5% | 18.8% | 26.8% | 71 / 74 / 93 | 1, 177 ms | 0 |
| 38.28 iPhone 13 6x | 8.5% | 28.8% | 40.3% | 74 / 82 / 104 | 1, 202 ms | 0 |
| 38.28 Pixel 5 1x | 1.3% | 5.2% | 8.3% | 67 / 68 / 72 | 0 | 0 |
| 38.28 Pixel 5 4x | 5.3% | 18.5% | 28.8% | 71 / 75 / 97 | 1, 165 ms | 0 |
| 38.28 Pixel 5 6x | 8.3% | 28.5% | 41.1% | 74 / 79 / 87 | 1, 202 ms | 0 |
| 38.31 desktop 1x | 1.6% | 5.6% | 7.6% | 67 / 69 / 72 | 0 | 0 |
| 38.31 iPhone 13 1x | 1.4% | 5.0% | 7.4% | 67 / 68 / 72 | 0 | 0 |
| 38.31 iPhone 13 4x | 5.4% | 20.3% | 28.4% | 72 / 76 / 86 | 1, 205 ms | 0 |
| 38.31 iPhone 13 6x | 8.2% | 28.8% | 40.5% | 75 / 82 / 91 | 1, 313 ms | 0 |
| 38.31 Pixel 5 1x | 1.5% | 5.2% | 6.9% | 67 / 68 / 74 | 0 | 0 |
| 38.31 Pixel 5 4x | 5.7% | 20.2% | 27.8% | 72 / 76 / 103 | 1, 234 ms | 0 |
| 38.31 Pixel 5 6x | 8.9% | 29.2% | 40.4% | 74 / 78 / 90 | 1, 346 ms | 0 |

**What costs the most** (iPhone 13 at 6x; script time per second of screen time, each canvas call charged to the app function that made it):

| On the rainy burrow | 38.28 ms/s | 38.31 ms/s |
|---|---|---|
| Rainy look in total (`burrow_rainy.js`) | 68.8 | 64.9 |
| of which pixel ellipses redrawn every frame (`ellPx`: puddles, toadstool caps, frog, stones) | 21.1 | 24.1 |
| of which the burrow itself repainted every frame (`room`) | 15.0 | 12.9 |
| of which the rain drops (`F.drops`) | 7.5 | 6.3 |
| **Home forest scene, hidden behind the burrow** (`scene.js` `draw`, waterfall tiers, lights) | **28.5** | **29.8** |
| Burrow screen frame (`burrows.js` `frame`, `loop`) | 13.6 | 14.1 |
| Halos, mostly the fairy lights (`pal.js` `halo`) | 6.9 | 12.6 |

On Home (6x): the forest scene is the only cost (33.2 ms/s on 38.28, 31.9 on 38.31).

After tapping Add, the extra cost is the whole page behind the burrow redrawing (`render()` in `feed()`): the garden (`garden.js` `occupy` and `paint`, 27.7 ms/s on 38.28), `ui45x.js` (9 to 11 ms/s), and the squirrel itself (6.7 to 9.4 ms/s).

**Against ARCHITECTURE.md:**
- **"Idle is zero"**: Home has no long tasks and no layouts, but it is not zero. The forest animates at 1.3 to 1.7% CPU at 1x (the guard's limit is 1.5%) and 8 to 9% at 6x. It is a visible animation, which rule 1 allows, so this is by design, but it sits at the guard's edge.
- **The hidden forest under the rainy burrow** is animation nobody can see, which rule 1 does not allow. Bug B6.
- **"Tasks under 50 ms"**: no long tasks while idle anywhere. The Add tap makes one task of 165 to 202 ms (38.28) and 205 to 346 ms (38.31) at 4x to 6x. At 1x it stays under 50 ms. Bug B5: it breaks rule 6 on a slow phone, it is worse in 38.31, and it lands just as the first coin trip starts, so the squirrel's run-in jumps.
- **The steppy look of the rain** is the 66 ms timer in `burrows.js` `loop()` (about 15 frames a second), and it holds even at 6x (mean 74 to 75 ms). The phone keeps up, so the "laggy feeling" is the chosen frame rate, not the phone struggling.

## Bugs and the smallest safe fix (not applied)

| # | Build | Bug | Smallest safe fix |
|---|---|---|---|
| B1 | 38.31 | The corner squirrel never plays below 1260 px wide (`squirrel.js` line 125, `window.innerWidth < 1260`). This breaks DECISIONS item 8 ("phone and desktop work the same") and ARCHITECTURE 38.30 ("smaller on phones"). The gate came in with the folder import (924ed82), so its reason is not in this repo's history. It was probably a way around B2. | Remove `window.innerWidth < 1260 \|\|` from the guard and fix B2 instead. |
| B2 | 38.28 live, and 38.31 once B1 is fixed | On phones the corner squirrel sits under the Ask and Help buttons. | In `stash()`, on narrow screens (`innerWidth < 760`) raise the panel above the help row: `bottom: calc(76px + env(safe-area-inset-bottom,0px))` instead of `8px`. Check it with the layout test at 320, 390 and 430 wide. |
| B3 | 38.31 | The page-dots pill covers the squirrel at the burrow door on screens under about 700 px tall (42% covered at 568). | Smallest: hide the dots while a coin trip runs. Add a class in `feed()` when `anim` starts and remove it where `stepAnim()` ends it, plus `#burrowView.bv-anim .bv-dots { visibility: hidden }`. Placing the dots elsewhere on short screens is a layout call for the Layout and touch role. |
| B4 | both | After a deploy, an app that already loaded the new page still shows "A newer version is ready. Reload". | In `pwa/make_pwa.py`, bake the build's cache name into the registration script. On `controllerchange`, fetch `sw.js` with `cache: 'no-store'`, read its `CACHE` name, and fire `mhr:update` only when it differs from the page's own. |
| B5 | both, worse in 38.31 | Tapping Add on a burrow screen blocks for 165 to 346 ms on a slow phone, just as the first trip starts. | In `burrows.js` `feed()`, do not call `render()` straight away. The page behind is hidden (`body.bv-on .wrap { visibility: hidden }`) and the burrow reads its numbers from `rows()`, not from the page. Set a flag and call `render()` in `close()` (and in `undoAdd()`). Re-run the main suite, since other code may expect the page to be fresh. |
| B6 | both | The Home forest keeps animating behind the rainy burrow's own full-screen world: about 29 ms/s at 6x, about 30% of the burrow's script time. | In `scene.js` `loop()`, return early when `document.querySelector('#burrowView.has-bg:not([hidden])')` exists. In `burrows.js` `close()`, call a new one-line `SCENE.wake()` that runs `loop()` again. Looks without their own world (the plain burrow) still show the forest and keep it running. |

## By design (no change suggested)

- Reduced motion skips the coin trips (`feed()` goes straight to the result) and slows the burrow loop to 400 ms.
- The corner squirrel's 150 s limit and its "not when overspent" rule (receipt moments only, `ui6.js` lines 62 and 63). Neither affects the burrow coin trips.
- The rainy burrow at about 15 frames a second. The frame rate is part of the art, which comes last and only with Mako, so no change is proposed here. Making the same animation cheaper is fine: after B6, the parts that do not move between frames (puddles, stones, the burrow when nothing changes) could be painted once onto their own canvas instead of every frame. Those parts are about 40% of the burrow's cost, and the picture would not change.
- The Home forest animating at 1.3 to 1.7% CPU (1x), visible and at the guard's limit.
- An app left on screen through a deploy keeps the old version until it is hidden and shown again, or reopened.
