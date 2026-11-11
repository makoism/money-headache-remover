#!/bin/bash
# Ends every local stand-in (the stub and all wrangler/workerd processes) and waits until the ports are free.
pkill -f "[s]tub_anthropic.js" 2>/dev/null; pkill -f "[w]rangler dev" 2>/dev/null; pkill -f "[w]orkerd" 2>/dev/null
for i in $(seq 1 20); do sleep 0.5; (curl -s -m 1 http://127.0.0.1:8788/ >/dev/null 2>&1 || curl -s -m 1 http://127.0.0.1:8789/ >/dev/null 2>&1) || { echo stopped; exit 0; }; done
echo "ports still busy"; exit 1
