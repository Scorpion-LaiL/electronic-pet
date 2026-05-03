#!/bin/zsh

PROJECT_DIR="/Users/hexinyang/Desktop/AI coding-pet"
PID_FILE="$PROJECT_DIR/.desktop-pet-pids"

if [ -f "$PID_FILE" ]; then
  while IFS= read -r pid; do
    if [ -n "$pid" ]; then
      kill "$pid" 2>/dev/null || true
    fi
  done < "$PID_FILE"

  rm -f "$PID_FILE"
fi

pkill -f 'Electron.app|node_modules/.bin/electron|vite --host 127.0.0.1 --port 5173|tsc -p tsconfig.electron.json --watch|npm run desktop:dev|npm exec electron .' || true

echo "AI Coding Pet desktop processes have been stopped."
read -k 1 "?Press any key to close..."
