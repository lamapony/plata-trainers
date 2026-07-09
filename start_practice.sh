#!/usr/bin/env bash
# Platå Danish practice local hub launcher

set -eo pipefail

echo "⛰ Platå Danish Practice Hub Launcher"
echo "======================================"
echo "This script starts a local practice server and opens the selected trainer."
echo ""

# Check if python3 is available
if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is not installed. Please install Python 3 to run Platå locally."
  exit 1
fi

PORT=8000
LOG_FILE="daily_practice_log.txt"

# Check if port 8000 is already in use
if lsof -i :$PORT -t &>/dev/null || nc -z localhost $PORT &>/dev/null; then
  echo "Local server is already running on port $PORT."
  SERVER_PID=""
else
  echo "Starting python3 HTTP server on port $PORT in the background..."
  python3 -m http.server $PORT >/dev/null 2>&1 &
  SERVER_PID=$!
  trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
  sleep 1 # Allow server to start up
  echo "Server started with PID $SERVER_PID."
fi

if [ -f "$LOG_FILE" ]; then
  echo ""
  echo "Your recent practice history:"
  echo "----------------------------------------------"
  tail -n 5 "$LOG_FILE" | while read -r line; do
    echo "  $line"
  done
  echo "======================================"
fi

echo ""
echo "Please choose what you want to practice today:"
echo "----------------------------------------------"
echo "1) Open Dashboard (Coach Recommendations - Recommended!)"
echo "2) Bøjning Drill (Verb conjugations & noun inflections)"
echo "3) Ordstilling Drill (V2 & subordinate clause word order)"
echo "4) Register Drill (Workplace tone & polite escalation)"
echo "5) Vocab SR (Spaced-repetition vocabulary DA ↔ RU)"
echo "6) Skriveøvelser (Short written production prompts)"
echo "7) Run Local Quality & Health Checks (npm run check)"
echo "8) Exit Launcher (Stops the local server if it was started by this script)"
echo ""

read -rp "Enter choice [1-8]: " choice

URL=""
CHOICE_NAME=""
case $choice in
  1) URL="http://localhost:$PORT/dashboard.html"; CHOICE_NAME="Dashboard" ;;
  2) URL="http://localhost:$PORT/bojning-drill/"; CHOICE_NAME="Bøjning Drill" ;;
  3) URL="http://localhost:$PORT/ordstilling-drill/"; CHOICE_NAME="Ordstilling Drill" ;;
  4) URL="http://localhost:$PORT/register-drill/"; CHOICE_NAME="Register Drill" ;;
  5) URL="http://localhost:$PORT/vocab-sr/"; CHOICE_NAME="Vocab SR" ;;
  6) URL="http://localhost:$PORT/skrive-drill/"; CHOICE_NAME="Skriveøvelser" ;;
  7)
    echo "Running npm run check..."
    npm run check
    exit 0
    ;;
  8)
    echo "Farvel! Keep up the practice habit."
    exit 0
    ;;
  *)
    echo "Invalid choice. Opening default Dashboard..."
    URL="http://localhost:$PORT/dashboard.html"
    CHOICE_NAME="Dashboard (Default)"
    ;;
esac

# Log the practice session
if [ -n "$CHOICE_NAME" ]; then
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  echo "$TIMESTAMP - Started: $CHOICE_NAME" >> "$LOG_FILE"
fi

echo ""
echo "Opening $URL in your browser..."

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  if command -v xdg-open &>/dev/null; then
    xdg-open "$URL"
  else
    echo "Browser opened. Please go to $URL"
  fi
elif [[ "$OSTYPE" == "cygwin" || "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  start "$URL"
else
  # Fallback for WSL or others
  if command -v cmd.exe &>/dev/null; then
    cmd.exe /c start "$URL"
  else
    echo "Could not auto-detect browser. Please open $URL manually in your browser."
  fi
fi

if [ -n "$SERVER_PID" ]; then
  echo ""
  echo "Local server is running in the background. Press [Ctrl+C] to stop it and exit."
  # Wait on server process
  wait $SERVER_PID
fi
