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
# the welcome video and its cover: the installable-app build (pwa/make_pwa.py) copies them from here
mkdir -p "$WORK/hello" && cp "$REPO"/public/hello.mp4 "$REPO"/public/hello-av1.mp4 "$REPO"/public/hello.jpg "$WORK/hello/"
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
# 5. fixtures: old released builds for the upgrade test, rebuilt from git history (never kept only in /tmp)
mkdir -p /tmp/v35/old; OLDN=0; OLDBAD=0
while read -r ver sha; do
  case "$ver" in ''|\#*) continue;; esac
  out="/tmp/v35/old/v$ver.html"; [ -s "$out" ] && { OLDN=$((OLDN+1)); continue; }
  git -C "$REPO" cat-file -e "$sha^{commit}" 2>/dev/null || git -C "$REPO" fetch -q --depth=1 origin "$sha" 2>/dev/null || true
  if git -C "$REPO" show "$sha:public/index.html" > "$out" 2>/dev/null && [ -s "$out" ]; then OLDN=$((OLDN+1)); else rm -f "$out"; OLDBAD=$((OLDBAD+1)); fi
done < "$TEAM/tests/fixtures/old_builds.txt"
# a made-up e-wallet workbook for tests/page_import.js (four rows of October 2026, closing balance 3,850; no real figures).
# Written with python's zipfile only, so nothing has to be installed. Dates and words are text cells, amounts are numbers.
mkdir -p /tmp/v28 && python3 - <<'PYEOF'
import zipfile
rows = [("Date", "Description", "Debit", "Credit", "Balance"),
        ("2026-10-01", "CASH IN VIA BPI ONLINE", None, 2000, 3530),
        ("2026-10-03", "GRAB PHILIPPINES", 180, None, 3350),
        ("2026-10-18", "CASH IN VIA BPI ONLINE", None, 300, 3650),
        ("2026-10-27", "REFUND FROM LAZADA", None, 200, 3850)]
def cell(c, r, v):
    ref = "ABCDE"[c] + str(r)
    if v is None: return ""
    if isinstance(v, str): return '<c r="%s" t="inlineStr"><is><t>%s</t></is></c>' % (ref, v)
    return '<c r="%s"><v>%s</v></c>' % (ref, v)
sheet = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + "".join(
    '<row r="%d">%s</row>' % (i + 1, "".join(cell(c, i + 1, v) for c, v in enumerate(row))) for i, row in enumerate(rows)) + '</sheetData></worksheet>'
z = zipfile.ZipFile("/tmp/v28/wallet.xlsx", "w", zipfile.ZIP_DEFLATED)
z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
z.writestr("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Wallet" sheetId="1" r:id="rId1"/></sheets></workbook>')
z.writestr("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
z.writestr("xl/worksheets/sheet1.xml", sheet)
z.close()
PYEOF
# saved copies from older builds (for team_cur.js), kept in the repo
for f in "$TEAM"/tests/fixtures/*.json; do [ -f "$f" ] && cp "$f" /tmp/; done
echo "setup ok: chrome $( [ -x /usr/bin/google-chrome ] && echo yes || echo MISSING ), puppeteer $( [ -d "$WORK/tools/node_modules/puppeteer-core" ] && echo yes || echo MISSING ), page $( [ -f "$WORK/money-map-team.html" ] && echo linked || echo MISSING ), old builds $OLDN$( [ $OLDBAD -gt 0 ] && echo " ($OLDBAD MISSING)" )"
