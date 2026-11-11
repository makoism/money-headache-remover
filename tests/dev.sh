#!/bin/bash
# Starts the local stand-ins for tests: the Anthropic stub (8790) and two wrangler dev servers,
# 8788 (open) and 8789 (with an invite code). Run tests/stop.sh to end them.
cd "$(dirname "$0")/.."
W=/home/claude/work/tools/node_modules/.bin/wrangler
pkill -f "[s]tub_anthropic.js 8790" 2>/dev/null; pkill -f "[w]rangler pages dev public" 2>/dev/null; sleep 1
rm -rf /tmp/v28/wrA /tmp/v28/wrB
nohup node tests/stub_anthropic.js 8790 > /tmp/v28/stub.log 2>&1 &
CI=1 nohup $W pages dev public --port 8788 --inspector-port 9229 --ip 127.0.0.1 --binding ANTHROPIC_API_KEY=test-key ANTHROPIC_BASE_URL=http://127.0.0.1:8790 IP_PER_MINUTE=500 USER_DAILY_CALLS=50 --d1 DB=local --persist-to /tmp/v28/wrA > /tmp/v28/wrA.log 2>&1 &
CI=1 nohup $W pages dev public --port 8789 --inspector-port 9230 --ip 127.0.0.1 --binding ANTHROPIC_API_KEY=test-key ANTHROPIC_BASE_URL=http://127.0.0.1:8790 IP_PER_MINUTE=500 "INVITE_CODES=Mako Rocks, fam" --d1 DB=local --persist-to /tmp/v28/wrB > /tmp/v28/wrB.log 2>&1 &
for i in $(seq 1 30); do sleep 1; curl -s -m 2 http://127.0.0.1:8788/api/health >/dev/null 2>&1 && curl -s -m 2 http://127.0.0.1:8789/api/health >/dev/null 2>&1 && { echo "dev servers up"; exit 0; }; done
echo "dev servers did not start"; tail -5 /tmp/v28/wrA.log; exit 1
