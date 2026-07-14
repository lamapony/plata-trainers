#!/usr/bin/env bash
# Platå Danish practice local hub launcher
# Canonical user origin: https://lamapony.github.io/plata-trainers/
# Local Development: serve this trainers-repo directory over HTTP (not file://).

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Platå local practice launcher"
echo "======================================"
echo "Serves this folder over HTTP (required for PWA and relative imports)."
echo "Public beta origin: https://lamapony.github.io/plata-trainers/"
echo ""

if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is not installed. Please install Python 3 to run Platå locally."
  exit 1
fi

PORT=8000
LOG_FILE="daily_practice_log.txt"

if lsof -i :$PORT -t &>/dev/null || nc -z localhost $PORT &>/dev/null; then
  echo "Local server is already running on port $PORT."
  SERVER_PID=""
else
  echo "Starting python3 HTTP server on port $PORT in the background..."
  python3 -m http.server $PORT >/dev/null 2>&1 &
  SERVER_PID=$!
  trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
  sleep 1
  echo "Server started with PID $SERVER_PID."
fi

if [ -f "$LOG_FILE" ]; then
  echo ""
  echo "Recent practice history:"
  echo "----------------------------------------------"
  tail -n 5 "$LOG_FILE" | while read -r line; do
    echo "  $line"
  done
  echo "======================================"
fi

echo ""
echo "Choose what to open:"
echo "----------------------------------------------"
echo "1) Flagship lesson — B2 job follow-up (recommended)"
echo "2) Today / Dashboard"
echo "3) Landing page"
echo "4) Bøjning drill"
echo "5) Ordstilling drill"
echo "6) Register drill"
echo "7) Vocab SR — Russian trainer (optional DA↔RU)"
echo "8) Skriveøvelser"
echo "9) Run npm run check"
echo "0) Exit"
echo ""

read -rp "Enter choice [1-9 / 0]: " choice

URL=""
CHOICE_NAME=""
case $choice in
  1) URL="http://localhost:$PORT/lessons/lesson-b2-job-followup/"; CHOICE_NAME="B2 job follow-up" ;;
  2) URL="http://localhost:$PORT/dashboard.html"; CHOICE_NAME="Today / Dashboard" ;;
  3) URL="http://localhost:$PORT/"; CHOICE_NAME="Landing" ;;
  4) URL="http://localhost:$PORT/bojning-drill/"; CHOICE_NAME="Bøjning Drill" ;;
  5) URL="http://localhost:$PORT/ordstilling-drill/"; CHOICE_NAME="Ordstilling Drill" ;;
  6) URL="http://localhost:$PORT/register-drill/"; CHOICE_NAME="Register Drill" ;;
  7) URL="http://localhost:$PORT/vocab-sr/"; CHOICE_NAME="Vocab SR (Russian trainer)" ;;
  8) URL="http://localhost:$PORT/skrive-drill/"; CHOICE_NAME="Skriveøvelser" ;;
  9)
    echo "Running npm run check..."
    npm run check
    exit 0
    ;;
  0)
    echo "Farvel."
    exit 0
    ;;
  *)
    echo "Invalid choice. Opening flagship lesson..."
    URL="http://localhost:$PORT/lessons/lesson-b2-job-followup/"
    CHOICE_NAME="B2 job follow-up (default)"
    ;;
esac

echo ""
echo "Opening: $CHOICE_NAME"
echo "URL: $URL"
echo ""

if command -v open &>/dev/null; then
  open "$URL"
elif command -v xdg-open &>/dev/null; then
  xdg-open "$URL"
else
  echo "Open this URL in your browser: $URL"
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
echo "$TIMESTAMP · $CHOICE_NAME" >> "$LOG_FILE"

if [ -n "$SERVER_PID" ]; then
  echo "Server keeps running (PID $SERVER_PID). Stop it later with: kill $SERVER_PID"
  trap - EXIT
fi
