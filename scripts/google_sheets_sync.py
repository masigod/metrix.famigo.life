#!/usr/bin/env python3
"""
Google Sheets Real-time Sync Module
Fetches data from Google Sheets with rate limiting and caching
"""

import os
import json
import time
import hashlib
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pickle

class GoogleSheetsSync:
    """Google Sheets synchronization with smart caching and rate limiting"""

    def __init__(self, config_file='google_sheets_config.json'):
        """Initialize with configuration"""
        self.config = self.load_config(config_file)
        self.cache_dir = '../cache'
        self.last_sync_file = os.path.join(self.cache_dir, 'last_sync.json')
        self.cache_file = os.path.join(self.cache_dir, 'sheets_data.pkl')

        # Rate limiting settings
        self.min_interval_seconds = 60  # Minimum 1 minute between API calls
        self.max_requests_per_hour = 30  # Max 30 requests per hour
        self.request_history = []

        # Create cache directory if not exists
        os.makedirs(self.cache_dir, exist_ok=True)

    def load_config(self, config_file):
        """Load configuration from JSON file"""
        config_path = os.path.join(os.path.dirname(__file__), config_file)

        # Default configuration
        default_config = {
            "spreadsheet_id": "1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY",
            "sheets": {
                "seoul": {
                    "name": "서울 관리",
                    "gid": "448929090",
                    "range": "A:Z"
                },
                "suwon": {
                    "name": "수원 관리",
                    "gid": "",
                    "range": "A:Z"
                }
            },
            "cache_ttl_minutes": 15,
            "auto_sync_interval_minutes": 30,
            "export_format": "csv"
        }

        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                loaded_config = json.load(f)
                default_config.update(loaded_config)
        else:
            # Save default config
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, ensure_ascii=False, indent=2)

        return default_config

    def check_rate_limit(self):
        """Check if we're within rate limits"""
        current_time = time.time()

        # Remove requests older than 1 hour
        self.request_history = [
            t for t in self.request_history
            if current_time - t < 3600
        ]

        # Check hourly limit
        if len(self.request_history) >= self.max_requests_per_hour:
            return False

        # Check minimum interval
        if self.request_history and (current_time - self.request_history[-1] < self.min_interval_seconds):
            return False

        return True

    def wait_for_rate_limit(self):
        """Wait until rate limit allows next request"""
        while not self.check_rate_limit():
            if self.request_history:
                wait_time = self.min_interval_seconds - (time.time() - self.request_history[-1])
                if wait_time > 0:
                    print(f"⏳ Rate limit: waiting {wait_time:.0f} seconds...")
                    time.sleep(wait_time + 1)
            else:
                time.sleep(1)

    def get_cache_age_minutes(self):
        """Get age of cached data in minutes"""
        if not os.path.exists(self.last_sync_file):
            return float('inf')

        with open(self.last_sync_file, 'r') as f:
            last_sync = json.load(f)
            last_sync_time = datetime.fromisoformat(last_sync['timestamp'])
            age = (datetime.now() - last_sync_time).total_seconds() / 60
            return age

    def is_cache_valid(self):
        """Check if cached data is still valid"""
        cache_age = self.get_cache_age_minutes()
        return cache_age < self.config['cache_ttl_minutes']

    def load_from_cache(self):
        """Load data from cache if valid"""
        if not self.is_cache_valid():
            return None

        if not os.path.exists(self.cache_file):
            return None

        try:
            with open(self.cache_file, 'rb') as f:
                data = pickle.load(f)

            with open(self.last_sync_file, 'r') as f:
                sync_info = json.load(f)

            print(f"📦 Loaded from cache (age: {self.get_cache_age_minutes():.1f} minutes)")
            print(f"   Last sync: {sync_info['timestamp']}")

            return data
        except Exception as e:
            print(f"❌ Cache load error: {e}")
            return None

    def save_to_cache(self, data):
        """Save data to cache"""
        try:
            with open(self.cache_file, 'wb') as f:
                pickle.dump(data, f)

            sync_info = {
                'timestamp': datetime.now().isoformat(),
                'source': 'Google Sheets API',
                'sheets': list(data.keys()),
                'total_records': sum(len(df) for df in data.values() if df is not None)
            }

            with open(self.last_sync_file, 'w') as f:
                json.dump(sync_info, f, indent=2)

            print(f"💾 Saved to cache at {sync_info['timestamp']}")
        except Exception as e:
            print(f"❌ Cache save error: {e}")

    def fetch_sheet_as_csv(self, sheet_config):
        """Fetch a single sheet as CSV"""
        spreadsheet_id = self.config['spreadsheet_id']
        gid = sheet_config.get('gid', '')

        # Construct export URL
        export_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"
        if gid:
            export_url += f"&gid={gid}"

        try:
            # Make request
            response = requests.get(export_url, timeout=30)
            response.raise_for_status()

            # Parse CSV
            import io
            csv_data = io.StringIO(response.text)
            df = pd.read_csv(csv_data)

            return df

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to fetch sheet: {e}")
            return None

    def fetch_all_sheets(self, force_refresh=False):
        """Fetch all configured sheets"""
        # Check cache first
        if not force_refresh:
            cached_data = self.load_from_cache()
            if cached_data is not None:
                return cached_data

        # Check rate limit
        self.wait_for_rate_limit()

        print("🔄 Fetching data from Google Sheets...")
        data = {}

        for sheet_key, sheet_config in self.config['sheets'].items():
            print(f"  📊 Fetching {sheet_config['name']}...")
            df = self.fetch_sheet_as_csv(sheet_config)

            if df is not None:
                data[sheet_key] = df
                print(f"     ✅ Fetched {len(df)} rows")

                # Record request for rate limiting
                self.request_history.append(time.time())

                # Small delay between requests
                time.sleep(2)
            else:
                print(f"     ❌ Failed to fetch {sheet_config['name']}")

        # Save to cache
        if data:
            self.save_to_cache(data)

        return data

    def get_sync_status(self):
        """Get current sync status information"""
        status = {
            'cache_valid': self.is_cache_valid(),
            'cache_age_minutes': self.get_cache_age_minutes(),
            'last_sync': None,
            'next_auto_sync': None,
            'rate_limit_remaining': max(0, self.max_requests_per_hour - len(self.request_history))
        }

        if os.path.exists(self.last_sync_file):
            with open(self.last_sync_file, 'r') as f:
                sync_info = json.load(f)
                status['last_sync'] = sync_info['timestamp']

                # Calculate next auto sync
                last_sync_time = datetime.fromisoformat(sync_info['timestamp'])
                next_sync = last_sync_time + timedelta(minutes=self.config['auto_sync_interval_minutes'])
                status['next_auto_sync'] = next_sync.isoformat()

        return status

    def should_auto_sync(self):
        """Check if auto-sync should run"""
        cache_age = self.get_cache_age_minutes()
        return cache_age >= self.config['auto_sync_interval_minutes']


class DataProcessor:
    """Process and merge Google Sheets data"""

    def __init__(self, field_mapping_file='field_mapping.json'):
        """Initialize with field mapping"""
        self.field_mapping = self.load_field_mapping(field_mapping_file)

    def load_field_mapping(self, mapping_file):
        """Load field mapping configuration"""
        mapping_path = os.path.join(os.path.dirname(__file__), mapping_file)

        if os.path.exists(mapping_path):
            with open(mapping_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            raise FileNotFoundError(f"Field mapping file not found: {mapping_path}")

    def process_dataframe(self, df, source_location):
        """Process a single dataframe with field mapping and normalization"""
        if df is None or df.empty:
            return None

        # Add source location
        df['데이터 소스'] = source_location

        # Apply field mapping
        df = self.apply_field_mapping(df)

        # Normalize data
        df = self.normalize_data(df)

        # Add system fields
        df['sync_timestamp'] = datetime.now().isoformat()
        df['processing_status'] = 'synced'

        return df

    def apply_field_mapping(self, df):
        """Apply field name and value mapping"""
        # Rename columns
        korean_to_english = self.field_mapping.get('korean_to_english', {})
        df.rename(columns=korean_to_english, inplace=True)

        # Apply value mappings
        value_mapping = self.field_mapping.get('value_mapping', {})

        for field, mappings in value_mapping.items():
            if field in df.columns:
                df[field] = df[field].map(mappings).fillna(df[field])

        return df

    def normalize_data(self, df):
        """Normalize data formats"""
        # Implement normalization logic from extract_sheets_data.py
        # (Phone, date, time normalization)
        return df

    def merge_and_deduplicate(self, dataframes):
        """Merge multiple dataframes and remove duplicates"""
        if not dataframes:
            return pd.DataFrame()

        # Combine all dataframes
        combined = pd.concat(dataframes, ignore_index=True)

        # Remove duplicates based on UID
        if 'uid' in combined.columns:
            combined = combined.drop_duplicates(subset=['uid'], keep='last')

        # Sort by reservation date and time
        sort_columns = []
        if 'reservation_date' in combined.columns:
            sort_columns.append('reservation_date')
        if 'reservation_time_slot' in combined.columns:
            sort_columns.append('reservation_time_slot')

        if sort_columns:
            combined = combined.sort_values(sort_columns)

        return combined


def main():
    """Main execution with manual trigger support"""
    import argparse

    parser = argparse.ArgumentParser(description='Google Sheets Sync Tool')
    parser.add_argument('--force', action='store_true', help='Force refresh ignoring cache')
    parser.add_argument('--status', action='store_true', help='Show sync status only')
    parser.add_argument('--auto', action='store_true', help='Run in auto-sync mode')
    args = parser.parse_args()

    # Initialize sync manager
    sync = GoogleSheetsSync()
    processor = DataProcessor()

    # Show status
    if args.status:
        status = sync.get_sync_status()
        print("\n📊 Sync Status:")
        print(f"  Cache Valid: {status['cache_valid']}")
        print(f"  Cache Age: {status['cache_age_minutes']:.1f} minutes")
        print(f"  Last Sync: {status['last_sync']}")
        print(f"  Next Auto Sync: {status['next_auto_sync']}")
        print(f"  Rate Limit Remaining: {status['rate_limit_remaining']}/{sync.max_requests_per_hour}")
        return

    # Auto-sync mode
    if args.auto:
        print("🔄 Starting auto-sync mode...")
        print(f"   Interval: {sync.config['auto_sync_interval_minutes']} minutes")
        print(f"   Cache TTL: {sync.config['cache_ttl_minutes']} minutes")
        print("   Press Ctrl+C to stop\n")

        try:
            while True:
                if sync.should_auto_sync():
                    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Auto-sync triggered")

                    # Fetch data
                    sheets_data = sync.fetch_all_sheets(force_refresh=True)

                    # Process data
                    processed_data = []
                    for sheet_key, df in sheets_data.items():
                        location = "서울" if sheet_key == "seoul" else "수원"
                        processed_df = processor.process_dataframe(df, location)
                        if processed_df is not None:
                            processed_data.append(processed_df)

                    # Merge and save
                    if processed_data:
                        final_df = processor.merge_and_deduplicate(processed_data)
                        output_file = '../source/Management_Panel_Live.csv'
                        final_df.to_csv(output_file, index=False, encoding='utf-8')
                        print(f"✅ Saved {len(final_df)} records to {output_file}")

                # Sleep for 1 minute before checking again
                time.sleep(60)

        except KeyboardInterrupt:
            print("\n⏹ Auto-sync stopped")
            return

    # Manual sync
    print("=" * 60)
    print("Google Sheets Sync Tool")
    print("=" * 60)

    # Fetch data
    sheets_data = sync.fetch_all_sheets(force_refresh=args.force)

    if not sheets_data:
        print("❌ No data fetched")
        return

    # Process each sheet
    processed_data = []

    for sheet_key, df in sheets_data.items():
        if df is not None:
            location = "서울" if sheet_key == "seoul" else "수원"
            print(f"\n📍 Processing {location} data...")
            processed_df = processor.process_dataframe(df, location)

            if processed_df is not None:
                processed_data.append(processed_df)
                print(f"   ✅ Processed {len(processed_df)} records")

    # Merge all data
    if processed_data:
        print("\n🔀 Merging data...")
        final_df = processor.merge_and_deduplicate(processed_data)
        print(f"   ✅ Total records after deduplication: {len(final_df)}")

        # Save to file
        output_file = '../source/Management_Panel_Live.csv'
        final_df.to_csv(output_file, index=False, encoding='utf-8')
        print(f"\n💾 Saved to: {output_file}")

        # Show summary
        print("\n📈 Summary:")
        print(f"   Total Records: {len(final_df)}")
        if 'data_source' in final_df.columns:
            print("   By Location:")
            for loc, count in final_df['data_source'].value_counts().items():
                print(f"      • {loc}: {count}")
        if 'participation_result' in final_df.columns:
            print("   By Participation:")
            for status, count in final_df['participation_result'].value_counts().items():
                print(f"      • {status}: {count}")

    # Show sync status
    status = sync.get_sync_status()
    print(f"\n⏰ Last sync: {status['last_sync']}")
    print(f"   Next auto-sync: {status['next_auto_sync']}")

if __name__ == "__main__":
    main()