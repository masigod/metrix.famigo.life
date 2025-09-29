#!/usr/bin/env python3
"""
LazyC  Sync Integration
Uses LazyCode  MCP server for Google Sheets to Airtable sync
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

# LazyCode  paths
LAZYCODER_PATH = Path.home() / '.lazycoder'
MCP_SERVER_PATH = LAZYCODER_PATH / 'packages' / 'mcp-server'

# Configuration
METRIX_CONFIG = {
    'googleSheets': {
        'spreadsheetId': '1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY',
        'sheets': [
            {'name': '서울 관리', 'gid': '448929090'},
            {'name': '수원 관리', 'gid': ''}  # Add GID when available
        ]
    },
    'airtable': {
        'apiKey': os.getenv('AIRTABLE_API_KEY', ''),
        'baseId': os.getenv('AIRTABLE_BASE_ID', ''),
        'tableName': 'ManagementPanel'
    },
    'credentials': {
        'email': 'help@owelers.co.kr',
        'password': 'fam1go@nobenefit24&'
    }
}

def check_lazycoder():
    """Check if LazyCode  is installed"""
    if not LAZYCODER_PATH.exists():
        print("❌ LazyCode  not found at ~/.lazycoder")
        print("Please install LazyCode  first")
        return False

    if not MCP_SERVER_PATH.exists():
        print("❌ MCP Server not found")
        print(f"Expected at: {MCP_SERVER_PATH}")
        return False

    print("✅ LazyCode  found")
    return True

def start_mcp_server():
    """Start LazyCode  MCP server if not running"""
    try:
        # Check if server is running
        result = subprocess.run(
            ['pgrep', '-f', 'mcp-server'],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print("✅ MCP Server is already running")
            return True

        print("🚀 Starting MCP Server...")

        # Start the server
        subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=MCP_SERVER_PATH,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        import time
        time.sleep(3)  # Wait for server to start

        print("✅ MCP Server started")
        return True

    except Exception as e:
        print(f"❌ Failed to start MCP Server: {e}")
        return False

def call_mcp_tool(action, params=None):
    """Call MCP server tool via API"""
    import requests

    # MCP server endpoint (default port)
    url = "http://localhost:3000/tools/google-sheets-sync"

    payload = {
        "action": action,
        **(params or {})
    }

    try:
        response = requests.post(url, json=payload)
        if response.ok:
            return response.json()
        else:
            print(f"❌ MCP call failed: {response.status_code}")
            print(response.text)
            return None
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to MCP server")
        print("Try starting it with: cd ~/.lazycoder/packages/mcp-server && npm run dev")
        return None
    except Exception as e:
        print(f"❌ Error calling MCP tool: {e}")
        return None

def configure_sync():
    """Configure the sync settings in MCP server"""
    print("\n📝 Configuring sync settings...")

    result = call_mcp_tool('configure', {
        'spreadsheetId': METRIX_CONFIG['googleSheets']['spreadsheetId'],
        'airtableConfig': METRIX_CONFIG['airtable'],
        'credentials': METRIX_CONFIG['credentials']
    })

    if result and result.get('success'):
        print("✅ Configuration saved")
        return True
    else:
        print("❌ Configuration failed")
        return False

def fetch_sheets_data():
    """Fetch data from Google Sheets"""
    print("\n📊 Fetching Google Sheets data...")

    result = call_mcp_tool('fetch', {
        'sheetGid': METRIX_CONFIG['googleSheets']['sheets'][0]['gid']
    })

    if result and result.get('success'):
        print(f"✅ Fetched {result['recordCount']} records")
        return result
    else:
        print(f"❌ Fetch failed: {result.get('error', 'Unknown error')}")
        return None

def sync_to_airtable():
    """Sync data to Airtable"""
    print("\n🔄 Syncing to Airtable...")

    result = call_mcp_tool('sync')

    if result and result.get('success'):
        print(f"✅ Sync completed:")
        print(f"   Created: {result['results']['created']}")
        print(f"   Updated: {result['results']['updated']}")
        print(f"   Failed: {result['results']['failed']}")
        return result
    else:
        print(f"❌ Sync failed")
        return None

def get_status():
    """Get sync status"""
    print("\n📈 Sync Status:")

    result = call_mcp_tool('status')

    if result:
        print(f"Configured: {result.get('configured', False)}")

        if result.get('configured'):
            gs = result.get('googleSheets', {})
            at = result.get('airtable', {})

            print(f"\nGoogle Sheets:")
            print(f"  Spreadsheet ID: {gs.get('spreadsheetId', 'Not set')}")
            print(f"  Configured: {gs.get('configured', False)}")

            print(f"\nAirtable:")
            print(f"  Base ID: {at.get('baseId', 'Not set')}")
            print(f"  Table: {at.get('tableName', 'Not set')}")
            print(f"  Configured: {at.get('configured', False)}")

            if result.get('lastSync'):
                print(f"\nLast Sync: {result['lastSync']}")

            if result.get('cache'):
                cache = result['cache']
                print(f"\nCached Data:")
                print(f"  Records: {cache['recordCount']}")
                print(f"  Timestamp: {cache['timestamp']}")

    return result

def main():
    """Main function"""
    print("🚀 LazyCode  Sync Integration")
    print("=" * 50)

    # Check LazyCode  installation
    if not check_lazycoder():
        return

    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == 'configure':
            configure_sync()
        elif command == 'fetch':
            fetch_sheets_data()
        elif command == 'sync':
            # Full sync pipeline
            if configure_sync():
                data = fetch_sheets_data()
                if data:
                    sync_to_airtable()
        elif command == 'status':
            get_status()
        elif command == 'start-server':
            start_mcp_server()
        else:
            print(f"Unknown command: {command}")
            print("\nAvailable commands:")
            print("  configure    - Set up sync configuration")
            print("  fetch        - Fetch data from Google Sheets")
            print("  sync         - Run full sync pipeline")
            print("  status       - Show sync status")
            print("  start-server - Start MCP server")
    else:
        # Default: run full sync
        print("\n🔄 Running full sync pipeline...")

        if configure_sync():
            data = fetch_sheets_data()
            if data:
                result = sync_to_airtable()
                if result:
                    print("\n✅ Sync completed successfully!")

        # Show final status
        print("\n" + "=" * 50)
        get_status()

if __name__ == "__main__":
    main()