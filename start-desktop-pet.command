#!/bin/zsh

set -e

PROJECT_DIR="/Users/hexinyang/Desktop/AI coding-pet"
ELECTRON_BINARY="$PROJECT_DIR/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
LOG_DIR="$PROJECT_DIR/.desktop-pet-logs"
PID_FILE="$PROJECT_DIR/.desktop-pet-pids"

cd "$PROJECT_DIR"

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
fi

if command -v nvm >/dev/null 2>&1; then
  nvm use >/dev/null
elif [ -d "$HOME/.nvm/versions/node/v18.20.8/bin" ]; then
  export PATH="$HOME/.nvm/versions/node/v18.20.8/bin:$PATH"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not available."
  echo "Install Node 18 first, then try again."
  read -k 1 "?Press any key to close..."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Current Node version is too old: $(node -v)"
  echo "Please use Node 18 or newer."
  read -k 1 "?Press any key to close..."
  exit 1
fi

if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  echo "Installing project dependencies..."
  npm install
fi

if [ ! -x "$ELECTRON_BINARY" ]; then
  echo "Preparing Electron runtime..."
  npm rebuild electron
fi

mkdir -p "$LOG_DIR"
rm -f "$PID_FILE"

pkill -f 'node_modules/.bin/vite --host 127.0.0.1 --port 5173|tsc -p tsconfig.electron.json --watch|Electron.app/Contents/MacOS/Electron .|scripts/start-electron-dev.cjs' || true

echo "Starting AI Coding Pet desktop mode..."
echo "Logs will be written to:"
echo "  $LOG_DIR"
echo ""

nohup npm run dev > "$LOG_DIR/vite.log" 2>&1 &
echo $! >> "$PID_FILE"

nohup npm run electron:watch > "$LOG_DIR/electron-watch.log" 2>&1 &
echo $! >> "$PID_FILE"

nohup node scripts/start-electron-dev.cjs > "$LOG_DIR/electron-start.log" 2>&1 &
echo $! >> "$PID_FILE"

sleep 2

echo "AI Coding Pet launch commands have been sent."
echo "If the pet still does not appear, open this log file first:"
echo "  $LOG_DIR/electron-start.log"
echo ""
read -k 1 "?Press any key to close this window..."
