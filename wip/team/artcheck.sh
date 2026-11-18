#!/bin/bash
# art check: colours against pal.js, sprite colour counts, no smooth gradients or blur in art files. see ART_GUIDE.md section 12
cd "$(dirname "$0")" && ./build.sh >/dev/null 2>&1 && node artcheck_dump.js >/dev/null && python3 artcheck_report.py
