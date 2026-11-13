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
<title>The Burrow</title>
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
cat model.js stmt.js
# the site's address for copies opened as a file (RELAY file, one line, may be empty)
RELAY=$( [ -f RELAY ] && sed -n 1p RELAY || echo '' )
cat ui0.js art.js pixel.js actions.js ui1.js ui2.js ui3.js world.js ui4.js ui44.js ui45s.js ui45u.js ui45v.js ui45c.js ui45x.js music.js realm.js sprites.js life.js ambient.js vgfx.js vista.js vcommon.js lifekit.js nook.js nook2.js forest.js nook_realm.js den.js vs_wood_forest.js vs_chiba.js vs_sea.js vs_shire_forest.js vs_extra.js vs_crystal_forest.js vs_dream.js scene.js card.js dj.js ui45t.js ui45.js ui46.js ui4a.js ui47.js ui48.js ui41.js ui4b.js ui42.js ui49.js ui43.js ui6.js ui5.js | sed "s|@@RELAY@@|$RELAY|"
echo '</script>'
echo '</body>'
echo '</html>'
} > ../money-map-team.html
wc -c ../money-map-team.html
