#!/bin/bash
# Puts the built app3 into the site's public/ folder under a private path (DECISIONS_ROUND2 BG1, BG2).
#   ./publish3.sh <path>        for example  ./publish3.sh n/<long random letters and digits>
# It builds app3, then writes exactly two files: public/<path>/index.html and public/<path>/sw3.js. Nothing else in
# public/ is touched; the old app at the root stays as it is. It deploys nothing: the files go up only when Mako pushes
# to main. Never commit the real path anywhere but in that push.
# - The path: lowercase letters, digits, - and _, at least two parts, the last one at least 16 characters (so nobody
#   guesses it); not under api/ (the worker answers /api/* itself) and not inside a folder the old app uses.
# - sw3.js sits beside the page, so its scope is the path itself, never / (BG2). The old app's worker (scope /) only
#   answers for the path until app3's own worker has installed on the first load; see app3/FOR_MAKO.md for what the old
#   worker would need to never answer at all.
# - The page calls /api/ai and /api/vault on its own address, so they reach the same worker.
# - The published page says noindex (no search engine lists it) and sends no referrer (the path never leaves in a header).
# PUBLIC=<folder> writes somewhere else (the test uses a copy of public/).
set -e
cd "$(dirname "$0")"
P="${1:-}"
PUB="${PUBLIC:-$(cd ../../.. && pwd)/public}"
die() { echo "publish3: $1" >&2; exit 1; }
[[ "$P" =~ ^[a-z0-9][a-z0-9_-]*(/[a-z0-9][a-z0-9_-]*)+$ ]] || die "the path must be lowercase letters, digits, - and _, in at least two parts, like n/<random>"
LAST="${P##*/}"; FIRST="${P%%/*}"
[ ${#LAST} -ge 16 ] || die "the last part of the path must be at least 16 characters, so it cannot be guessed"
case "$FIRST" in api|icons|fonts) die "$FIRST/ belongs to the site or the old app";; esac
[ -d "$PUB" ] || die "no public folder at $PUB"
[ -e "$PUB/$FIRST" ] && [ ! -d "$PUB/$FIRST" ] && die "$FIRST is a file of the old app"
./build3.sh >/dev/null
OUT="$PUB/$P"
mkdir -p "$OUT"
sed 's|<meta charset="utf-8">|<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">\n<meta name="referrer" content="no-referrer">|' index.html > "$OUT/index.html"
cp sw3.js "$OUT/sw3.js"
echo "published app3 to $OUT ($(wc -c < "$OUT/index.html") bytes, worker $(grep -o "burrow3-[0-9a-f]*" "$OUT/sw3.js"))"
