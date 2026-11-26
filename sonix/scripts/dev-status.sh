#!/bin/bash

# dev-status.sh - Check status of DMS Sonix development servers

echo "🔍 Checking DMS Sonix development server status..."
echo ""

# Track if any servers are running
ANY_RUNNING=false

# Check web server (port 3004)
echo "📱 Web Server (port 3004):"
WEB_PID=$(lsof -ti:3004 2>/dev/null)
if [ -n "$WEB_PID" ]; then
    echo "   ✅ Running (PID: $WEB_PID)"
    # Get process details
    ps -p "$WEB_PID" -o pid,ppid,cmd | tail -n +2 | sed 's/^/      /'
    ANY_RUNNING=true
else
    echo "   ⭕ Not running"
fi
echo ""

# Check API server (port 3000)
echo "🔌 API Server (port 3000):"
API_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$API_PID" ]; then
    echo "   ✅ Running (PID: $API_PID)"
    # Get process details
    ps -p "$API_PID" -o pid,ppid,cmd | tail -n +2 | sed 's/^/      /'
    ANY_RUNNING=true
else
    echo "   ⭕ Not running"
fi
echo ""

# Check for any nx dev/serve processes
echo "⚙️  Nx Dev Processes:"
NX_PIDS=$(pgrep -f "nx (serve|dev)" 2>/dev/null)
if [ -n "$NX_PIDS" ]; then
    echo "   ✅ Found nx processes:"
    echo "$NX_PIDS" | while read -r pid; do
        ps -p "$pid" -o pid,ppid,cmd | tail -n +2 | sed 's/^/      /'
    done
    ANY_RUNNING=true
else
    echo "   ⭕ No nx dev/serve processes found"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ANY_RUNNING" = true ]; then
    echo "📊 Summary: Development servers are RUNNING"
    echo ""
    echo "   To stop all servers, run: npm run dev:stop"
else
    echo "📊 Summary: All development servers are STOPPED"
    echo ""
    echo "   To start servers, run:"
    echo "   • npm run dev:all    (both servers)"
    echo "   • npm run dev:web    (web only)"
    echo "   • npm run dev:apis   (APIs only)"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
