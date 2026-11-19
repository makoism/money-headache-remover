#!/bin/bash
# The quick gate to run after EVERY edit to the money code or a screen (about 2 to 3 minutes). It is not the full check; ./check.sh full is.
#   bash tests/verify.sh [golden-baseline.json]
# 1 build + syntax   2 main suite   3 independent oracle   4 model fuzz + debts fuzz   5 the proof (money is conserved)
# 6 screens do no money maths (scanner)   7 golden screens against the baseline, when one is given
cd "$(dirname "$0")/.." || exit 1
BAD=0; say() { echo; echo "== $1"; }
cp tests/qc/real.js /tmp/v39/real.js 2>/dev/null; cp ../../tests/regression/v25/oracle.js /tmp/v25/oracle.js 2>/dev/null
say "build"; ./build.sh || exit 1
node -e "const fs=require('fs');const h=fs.readFileSync('../money-map-team.html','utf8');fs.writeFileSync('/tmp/chk.js',h.slice(h.lastIndexOf('<script>')+8,h.lastIndexOf('</script>')))" && node --check /tmp/chk.js && echo "syntax ok" || { echo "SYNTAX ERROR"; exit 1; }
say "main suite"; OUT=$(node test_team.js 2>&1); echo "$OUT" | grep "^FAIL" | head -8; echo "$OUT" | tail -1; echo "$OUT" | grep -q "^FAIL" && BAD=1
say "independent oracle (a second calculation written apart from the app)"; OUT=$(N=${ORACLE_N:-1500} node /tmp/v25/oracle.js 2>&1); echo "$OUT" | head -6 | cut -c1-220; echo "$OUT" | head -1 | grep -q "mismatches 0$" || BAD=1
say "model fuzz"; OUT=$(node tests/qc/fuzz_model.js ${FUZZ_N:-800} 11 2>&1); echo "$OUT" | grep "^FAIL" | head -5 | cut -c1-220; echo "$OUT" | tail -1; echo "$OUT" | grep -q "FUZZ PASS" || BAD=1
OUT=$(node tests/qc/fuzz_debts.js ${FUZZ_N:-800} 12 2>&1); echo "$OUT" | tail -1; echo "$OUT" | grep -q "DEBTS FUZZ PASS" || BAD=1
if [ -f tests/qc/proof_fuzz.js ]; then say "the proof: money is conserved"; OUT=$(node tests/qc/proof_fuzz.js ${PROOF_N:-600} 21 2>&1); echo "$OUT" | grep "^FAIL" | head -6 | cut -c1-260; echo "$OUT" | tail -1; echo "$OUT" | grep -q "PROOF PASS" || BAD=1; fi
say "launch checklist v1 points on the model"; OUT=$(node tests/qc/v1_model.js 2>&1); echo "$OUT" | grep "^FAIL" | head -6; echo "$OUT" | tail -1; echo "$OUT" | grep -q "V1 MODEL PASS" || BAD=1
say "screens do no money maths"; OUT=$(node tests/qc/display_math.js 2>&1); echo "$OUT" | tail -2
MAX=$(cat tests/qc/display_math.max 2>/dev/null || echo 0); N=$(echo "$OUT" | grep -o "screen maths: [0-9]*" | grep -o "[0-9]*$")
if [ "${N:-999}" -gt "$MAX" ]; then echo "SCREEN MATHS WENT UP: $N open, the limit is $MAX (tests/qc/display_math.max). Move the sum into model.js."; BAD=1; else echo "within the limit ($N of $MAX). The limit only ever goes down; the goal is 0."; fi
if [ -n "$1" ]; then say "golden screens against $1"; OUT=$(timeout 400 node tests/qc/golden_screens.js compare "$1" 2>&1 | grep -v "^\[agent"); echo "$OUT" | tail -${GOLDEN_LINES:-30} | cut -c1-330; echo "$OUT" | grep -q "^PASS no screen changed" || echo "(screens differ: every difference must be one you meant)"; fi
echo; [ $BAD -eq 0 ] && echo "VERIFY OK" || echo "VERIFY FAILED, see above"
exit $BAD
