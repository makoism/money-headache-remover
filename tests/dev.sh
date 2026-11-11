#!/bin/bash
# Starts the local stand-ins for tests: the Anthropic stub (8790) and two wrangler dev servers,
# 8788 (open) and 8789 (with an invite code). Run tests/stop.sh to end them.
cd "$(dirname "$0")/.."
W=/home/claude/work/tools/node_modules/.bin/wrangler
bash tests/stop.sh >/dev/null
STAMP=$(date +%s); WRA=/tmp/v28/wr/$STAMP/a; WRB=/tmp/v28/wr/$STAMP/b; mkdir -p $WRA $WRB
nohup node tests/stub_anthropic.js 8790 > /tmp/v28/stub.log 2>&1 &
CI=1 nohup $W dev -c tests/wrangler.dev.toml --port 8788 --inspector-port 9229 --ip 127.0.0.1 --persist-to $WRA > /tmp/v28/wrA.log 2>&1 &
CI=1 nohup $W dev -c tests/wrangler.invite.toml --port 8789 --inspector-port 9230 --ip 127.0.0.1 --persist-to $WRB > /tmp/v28/wrB.log 2>&1 &
for i in $(seq 1 40); do sleep 1; curl -s -m 2 http://127.0.0.1:8788/api/health >/dev/null 2>&1 && curl -s -m 2 http://127.0.0.1:8789/api/health >/dev/null 2>&1 && { echo "dev servers up"; exit 0; }; done
echo "dev servers did not start"; tail -5 /tmp/v28/wrA.log; exit 1
