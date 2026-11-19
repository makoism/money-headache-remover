#!/bin/bash
# Runs every script_*.js check (cost rule 3: findings that came back become scripts), one browser at a time, about 3 minutes in all.
# A FAIL listed in script_known.txt is printed as KNOWN and does not fail the run; any other FAIL, a crash or a missing ALL PASS / FAILED
# line does. Run from wip/team:  bash tests/qc/script_run.sh
cd "$(dirname "$0")/../.." || exit 1
BAD=0; KNOWN=tests/qc/script_known.txt
for f in tests/qc/script_words.js tests/qc/script_bad_numbers.js tests/qc/script_two_ways.js tests/qc/script_percents.js tests/qc/script_tap44.js tests/qc/script_contrast.js; do
  OUT=$(timeout 300 node "$f" 2>&1); RC=$?
  P=$(echo "$OUT" | grep -c '^PASS'); NEW=0; K=0
  while IFS= read -r l; do
    if grep -v '^#' "$KNOWN" | grep -v '^$' | while IFS= read -r pat; do echo "$l" | grep -qE "$pat" && echo y; done | grep -q y; then K=$((K+1)); echo "  KNOWN $(echo "$l" | cut -c6-200)"; else NEW=$((NEW+1)); echo "  NEW $(echo "$l" | cut -c1-400)"; fi
  done < <(echo "$OUT" | grep '^FAIL ')
  echo "$OUT" | grep -q "^ALL PASS\|^FAILED" || { echo "  $f did not finish (exit $RC): $(echo "$OUT" | tail -2 | tr '\n' ' ' | cut -c1-300)"; NEW=$((NEW+1)); }
  echo "$f: $P pass, $K known, $NEW new"; [ $NEW -eq 0 ] || BAD=1
done
[ $BAD -eq 0 ] && echo "SCRIPT CHECKS OK (known findings above, see SIDE_A_FINDINGS.md)" || echo "SCRIPT CHECKS FAILED"
exit $BAD
