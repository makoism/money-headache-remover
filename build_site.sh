#!/bin/bash
# Builds the hosted site from the sources in THIS repo. Needs nothing outside the repo and reads nothing from /tmp.
#   wip/team/   the page sources (model, ui files, style, body, build.sh, VERSION, RELAY)
#   pwa/        the installable-app packager (make_pwa.py) and the icons
#   public/     the built site that Cloudflare serves (also the home of the fonts and the welcome video)
#   src/        a plain copy of wip/team, kept on main so the deployed sources sit next to the deployed page
#
#   ./build_site.sh               build into the repo: public/, src/ and SITE_VERSION in wrangler.toml
#   ./build_site.sh --out DIR     build into DIR instead (DIR/public, DIR/src, DIR/wrangler.toml); the repo is not changed
#
# It never writes to tests/. It deploys nothing and pushes nothing.
# It stops with a message when the built page does not carry the version in wip/team/VERSION,
# or when the page it builds is not the page that was tested (wip/money-map-team.html).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT"
if [ "${1:-}" = "--out" ]; then
  [ -n "${2:-}" ] || { echo "STOP: --out needs a folder"; exit 2; }
  mkdir -p "$2"; OUT="$(cd "$2" && pwd)"
elif [ -n "${1:-}" ]; then
  echo "usage: ./build_site.sh [--out DIR]"; exit 2
fi
stop() { echo "STOP: $*" >&2; exit 1; }

TEAM="$ROOT/wip/team"
[ -f "$TEAM/build.sh" ] && [ -f "$TEAM/VERSION" ] || stop "the page sources are missing (wip/team/build.sh, wip/team/VERSION). Run this on a branch that has wip/team."
[ -f "$ROOT/pwa/make_pwa.py" ] || stop "pwa/make_pwa.py is missing."
for f in hello.mp4 hello-av1.mp4 hello.jpg; do [ -f "$ROOT/public/$f" ] || stop "public/$f is missing (the welcome video lives in public/)."; done
ls "$ROOT"/public/fonts/*.woff2 >/dev/null 2>&1 || stop "public/fonts has no fonts (they live in public/fonts)."
VER="$(sed -n 1p "$TEAM/VERSION" | tr -d '[:space:]')"
[ -n "$VER" ] || stop "wip/team/VERSION has no version on its first line."

# Everything is assembled in a scratch folder of its own, removed at the end. Nothing is built in place.
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/burrow_build.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT
W="$STAGE/work"
mkdir -p "$W/team" "$W/pwa" "$W/hello" "$W/fonts"

# 1. the page, built from a copy of the sources (build.sh writes ../money-map-team.html beside its own folder)
( cd "$TEAM" && tar cf - --exclude=node_modules --exclude=tests . ) | ( cd "$W/team" && tar xf - )
( cd "$W/team" && bash ./build.sh >/dev/null ) || stop "wip/team/build.sh failed."
PAGE="$W/money-map-team.html"
[ -s "$PAGE" ] || stop "wip/team/build.sh made no page."
if [ -f "$ROOT/wip/money-map-team.html" ] && ! cmp -s "$PAGE" "$ROOT/wip/money-map-team.html"; then
  stop "the page built from wip/team is not the same as wip/money-map-team.html. The checks ran on that file, so it is stale or the sources changed after the checks. Run wip/team/build.sh, rerun the checks, commit, then build again."
fi

# 2. the installable app. make_pwa.py was written for one fixed folder; it runs here on a copy pointed at the scratch folder.
cp "$ROOT"/pwa/*.png "$ROOT"/pwa/*.svg "$ROOT"/pwa/favicon.ico "$W/pwa/"
cp "$ROOT"/public/hello.mp4 "$ROOT"/public/hello-av1.mp4 "$ROOT"/public/hello.jpg "$W/hello/"
cp "$ROOT"/public/fonts/* "$W/fonts/"
grep -q "/home/claude/work" "$ROOT/pwa/make_pwa.py" || stop "pwa/make_pwa.py no longer uses /home/claude/work, so this script cannot point it at the scratch folder. Update build_site.sh to match."
sed "s|/home/claude/work|$W|g" "$ROOT/pwa/make_pwa.py" > "$W/pwa/make_pwa.py"
( cd "$W/pwa" && python3 make_pwa.py >/dev/null ) || stop "pwa/make_pwa.py failed."
DIST="$W/pwa/dist"
rm -f "$DIST/README.md"
[ -s "$DIST/index.html" ] && [ -s "$DIST/sw.js" ] && [ -s "$DIST/manifest.webmanifest" ] || stop "the app package is incomplete (index.html, sw.js or manifest.webmanifest missing)."

# 3. the version stamp on the built page must be the one in wip/team/VERSION, and no placeholder may be left
grep -q '@@VER@@\|@@STAMP@@' "$DIST/index.html" && stop "the built page still has an unfilled @@VER@@ or @@STAMP@@."
SEEN="$(grep -o 'id="verFoot">Version [^<]*<' "$DIST/index.html" | head -1 | sed 's/.*Version //; s/<$//')"
[ "$SEEN" = "$VER" ] || stop "version stamp mismatch: the built page says \"${SEEN:-nothing}\", wip/team/VERSION says \"$VER\". Nothing was written."
N_OTHER="$(grep -o 'Version [0-9][0-9.]*<' "$DIST/index.html" | grep -vc "Version $VER<" || true)"
[ "$N_OTHER" = "0" ] || stop "the built page shows a version other than $VER in $N_OTHER place(s). Nothing was written."

# 4. write the result. public/ and src/ are replaced whole; tests/ is never touched.
mkdir -p "$STAGE/new"
cp -r "$DIST" "$STAGE/new/public"
mkdir -p "$STAGE/new/src"
( cd "$TEAM" && tar cf - --exclude=node_modules . ) | ( cd "$STAGE/new/src" && tar xf - )
sed "s|^SITE_VERSION = .*|SITE_VERSION = \"$VER\"|" "$ROOT/wrangler.toml" > "$STAGE/new/wrangler.toml"
grep -q "^SITE_VERSION = \"$VER\"$" "$STAGE/new/wrangler.toml" || stop "wrangler.toml has no SITE_VERSION line to set."

rm -rf "$OUT/public" "$OUT/src"
cp -r "$STAGE/new/public" "$OUT/public"
cp -r "$STAGE/new/src" "$OUT/src"
cp "$STAGE/new/wrangler.toml" "$OUT/wrangler.toml"

echo "site built: version $VER into $OUT; public $(du -sh "$OUT/public" | cut -f1), $(find "$OUT/public" -type f | wc -l) files; src $(find "$OUT/src" -type f | wc -l) files"
