#!/bin/bash
#
# Full Sync Pipeline
# Runs the complete sync process from Google Sheets to Airtable
#

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$SCRIPT_DIR/../logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/full_sync_$TIMESTAMP.log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    COLOR=$1
    MESSAGE=$2
    echo -e "${COLOR}${MESSAGE}${NC}" | tee -a "$LOG_FILE"
}

# Function to print section header
print_header() {
    echo "" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    print_color "$BLUE" "$1"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Main sync process
main() {
    print_header "FULL SYNC PIPELINE STARTED"
    print_color "$GREEN" "Timestamp: $(date)"
    print_color "$GREEN" "Log file: $LOG_FILE"

    # Step 1: Fetch from Google Sheets
    print_header "Step 1: Fetching from Google Sheets"

    cd "$SCRIPT_DIR"

    if python3 google_sheets_sync.py --force 2>&1 | tee -a "$LOG_FILE"; then
        print_color "$GREEN" "✅ Google Sheets sync successful"
    else
        print_color "$RED" "❌ Google Sheets sync failed"
        exit 1
    fi

    # Check if data file was created
    DATA_FILE="$SCRIPT_DIR/../source/Management_Panel_Live.csv"
    if [ ! -f "$DATA_FILE" ]; then
        print_color "$RED" "❌ Data file not created: $DATA_FILE"
        exit 1
    fi

    # Show data statistics
    RECORD_COUNT=$(wc -l < "$DATA_FILE")
    print_color "$GREEN" "📊 Total records: $((RECORD_COUNT - 1))"  # Subtract header row

    # Step 2: Upload to Airtable
    print_header "Step 2: Uploading to Airtable"

    # Check Airtable configuration
    if [ -z "$AIRTABLE_API_KEY" ]; then
        print_color "$YELLOW" "⚠️  AIRTABLE_API_KEY not set"
        print_color "$YELLOW" "   Checking config file..."

        CONFIG_FILE="$SCRIPT_DIR/airtable_config.json"
        if grep -q "YOUR_API_KEY_HERE" "$CONFIG_FILE" 2>/dev/null; then
            print_color "$RED" "❌ Airtable not configured"
            print_color "$YELLOW" "Please update $CONFIG_FILE with your Airtable credentials"
            print_color "$YELLOW" "Or set environment variables:"
            print_color "$YELLOW" "  export AIRTABLE_API_KEY=your_key"
            print_color "$YELLOW" "  export AIRTABLE_BASE_ID=your_base_id"
            exit 1
        fi
    fi

    if python3 airtable_sync.py 2>&1 | tee -a "$LOG_FILE"; then
        print_color "$GREEN" "✅ Airtable sync successful"
    else
        print_color "$RED" "❌ Airtable sync failed"
        exit 1
    fi

    # Step 3: Generate summary
    print_header "SYNC SUMMARY"

    # Get last sync info
    LAST_SYNC_FILE="$SCRIPT_DIR/../cache/last_sync.json"
    if [ -f "$LAST_SYNC_FILE" ]; then
        LAST_SYNC=$(python3 -c "import json; print(json.load(open('$LAST_SYNC_FILE'))['timestamp'])")
        print_color "$GREEN" "Last sync time: $LAST_SYNC"
    fi

    # Get Airtable sync log
    AIRTABLE_LOG="$SCRIPT_DIR/../logs/airtable_sync.json"
    if [ -f "$AIRTABLE_LOG" ]; then
        LAST_ENTRY=$(python3 -c "
import json
log = json.load(open('$AIRTABLE_LOG'))
if log['sync_history']:
    last = log['sync_history'][-1]
    print(f\"Records created: {last['records_created']}, updated: {last['records_updated']}\")
")
        print_color "$GREEN" "$LAST_ENTRY"
    fi

    print_header "SYNC COMPLETED SUCCESSFULLY"
    print_color "$GREEN" "✨ Full sync pipeline completed at $(date)"
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Full Sync Pipeline"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --status       Show sync status without running sync"
        echo ""
        echo "This script runs the complete sync pipeline:"
        echo "  1. Fetch data from Google Sheets"
        echo "  2. Process and normalize data"
        echo "  3. Upload to Airtable"
        echo ""
        echo "Logs are saved to: $LOG_DIR"
        ;;
    --status)
        print_header "SYNC STATUS"
        cd "$SCRIPT_DIR"
        python3 google_sheets_sync.py --status
        ;;
    *)
        main
        ;;
esac