#!/bin/bash
# Rebuilds everything the checks need on a fresh machine or a fresh cloud session. Safe to run again at any time.
#   bash tests/setup_env.sh        (from wip/team, or from anywhere)
# The older check scripts were written against fixed paths (/home/claude/work, /tmp/vNN, /tmp/team_*.js).
# Those paths vanish when a session ends, so this script recreates them FROM THE REPO. Nothing a check needs may live only in /tmp.
set -e
TEAM="$(cd "$(dirname "$0")/.." && pwd)"          # .../wip/team
REPO="$(cd "$TEAM/../.." && pwd)"
WORK=/home/claude/work
mkdir -p "$WORK/tools"
# 1. the working folder the scripts expect: links, never copies, so a check can never read an old build
ln -sfn "$TEAM" "$WORK/team"
ln -sfn "$TEAM/../money-map-team.html" "$WORK/money-map-team.html"
mkdir -p "$WORK/pwa" && cp -r "$REPO/pwa/." "$WORK/pwa/"
[ -d "$REPO/public/fonts" ] && { mkdir -p "$WORK/fonts"; cp -r "$REPO/public/fonts/." "$WORK/fonts/"; } || true
# 2. the browser driver
if [ ! -d "$WORK/tools/node_modules/puppeteer-core" ]; then ( cd "$WORK/tools" && { [ -f package.json ] || npm init -y >/dev/null 2>&1; } && npm i puppeteer-core acorn acorn-walk >/dev/null 2>&1 ); fi
[ -d "$WORK/tools/node_modules/acorn" ] || ( cd "$WORK/tools" && npm i acorn acorn-walk >/dev/null 2>&1 )
# 3. a Chrome at the path the scripts use
if [ ! -x /usr/bin/google-chrome ]; then
  CH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome 2>/dev/null | tail -1)
  [ -z "$CH" ] && CH=$(python3 -c "from playwright.sync_api import sync_playwright as s
with s() as p: print(p.chromium.executable_path)" 2>/dev/null || true)
  [ -n "$CH" ] && ln -sf "$CH" /usr/bin/google-chrome
fi
# 4. the helper scripts at their old /tmp addresses, taken from the repo
for d in "$REPO"/tests/regression/v*/; do n=$(basename "$d"); mkdir -p "/tmp/$n"; cp -r "$d". "/tmp/$n/" 2>/dev/null || true; done
cp "$REPO"/tests/regression/team_*.js /tmp/ 2>/dev/null || true
mkdir -p /tmp/v39 /tmp/wd /tmp/qlogs
cp "$TEAM/tests/qc/real.js" /tmp/v39/real.js
cp "$TEAM/tests/safe.js" /tmp/v28/safe.js 2>/dev/null || true
cp "$REPO/tests/regression/rw.py" /tmp/wd/rw.py 2>/dev/null || true
echo "setup ok: chrome $( [ -x /usr/bin/google-chrome ] && echo yes || echo MISSING ), puppeteer $( [ -d "$WORK/tools/node_modules/puppeteer-core" ] && echo yes || echo MISSING ), page $( [ -f "$WORK/money-map-team.html" ] && echo linked || echo MISSING )"
