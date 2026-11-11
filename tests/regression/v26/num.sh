#!/bin/bash
cd /tmp/v25
echo "== viewtest"; N=1500 SEED=31 timeout 500 node viewtest.js 2>&1 | tail -3
echo "== oracle"; timeout 300 node oracle.js 2>&1 | tail -3
echo "== display"; N=20 SEED=41 timeout 500 node display.js 2>&1 | tail -4
echo "== monkey"; SEED=51 timeout 500 node monkey.js 2>&1 | tail -4
echo "== backup"; timeout 300 node backup.js 2>&1 | tail -3
echo "== contrast"; timeout 400 node contrast.js 2>&1 | tail -12
echo "== dl"; timeout 200 node dl.js 2>&1 | tail -3
echo NUMDONE
