#!/bin/bash
# Builds the hosted site from the sources and mirrors the sources into this repo, so the repo is the complete project.
#   src/        the page sources (model, ui files, style, body, build.sh, VERSION, RELAY, main suite, guard and safety tests)
#   pwa/        the installable-app packager and icons
#   tests/      server tests; tests/regression/ holds the older browser scripts (they expect the /tmp paths they were written with)
#   public/     the built site that Cloudflare serves
set -e
cd "$(dirname "$0")"
( cd ../team && ./build.sh >/dev/null )
( cd ../pwa && python3 make_pwa.py >/dev/null )
rm -rf public && mkdir -p public
cp -r ../pwa/dist/. public/
rm -f public/README.md
VER=$(sed -n 1p ../team/VERSION); sed -i "s|^SITE_VERSION = .*|SITE_VERSION = \"$VER\"|" wrangler.toml
mkdir -p src pwa tests/regression
rm -rf src && mkdir -p src && ( cd ../team && tar cf - --exclude node_modules . ) | ( cd src && tar xf - )
cp ../pwa/make_pwa.py ../pwa/*.png ../pwa/*.svg pwa/ 2>/dev/null || true; cp ../pwa/render_icons.js pwa/ 2>/dev/null || true
for d in v22 v25 v26 v27 v28 v29 v30 v31 v32 v33 v34 v35 v36 v37; do mkdir -p tests/regression/$d; cp /tmp/$d/*.js /tmp/$d/*.sh /tmp/$d/*.py tests/regression/$d/ 2>/dev/null || true; done
cp /tmp/team_*.js tests/regression/ 2>/dev/null || true
cp /tmp/wd/rw.py tests/regression/ 2>/dev/null || true
echo "site built: public $(du -sh public | cut -f1); src $(ls src | wc -l) files; regression $(find tests/regression -name '*.js' | wc -l) scripts"
