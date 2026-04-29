#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo "=== FuelRadar Start ==="

# ── Backend venv ──────────────────────────────────────────
if [ ! -d "$BACKEND/venv" ]; then
  echo "[backend] Creating venv..."
  python3 -m venv "$BACKEND/venv"
fi

source "$BACKEND/venv/bin/activate"

echo "[backend] Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r "$BACKEND/requirements.txt"

# ── Start backend in background ───────────────────────────
echo "[backend] Starting on http://localhost:8001 ..."
cd "$BACKEND"
python server.py &
BACKEND_PID=$!
echo "[backend] PID: $BACKEND_PID"

# wait for backend to be ready
for i in $(seq 1 15); do
  if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
    echo "[backend] Ready!"
    break
  fi
  sleep 1
done

# ── Start Expo ────────────────────────────────────────────
echo "[frontend] Starting Expo..."
cd "$FRONTEND"
npm install --silent
npx expo start --clear

# ── Cleanup on exit ───────────────────────────────────────
kill $BACKEND_PID 2>/dev/null
echo "Stopped."
