#!/bin/bash
# Ends every local stand-in (the stub and all wrangler/workerd processes) and waits until the ports are free.
# Patterns are anchored to the start of the command line so a shell whose command text mentions these names is never hit.
pkill -f "^node tests/stub_anthropic.js" 2>/dev/null; pkill -f "^node .*wrangler dev -c tests" 2>/dev/null; pkill -f "^/home/claude/work/tools/node_modules/@cloudflare/workerd" 2>/dev/null
for i in $(seq 1 20); do sleep 0.5; (curl -s -m 1 http://127.0.0.1:8788/ >/dev/null 2>&1 || curl -s -m 1 http://127.0.0.1:8789/ >/dev/null 2>&1) || { echo stopped; exit 0; }; done
echo "ports still busy"; exit 1
