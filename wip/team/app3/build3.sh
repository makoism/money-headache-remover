#!/bin/bash
# Builds app3/index.html: slice 1 of the new engine as its own small page (DECISIONS_ROUND2 AZ1).
# It reuses, copied in at build time and never edited: the style tokens of ../style.css (the :root palettes only),
# ../art.js and ../pixel.js, the engine (../engine/), the shared screen pieces (../screens/) and the store (../store/). The old app is not touched.
cd "$(dirname "$0")" || exit 1
ENGINE="dates.js units.js ids.js schedules.js ledger.js lookahead.js periods.js match.js checkin.js build_book.js"
SCREENS="money.js names.js status.js inputs.js provenance.js messages.js help.js"
STORE="clock.js guard.js idb.js persist.js"
OUT=index.html
set -e   # a part that cannot be read (a full disk, a missing file) stops the build before it replaces the page
trap 'rm -f "$OUT.tmp.$$" sw3.js.tmp.$$' EXIT
{
cat <<'HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>the burrow (new engine, try)</title>
<link rel="icon" href="data:,">
<meta name="theme-color" content="#0c1a15">
<script id="a3install">/* installing to the home screen (M33): the manifest and icon beside the page, only when it is served (a page opened as a plain file cannot read them) */
if (/^https?:$/.test(location.protocol)) document.head.insertAdjacentHTML('beforeend', '<link rel="manifest" href="manifest3.webmanifest"><link rel="apple-touch-icon" href="icon3-192.png">');</script>
<style>
HEAD
# the tokens: from the first :root block to the line before "* { box-sizing", both palettes included
awk '/^:root \{/{on=1} /^\* \{ box-sizing/{on=0} on' ../style.css
cat src/app3.css
echo '</style>'
echo '</head>'
echo '<body>'
cat src/shell.html
echo '<script>'
for f in $ENGINE; do cat "../engine/$f"; done
for f in $SCREENS; do cat "../screens/$f"; done
for f in $STORE; do cat "../store/$f"; done
cat ../stmt.js   # the old app's statement reader, reused as is (statements lane)
cat ../engine/sync.js ../store/pack.js   # backup and cloud lane (guard and persist come with STORE)
echo '</script>'
echo '<script>'
echo '(function () {'
echo "'use strict';"
echo 'const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];'
cat ../art.js ../pixel.js
printf 'const TRY_BOOKS = { mako: '; cat fixtures/mako_madeup_book.json; echo '};'
printf 'const RELAY3 = "%s";\n' "$(tr -d '\n\r\"' < ../RELAY)"   # the site's address, for the cloud copy when opened as a file (backup lane)
cat src/stmt3_read.js src/stmt3_plan.js
cat src/answers3.js   # the one answers-to-book function (BV1): before setup3 and the chat
cat src/money3.js src/e3.js src/act3.js src/plan3_write.js src/endperiod3.js src/home3.js src/checkin3.js src/receipts3.js src/plan3.js src/setup3.js src/backup3.js src/cloud3.js src/cloud3_page.js src/settings3.js src/settings3_sw.js src/start3.js
cat src/stmt3_ai.js src/stmt3.js   # statements lane
cat src/ask3_core.js   # the summary of today's figures the assistant is sent (chat3_core uses ASK3C.summary); the old Ask sheet (ask3.js) is gone: the header Ask opens the assistant (AI_JOIN_FIXES G)
cat src/chat3_core.js   # the assistant's pure core (lane A, BU1): after ask3_core.js and answers3.js
cat src/chat3.js   # the assistant panel (AI first, lane B)
cat src/remind3.js src/remind3_page.js   # Reminders (ask lane)
cat src/back3.js   # which sheet is open: the back button, typing kept, one message at a time (after every sheet's file)
echo '})();'
echo '</script>'
echo '</body>'
echo '</html>'
} > "$OUT.tmp.$$"; mv "$OUT.tmp.$$" "$OUT"   # in one step: a test reading the page while another builds never sees half a file
wc -c "$OUT"
# the service worker beside it (D6, backup lane): its cache is named by this build, so a new build is a new worker
node make_icons3.js   # the home screen icons beside the page, named in manifest3.webmanifest (M33)
sed "s/@@BUILD@@/$(sha1sum "$OUT" | cut -c1-12)/" src/sw3.js > sw3.js.tmp.$$; mv sw3.js.tmp.$$ sw3.js
