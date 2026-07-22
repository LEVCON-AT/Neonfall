#!/bin/bash
# Restart the dev server if port 3000 is not listening.
if ! (ss -tln 2>/dev/null || netstat -tln 2>/dev/null) | grep -q ":3000"; then
  cd /home/z/my-project
  pkill -9 -f next-server 2>/dev/null
  pkill -9 -f "bun run dev" 2>/dev/null
  sleep 1
  nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
  disown
fi
