#!/bin/bash
# Every proof of the real ledger (wip/team/ledger.js), from any folder. Ends with "LEDGER CORE ALL PASS" or the failing test.
cd "$(dirname "$0")/../.." || exit 1
set -eo pipefail   # pipefail: a failing test must stop this script, also when its output goes through tail
MODEL=tests/next/ledger_core_model.js node tests/next/ledger_conservation.js | tail -2
MODEL=ledger.js node tests/next/ledger_fuzz.js | tail -2
node tests/next/ledger_diff.js "${1:-3000}" | tail -2
node tests/next/ledger_edge.js | tail -2
# the reference must still prove the design
MODEL=tests/next/ledger_ref.js node tests/next/ledger_conservation.js | tail -2
MODEL=tests/next/ledger_ref.js node tests/next/ledger_fuzz.js | tail -2
# the two lanes built on the ledger: the money door, and the move of saved 38.31 copies (wiring_page.js stays out: it fails by
# design until the page is wired; wiring_store.js runs against its sketch until lstore.js exists)
node tests/next/money_door_test.js | tail -4
node tests/next/wiring_migrate.js | tail -2
STORE=tests/next/wiring_store_sketch.js node tests/next/wiring_store.js | tail -2
# no top-level name of ledger.js may already be used by a file build.sh puts in the page
node -e '
const fs=require("fs");const src=fs.readFileSync("ledger.js","utf8");
const names=[...src.matchAll(/^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/gm)].map(m=>m[1]);
const files=(fs.readFileSync("build.sh","utf8").match(/[\w]+\.js/g)||[]).filter((f,i,a)=>a.indexOf(f)===i&&fs.existsSync(f));
let bad=0;for(const f of files){const t=fs.readFileSync(f,"utf8");for(const n of names){if(new RegExp("^(?:const|let|var|function)\\s+"+n.replace("$","\\$")+"\\b","m").test(t)||new RegExp("^(?:const|let|var)\\s[^;\\n]*[,\\s]"+n+"\\s*=","m").test(t)){console.log("NAME CLASH "+n+" in "+f);bad++;}}}
console.log(names.length+" top-level names in ledger.js checked against "+files.length+" page files: "+(bad?bad+" clash":"no clash"));process.exit(bad?1:0)'
echo "LEDGER CORE ALL PASS"
