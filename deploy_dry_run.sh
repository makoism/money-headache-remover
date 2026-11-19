#!/bin/bash
# Deploy dry run. Shows what a deploy would do, and checks the built site, without changing anything.
#   ./deploy_dry_run.sh            scratch folder is made for you and its path is printed
#   ./deploy_dry_run.sh DIR        use DIR as the scratch folder (it is emptied first)
#
# What it does, in order:
#   1. builds the site into the scratch folder with build_site.sh --out (the repo's public/, src/ and wrangler.toml are not changed)
#   2. lists the files a deploy commit to main would change, against origin/main
#   3. checks the service worker and the installable-app files agree with each other
#   4. opens the built page in Chromium: right version stamp, no console errors, works offline
# It never pushes, never commits, never switches branch, never runs wrangler. It reads origin/main with one git fetch.
# The last line is "DRY RUN OK" or "DRY RUN FAILED", and the exit code matches.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [ -n "${1:-}" ]; then
  [ -e "$1/.git" ] && { echo "STOP: the scratch folder must not be a git repo."; exit 2; }
  rm -rf "$1"; mkdir -p "$1"; S="$(cd "$1" && pwd)"
  case "$S/" in "$ROOT"/*) echo "STOP: the scratch folder must be outside the repo."; exit 2;; esac
else
  S="$(mktemp -d "${TMPDIR:-/tmp}/burrow_dryrun.XXXXXX")"
fi
BAD=0
pass() { echo "  PASS  $*"; }
fail() { echo "  FAIL  $*"; BAD=1; }
note() { echo "  note  $*"; }
finish() { echo; if [ "$BAD" = 0 ]; then echo "Scratch folder: $S"; echo "DRY RUN OK"; exit 0; else echo "Scratch folder: $S"; echo "DRY RUN FAILED"; exit 1; fi; }

VER="$(sed -n 1p wip/team/VERSION 2>/dev/null | tr -d '[:space:]')"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Deploy dry run: version ${VER:-?} from branch $BRANCH at $(git rev-parse --short HEAD)"
echo

# ---------- 1. build ----------
echo "1. Build into the scratch folder"
[ -z "$(git status --porcelain)" ] || note "there are uncommitted changes. The build uses the files on disk; the diff below uses the last commit."
BEFORE="$(git status --porcelain)"
if ./build_site.sh --out "$S/out" > "$S/build.log" 2>&1; then pass "$(tail -1 "$S/build.log" | sed "s|$S/out|the scratch folder|")"; else fail "build_site.sh stopped:"; sed 's/^/        /' "$S/build.log"; finish; fi
[ "$(git status --porcelain)" = "$BEFORE" ] && pass "the build changed nothing in the repo" || fail "the build changed files in the repo"

# ---------- 2. what a deploy commit would change ----------
echo
echo "2. What a deploy to main would change"
if git fetch -q origin main 2>"$S/fetch.log"; then MAIN=origin/main; else MAIN=""; fail "could not fetch origin/main: $(head -1 "$S/fetch.log")"; fi
# The deploy tree is this branch's last commit with public/, src/ and wrangler.toml replaced by the build.
# It is made with a throwaway index, so the real index, the branch and the files on disk stay as they are.
export GIT_INDEX_FILE="$S/index"
git read-tree HEAD
git --work-tree="$S/out" add -A -- public src wrangler.toml 2>/dev/null
TREE="$(git write-tree)"
unset GIT_INDEX_FILE
git diff --name-status HEAD "$TREE" > "$S/build_commit_files.txt"
echo "  The build commit (on top of $BRANCH) would change $(wc -l < "$S/build_commit_files.txt") files:"
cut -f2 "$S/build_commit_files.txt" | awk -F/ '{print (NF>1 ? $1"/" : $1)}' | sort | uniq -c | sed 's/^/     /'
if grep -q "	tests/" "$S/build_commit_files.txt"; then fail "the build would change files under tests/"; else pass "nothing under tests/ is changed by the build"; fi
if [ -n "$MAIN" ]; then
  echo "  main is at $(git log -1 --format='%h %s' $MAIN | cut -c1-110)"
  if git merge-base --is-ancestor $MAIN HEAD 2>/dev/null; then pass "main is behind this branch in a straight line ($(git rev-list --count $MAIN..HEAD) commits), so the merge has no conflicts"
  else fail "main has commits this branch does not have (or history is cut short: try git fetch --unshallow). Merge main into the release branch and rerun the checks first."; fi
  git diff --name-status $MAIN "$TREE" > "$S/deploy_files.txt"
  git diff --stat $MAIN "$TREE" > "$S/deploy_stat.txt"
  echo "  Against origin/main the deploy would change $(wc -l < "$S/deploy_files.txt") files ($(tail -1 "$S/deploy_stat.txt" | sed 's/^ *//')):"
  cut -f2 "$S/deploy_files.txt" | awk -F/ '{print (NF>1 ? $1"/" : $1)}' | sort | uniq -c | sed 's/^/     /'
  echo "  The files Cloudflare serves or runs (public/, worker/, functions/, wrangler.toml):"
  grep -E "	(public/|worker/|functions/|wrangler\.toml)" "$S/deploy_files.txt" | sed 's/^/     /' || echo "     none"
  echo "  Full lists: $S/deploy_files.txt and $S/deploy_stat.txt"
  LIVE="$(git show $MAIN:wrangler.toml 2>/dev/null | sed -n 's/^SITE_VERSION = "\(.*\)"/\1/p')"
  echo "  Version on main now: ${LIVE:-unknown}. Version after the deploy: $VER."
  [ "$LIVE" != "$VER" ] || fail "main already says version $VER. Bump wip/team/VERSION for a new deploy."
fi

# ---------- 3. service worker and installable-app files ----------
echo
echo "3. Service worker and installable-app files"
python3 - "$S/out" "$VER" <<'PY'
import sys, os, re, json, hashlib, struct
out, ver = sys.argv[1], sys.argv[2]
pub = os.path.join(out, 'public'); bad = 0
def ok(name, cond, extra=''):
    global bad
    print(('  PASS  ' if cond else '  FAIL  ') + name + ((' (' + extra + ')') if extra and not cond else ''))
    if not cond: bad = 1
def has(p): return os.path.isfile(os.path.join(pub, p))
html = open(os.path.join(pub, 'index.html'), encoding='utf8').read()
sw = open(os.path.join(pub, 'sw.js'), encoding='utf8').read()
# service worker
m = re.search(r"const CACHE = 'money-headache-([0-9a-f]+)'", sw)
want = hashlib.sha256(html.encode('utf8')).hexdigest()[:10]
ok('sw.js cache name is made from this exact page', bool(m) and m.group(1) == want, 'sw.js has %s, page gives %s' % (m.group(1) if m else 'none', want))
old = ''
try:
    import subprocess
    old = subprocess.run(['git', 'show', 'origin/main:public/sw.js'], capture_output=True, text=True).stdout
except Exception: pass
mo = re.search(r"money-headache-([0-9a-f]+)", old)
ok('sw.js cache name differs from the one on main, so installed copies update', bool(m) and (not mo or mo.group(1) != m.group(1)))
fm = re.search(r"const FILES = \[(.*?)\];", sw, re.S)
files = re.findall(r"'([^']+)'", fm.group(1)) if fm else []
missing = [f for f in files if f != './' and not has(f)]
ok('every file the service worker saves for offline exists (%d files)' % len(files), bool(files) and not missing, 'missing: ' + ', '.join(missing))
ok("the service worker saves the page itself ('./' and index.html)", './' in files and 'index.html' in files)
ok('index.html registers sw.js', "serviceWorker.register('sw.js')" in html)
# manifest
try: man = json.load(open(os.path.join(pub, 'manifest.webmanifest'), encoding='utf8'))
except Exception as e: man = None
ok('manifest.webmanifest is valid', isinstance(man, dict))
if man:
    ok('manifest has the name, a start address, a scope and standalone display', man.get('name') == 'the burrow' and man.get('start_url') == './' and man.get('scope') == './' and man.get('display') == 'standalone')
    def png_size(p):
        with open(os.path.join(pub, p), 'rb') as f:
            h = f.read(24)
        return '%dx%d' % struct.unpack('>II', h[16:24]) if h[:8] == b'\x89PNG\r\n\x1a\n' else 'not a png'
    icons = man.get('icons', []); wrong = []
    for ic in icons:
        if not has(ic['src']): wrong.append(ic['src'] + ' missing')
        elif png_size(ic['src']) != ic['sizes']: wrong.append('%s is %s, manifest says %s' % (ic['src'], png_size(ic['src']), ic['sizes']))
    sizes = {ic.get('sizes') for ic in icons}
    ok('manifest icons exist at the sizes they claim, with 192, 512 and a maskable one', not wrong and {'192x192', '512x512'} <= sizes and any(ic.get('purpose') == 'maskable' for ic in icons), '; '.join(wrong))
    not_cached = [ic['src'] for ic in icons if ic['src'] not in files]
    ok('the service worker saves the manifest and its icons', 'manifest.webmanifest' in files and not not_cached, 'not saved: ' + ', '.join(not_cached))
# what the page links to
head = html.split('</head>')[0]
refs = set(re.findall(r'<link[^>]+href="([^"]+)"', head))
local = [r for r in refs if not re.match(r'^(https?:|data:|//)', r)]
gone = [r for r in local if not has(r)]
ok('every file the page head links to exists (%d links)' % len(local), bool(local) and not gone, 'missing: ' + ', '.join(gone))
ok('the page links the manifest and the home screen icon', 'manifest.webmanifest' in refs and 'icons/apple-touch-icon.png' in refs)
ok('the welcome video and its cover are there', all(has(f) for f in ('hello.mp4', 'hello-av1.mp4', 'hello.jpg')))
ok('the page plays the video from its own folder', "const HELLO_FILE = 'hello.mp4';" in html)
ok('no README.md in public/', not has('README.md'))
big = []
for root, _, fs in os.walk(pub):
    for f in fs:
        n = os.path.getsize(os.path.join(root, f))
        if n > 25 * 1024 * 1024: big.append('%s %.1f MB' % (f, n / 1048576))
ok('no file is over 25 MB (the Cloudflare limit for one file)', not big, ', '.join(big))
# version in the three places it lives
stamps = set(re.findall(r'Version ([0-9][0-9.]*)<', html))
ok('the page shows version %s and no other' % ver, stamps == {ver}, 'found: ' + ', '.join(sorted(stamps)))
wr = open(os.path.join(out, 'wrangler.toml'), encoding='utf8').read()
ok('wrangler.toml SITE_VERSION is %s' % ver, ('SITE_VERSION = "%s"' % ver) in wr)
sv = open(os.path.join(out, 'src', 'VERSION')).read().split('\n')[0].strip()
ok('src/VERSION is %s' % ver, sv == ver)
sys.exit(bad)
PY
[ $? = 0 ] || BAD=1

# ---------- 4. the page in Chromium ----------
echo
echo "4. The built page in Chromium"
PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')"
( cd "$S/out/public" && exec python3 -m http.server "$PORT" --bind 127.0.0.1 >"$S/http.log" 2>&1 ) &
HTTP_PID=$!
trap 'kill $HTTP_PID 2>/dev/null' EXIT
for i in $(seq 1 30); do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 0.2; done
cat > "$S/browser_check.js" <<'JS'
// Opens the built page from a plain local file server. There is no /api here, so a 404 from /api/ is expected and not counted.
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('  FAIL  Playwright is not installed here, so the page could not be opened'); process.exit(1); }
const [port, ver, shot] = process.argv.slice(2);
const base = 'http://127.0.0.1:' + port + '/';
let bad = 0;
const ok = (name, cond, extra) => { console.log((cond ? '  PASS  ' : '  FAIL  ') + name + (!cond && extra ? ' (' + extra + ')' : '')); if (!cond) bad = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [], failed = [], outside = [];
  const isApi = u => u.startsWith(base + 'api/');
  page.on('pageerror', e => errors.push('page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') { const u = (m.location() || {}).url || ''; if (!isApi(u)) errors.push('console: ' + m.text() + (u ? ' [' + u + ']' : '')); } });
  page.on('requestfailed', r => { if (!/\.mp4$/.test(r.url()) && !/^(blob|data):/.test(r.url())) failed.push(r.url() + ' ' + ((r.failure() || {}).errorText || '')); });
  page.on('response', r => { const u = r.url(); if (r.status() >= 400 && !isApi(u)) failed.push(u + ' ' + r.status()); });
  page.on('request', r => { const u = r.url(); if (!u.startsWith(base) && !/^(data|blob):/.test(u)) outside.push(u); });

  const res = await page.goto(base, { waitUntil: 'load' });
  ok('the page loads', !!res && res.status() === 200);
  await wait(2500);
  ok('the title is "the burrow"', (await page.title()) === 'the burrow');
  const foot = await page.evaluate(() => { const e = document.querySelector('#verFoot'); return e ? e.textContent.trim() : ''; });
  ok('the version stamp on the page is ' + ver, foot === 'Version ' + ver, 'the page says "' + foot + '"');
  const helpVer = await page.evaluate(() => [...document.querySelectorAll('.help-ver')].map(e => e.textContent.trim()).join('|'));
  ok('the Help version line agrees', helpVer === 'Version ' + ver, 'it says "' + helpVer + '"');
  const visible = await page.evaluate(() => document.body.innerText.trim().length);
  ok('the page shows something (' + visible + ' characters of text)', visible > 50);
  await page.screenshot({ path: shot });

  const sw = await page.evaluate(async () => {
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 15000))]);
    if (!reg) return null;
    for (let i = 0; i < 60 && !(reg.active && reg.active.state === 'activated'); i++) await new Promise(r => setTimeout(r, 250));
    const src = await (await fetch('sw.js', { cache: 'no-store' })).text();
    const name = (src.match(/const CACHE = '([^']+)'/) || [])[1];
    const list = ((src.match(/const FILES = \[(.*?)\];/s) || [])[1] || '').match(/'[^']+'/g).map(s => s.slice(1, -1));
    const keys = await caches.keys();
    const cache = await caches.open(name);
    const missing = [];
    for (const f of list) if (!(await cache.match(f))) missing.push(f);
    return { state: reg.active && reg.active.state, name, keys, count: list.length, missing };
  });
  ok('the service worker installs and becomes active', !!sw && sw.state === 'activated');
  if (sw) {
    ok('the browser holds one offline copy, named as sw.js says', sw.keys.length === 1 && sw.keys[0] === sw.name, 'copies: ' + sw.keys.join(', '));
    ok('all ' + sw.count + ' offline files were saved', sw.missing.length === 0, 'not saved: ' + sw.missing.join(', '));
  }
  try {
    const cdp = await ctx.newCDPSession(page);
    const man = await cdp.send('Page.getAppManifest');
    ok('Chromium reads the manifest with no errors', !!man.data && (man.errors || []).length === 0, JSON.stringify(man.errors));
    const inst = await cdp.send('Page.getInstallabilityErrors');
    const errs = (inst.installabilityErrors || []).map(e => e.errorId);
    ok('Chromium finds nothing blocking install', errs.length === 0, errs.join(', '));
  } catch (e) { console.log('  note  could not ask Chromium about install: ' + e.message.split('\n')[0]); }

  // offline: reload with the network cut. The page must come from the service worker with the same stamp.
  await page.reload({ waitUntil: 'load' }); await wait(800);
  const errorsOnline = errors.slice(), failedOnline = failed.slice();   // what went wrong while the network was on
  await ctx.setOffline(true);
  let offFoot = '';
  try { await page.reload({ waitUntil: 'load' }); await wait(1200); offFoot = await page.evaluate(() => { const e = document.querySelector('#verFoot'); return e ? e.textContent.trim() : ''; }); } catch (e) { offFoot = 'did not load: ' + e.message.split('\n')[0]; }
  ok('with no network the page still opens, same version', offFoot === 'Version ' + ver, offFoot);
  await ctx.setOffline(false);

  // the welcome video is never saved for offline, so failures after the cut are expected; only those before it count
  ok('no console errors or page errors', errorsOnline.length === 0, errorsOnline.slice(0, 6).join(' || '));
  ok('no file failed to load', failedOnline.length === 0, failedOnline.slice(0, 6).join(' || '));
  const uniq = [...new Set(outside.map(u => { try { return new URL(u).origin; } catch (e) { return u; } }))];
  ok('the page asked no outside address for anything', uniq.length === 0, uniq.join(', '));
  await browser.close();
  process.exit(bad);
})().catch(e => { console.log('  FAIL  the browser check crashed: ' + e.message.split('\n')[0]); process.exit(1); });
JS
# run from the scratch folder: node finds the pre-installed Playwright from anywhere, and no repo file is in the way
( cd "$S" && timeout 180 node "$S/browser_check.js" "$PORT" "$VER" "$S/page.png" )
[ $? = 0 ] || BAD=1
kill $HTTP_PID 2>/dev/null
[ -f "$S/page.png" ] && echo "  Picture of the page at phone size: $S/page.png"
[ -z "$(git status --porcelain)" ] || [ "$(git status --porcelain)" = "$BEFORE" ] || { fail "the repo changed during the dry run"; }
finish
