#!/bin/bash
# Builds app3/index.html: slice 1 of the new engine as its own small page (DECISIONS_ROUND2 AZ1).
# It reuses, copied in at build time and never edited: the style tokens of ../style.css (the :root palettes only),
# ../art.js and ../pixel.js, the engine (../engine/) and the shared screen pieces (../screens/). The old app is not touched.
cd "$(dirname "$0")" || exit 1
ENGINE="dates.js units.js ids.js schedules.js ledger.js lookahead.js"
SCREENS="money.js names.js status.js inputs.js provenance.js messages.js"
OUT=index.html
{
cat <<'HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>the burrow (new engine, try)</title>
<link rel="icon" href="data:,">
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
echo '</script>'
echo '<script>'
echo '(function () {'
echo "'use strict';"
echo 'const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];'
cat ../art.js ../pixel.js
printf 'const TRY_BOOKS = { mako: '; cat fixtures/mako_madeup_book.json; echo '};'
cat src/checkin_write.js src/money3.js src/e3.js src/home3.js src/checkin3.js src/start3.js
echo '})();'
echo '</script>'
echo '</body>'
echo '</html>'
} > "$OUT"
wc -c "$OUT"
