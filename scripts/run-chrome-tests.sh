#!/bin/bash

##
## Run Chrome DevTools Tests for Metrix Project
## This script starts the local server and runs automated browser tests
##

set -e

NETLIFY_PORT=8888
CHROME_PORT=9222

echo "========================================="
echo "Metrix Chrome DevTools Test Suite"
echo "========================================="

# Function to check if port is in use
check_port() {
  lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to start Netlify Dev
start_netlify() {
  if check_port $NETLIFY_PORT; then
    echo "✓ Netlify Dev already running on port $NETLIFY_PORT"
  else
    echo ""
    echo "Starting Netlify Dev..."
    cd "$(dirname "$0")/.."
    netlify dev > /tmp/metrix-netlify-dev.log 2>&1 &
    NETLIFY_PID=$!
    echo $NETLIFY_PID > /tmp/metrix-netlify-dev.pid

    echo "Waiting for Netlify Dev to be ready..."
    for i in {1..30}; do
      if curl -s "http://localhost:${NETLIFY_PORT}" > /dev/null 2>&1; then
        echo "✓ Netlify Dev is ready"
        break
      fi
      sleep 1
    done
  fi
}

# Function to start Chrome with remote debugging
start_chrome() {
  if check_port $CHROME_PORT; then
    echo "✓ Chrome already running with remote debugging on port $CHROME_PORT"
  else
    echo ""
    echo "Starting Chrome with remote debugging..."

    CHROME_PATHS=(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    )

    CHROME_BINARY=""
    for path in "${CHROME_PATHS[@]}"; do
      if [ -f "$path" ]; then
        CHROME_BINARY="$path"
        break
      fi
    done

    if [ -z "$CHROME_BINARY" ]; then
      echo "❌ Chrome not found. Please install Google Chrome."
      exit 1
    fi

    "$CHROME_BINARY" \
      --remote-debugging-port=${CHROME_PORT} \
      --no-first-run \
      --no-default-browser-check \
      --user-data-dir=$(mktemp -d -t chrome-remote-profile) \
      "http://localhost:${NETLIFY_PORT}" \
      > /dev/null 2>&1 &

    CHROME_PID=$!
    echo $CHROME_PID > /tmp/metrix-chrome.pid
    echo "✓ Chrome started with PID: $CHROME_PID"

    sleep 2
  fi
}

# Cleanup function
cleanup() {
  echo ""
  echo "Cleaning up..."

  if [ -f /tmp/metrix-chrome.pid ]; then
    CHROME_PID=$(cat /tmp/metrix-chrome.pid)
    if ps -p $CHROME_PID > /dev/null 2>&1; then
      kill $CHROME_PID
    fi
    rm /tmp/metrix-chrome.pid
  fi

  if [ -f /tmp/metrix-netlify-dev.pid ]; then
    NETLIFY_PID=$(cat /tmp/metrix-netlify-dev.pid)
    if ps -p $NETLIFY_PID > /dev/null 2>&1; then
      kill $NETLIFY_PID
    fi
    rm /tmp/metrix-netlify-dev.pid
  fi
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM

# Main execution
echo ""
echo "Step 1: Starting Netlify Dev..."
start_netlify

echo ""
echo "Step 2: Starting Chrome with remote debugging..."
start_chrome

echo ""
echo "Step 3: Running tests..."
echo ""

cd "$(dirname "$0")/.."

# Run credentials manager test
echo "==> Testing Credentials Manager..."
tsx scripts/chrome-test-credentials.ts

echo ""
echo "==> Testing Management Dashboard..."
tsx scripts/chrome-test-management.ts

echo ""
echo "========================================="
echo "ALL TESTS COMPLETED"
echo "========================================="