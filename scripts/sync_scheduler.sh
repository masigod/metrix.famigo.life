#!/bin/bash
#
# Google Sheets Sync Scheduler
# This script manages the synchronization between Google Sheets and local data
#

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PYTHON_SCRIPT="$SCRIPT_DIR/google_sheets_sync.py"
LOG_DIR="$SCRIPT_DIR/../logs"
LOG_FILE="$LOG_DIR/sync_$(date +%Y%m%d).log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to run sync
run_sync() {
    log_message "Starting manual sync..."
    python3 "$PYTHON_SCRIPT" --force 2>&1 | tee -a "$LOG_FILE"
    log_message "Manual sync completed"
}

# Function to run auto-sync
run_auto_sync() {
    log_message "Starting auto-sync service..."
    python3 "$PYTHON_SCRIPT" --auto 2>&1 | tee -a "$LOG_FILE"
    log_message "Auto-sync service stopped"
}

# Function to check status
check_status() {
    log_message "Checking sync status..."
    python3 "$PYTHON_SCRIPT" --status
}

# Function to show help
show_help() {
    echo "Google Sheets Sync Scheduler"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  sync       - Run manual sync immediately"
    echo "  auto       - Start auto-sync service (runs continuously)"
    echo "  status     - Show current sync status"
    echo "  logs       - Show today's logs"
    echo "  help       - Show this help message"
    echo ""
    echo "Configuration:"
    echo "  Edit scripts/google_sheets_config.json to change settings"
    echo "  Current settings:"
    echo "    - Cache TTL: 15 minutes"
    echo "    - Auto-sync interval: 30 minutes"
    echo "    - Rate limit: 30 requests/hour"
}

# Main script logic
case "$1" in
    sync)
        run_sync
        ;;
    auto)
        run_auto_sync
        ;;
    status)
        check_status
        ;;
    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -n 50 "$LOG_FILE"
        else
            echo "No logs found for today"
        fi
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Invalid command. Use '$0 help' for usage information."
        exit 1
        ;;
esac