#!/bin/bash
# Assembles the single-file page from parts.
cd "$(dirname "$0")"
{
cat <<'HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>M.H.R.2000 (The Money Headache Remover 2000)</title>
<style>
HEAD
cat style.css
echo '</style>'
echo '</head>'
echo '<body>'
# the version number and stamp live in one place: the VERSION file (two lines: number, then date and time)
VER=$(sed -n 1p VERSION); STAMP=$(sed -n 2p VERSION)
sed -e "s|@@VER@@|$VER|g" -e "s|@@STAMP@@|$STAMP|g" body.html
echo '<script>'
cat model.js
# the site's address for copies opened as a file (RELAY file, one line, may be empty)
RELAY=$( [ -f RELAY ] && sed -n 1p RELAY || echo '' )
cat ui0.js actions.js ui1.js ui2.js ui3.js ui4.js ui44.js ui45s.js ui45u.js ui45x.js ui45t.js ui45.js ui46.js ui47.js ui48.js ui41.js ui42.js ui49.js ui43.js ui6.js ui5.js | sed "s|@@RELAY@@|$RELAY|"
echo '</script>'
echo '</body>'
echo '</html>'
} > ../money-map-team.html
wc -c ../money-map-team.html
