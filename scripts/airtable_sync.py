#!/usr/bin/env python3
"""
Airtable Sync Module
Uploads processed Google Sheets data to Airtable
"""

import os
import json
import time
import requests
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional

class AirtableSync:
    """Airtable synchronization manager"""

    def __init__(self, config_file='airtable_config.json'):
        """Initialize with configuration"""
        self.config = self.load_config(config_file)
        self.base_url = f"https://api.airtable.com/v0/{self.config['base_id']}/{self.config['table_name']}"
        self.headers = {
            "Authorization": f"Bearer {self.config['api_key']}",
            "Content-Type": "application/json"
        }
        self.batch_size = 10  # Airtable allows max 10 records per batch

    def load_config(self, config_file):
        """Load Airtable configuration"""
        config_path = os.path.join(os.path.dirname(__file__), config_file)

        # Check for environment variables first
        config = {
            "api_key": os.getenv('AIRTABLE_API_KEY', ''),
            "base_id": os.getenv('AIRTABLE_BASE_ID', ''),
            "table_name": os.getenv('AIRTABLE_TABLE_NAME', 'ManagementPanel')
        }

        # Load from file if exists
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
                config.update(file_config)
        else:
            # Create template config file
            template_config = {
                "api_key": "YOUR_API_KEY_HERE",
                "base_id": "YOUR_BASE_ID_HERE",
                "table_name": "ManagementPanel",
                "sync_fields": [
                    "uid", "name", "email", "phone", "gender",
                    "birth_date", "nationality", "residence_area",
                    "reservation_date", "reservation_time_slot",
                    "reservation_location", "participation_result",
                    "confirmation_status", "data_source"
                ]
            }
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(template_config, f, indent=2)

        if not config['api_key'] or config['api_key'] == 'YOUR_API_KEY_HERE':
            print("⚠️  Please set AIRTABLE_API_KEY environment variable or update airtable_config.json")

        return config

    def get_existing_records(self):
        """Fetch all existing records from Airtable"""
        all_records = []
        offset = None

        print("📥 Fetching existing records from Airtable...")

        while True:
            params = {"pageSize": 100}
            if offset:
                params["offset"] = offset

            try:
                response = requests.get(self.base_url, headers=self.headers, params=params)
                response.raise_for_status()
                data = response.json()

                records = data.get('records', [])
                all_records.extend(records)

                offset = data.get('offset')
                if not offset:
                    break

                time.sleep(0.2)  # Rate limiting

            except requests.exceptions.RequestException as e:
                print(f"❌ Error fetching records: {e}")
                break

        print(f"   Retrieved {len(all_records)} existing records")
        return all_records

    def create_uid_map(self, records):
        """Create a mapping of UIDs to record IDs"""
        uid_map = {}
        for record in records:
            uid = record.get('fields', {}).get('uid')
            if uid:
                uid_map[uid] = record['id']
        return uid_map

    def prepare_record_for_airtable(self, row):
        """Convert a DataFrame row to Airtable record format"""
        fields = {}

        # Map only configured fields
        for field in self.config.get('sync_fields', []):
            if field in row and pd.notna(row[field]):
                value = row[field]

                # Convert timestamps to strings
                if isinstance(value, pd.Timestamp):
                    value = value.strftime('%Y-%m-%d')
                # Convert numpy types to Python types
                elif hasattr(value, 'item'):
                    value = value.item()

                fields[field] = value

        # Add sync metadata
        fields['sync_date'] = datetime.now().isoformat()

        return {"fields": fields}

    def batch_create_records(self, records):
        """Create multiple records in batches"""
        created_count = 0
        failed_count = 0

        for i in range(0, len(records), self.batch_size):
            batch = records[i:i + self.batch_size]

            try:
                payload = {"records": batch}
                response = requests.post(self.base_url, headers=self.headers, json=payload)
                response.raise_for_status()

                created_count += len(batch)
                print(f"   ✅ Created batch {i//self.batch_size + 1}: {len(batch)} records")

                time.sleep(0.2)  # Rate limiting

            except requests.exceptions.RequestException as e:
                failed_count += len(batch)
                print(f"   ❌ Failed batch {i//self.batch_size + 1}: {e}")

        return created_count, failed_count

    def batch_update_records(self, records):
        """Update multiple records in batches"""
        updated_count = 0
        failed_count = 0

        for i in range(0, len(records), self.batch_size):
            batch = records[i:i + self.batch_size]

            try:
                payload = {"records": batch}
                response = requests.patch(self.base_url, headers=self.headers, json=payload)
                response.raise_for_status()

                updated_count += len(batch)
                print(f"   ✅ Updated batch {i//self.batch_size + 1}: {len(batch)} records")

                time.sleep(0.2)  # Rate limiting

            except requests.exceptions.RequestException as e:
                failed_count += len(batch)
                print(f"   ❌ Failed batch {i//self.batch_size + 1}: {e}")

        return updated_count, failed_count

    def sync_data(self, csv_file):
        """Sync CSV data to Airtable"""
        print("\n" + "=" * 60)
        print("Starting Airtable Sync")
        print("=" * 60)

        # Load CSV data
        try:
            df = pd.read_csv(csv_file, encoding='utf-8')
            print(f"📄 Loaded {len(df)} records from {csv_file}")
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            return

        # Get existing records
        existing_records = self.get_existing_records()
        uid_map = self.create_uid_map(existing_records)

        # Separate records for create vs update
        records_to_create = []
        records_to_update = []

        for _, row in df.iterrows():
            uid = row.get('uid')

            if uid and uid in uid_map:
                # Update existing record
                record = self.prepare_record_for_airtable(row)
                record['id'] = uid_map[uid]
                records_to_update.append(record)
            else:
                # Create new record
                record = self.prepare_record_for_airtable(row)
                records_to_create.append(record)

        print(f"\n📊 Sync Plan:")
        print(f"   • Records to create: {len(records_to_create)}")
        print(f"   • Records to update: {len(records_to_update)}")

        # Execute sync
        if records_to_create:
            print(f"\n🆕 Creating new records...")
            created, failed = self.batch_create_records(records_to_create)
            print(f"   Summary: {created} created, {failed} failed")

        if records_to_update:
            print(f"\n🔄 Updating existing records...")
            updated, failed = self.batch_update_records(records_to_update)
            print(f"   Summary: {updated} updated, {failed} failed")

        print("\n✅ Sync completed!")

        # Save sync log
        self.save_sync_log(len(records_to_create), len(records_to_update))

    def save_sync_log(self, created, updated):
        """Save sync operation log"""
        log_file = '../logs/airtable_sync.json'
        os.makedirs(os.path.dirname(log_file), exist_ok=True)

        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "records_created": created,
            "records_updated": updated,
            "base_id": self.config['base_id'],
            "table_name": self.config['table_name']
        }

        # Load existing log
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                log_data = json.load(f)
        else:
            log_data = {"sync_history": []}

        # Append new entry
        log_data["sync_history"].append(log_entry)

        # Keep only last 100 entries
        log_data["sync_history"] = log_data["sync_history"][-100:]

        # Save updated log
        with open(log_file, 'w') as f:
            json.dump(log_data, f, indent=2)

        print(f"📝 Sync log saved to {log_file}")


def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description='Airtable Sync Tool')
    parser.add_argument('--input', default='../source/Management_Panel_Live.csv',
                        help='Input CSV file path')
    parser.add_argument('--config', default='airtable_config.json',
                        help='Airtable configuration file')
    args = parser.parse_args()

    # Check if input file exists
    if not os.path.exists(args.input):
        print(f"❌ Input file not found: {args.input}")
        print("   Please run google_sheets_sync.py first to generate data")
        return

    # Initialize sync
    sync = AirtableSync(args.config)

    # Check configuration
    if not sync.config.get('api_key') or sync.config['api_key'] == 'YOUR_API_KEY_HERE':
        print("\n⚠️  Airtable configuration needed!")
        print("   Please update scripts/airtable_config.json with:")
        print("   • API Key: Get from https://airtable.com/create/tokens")
        print("   • Base ID: Get from https://airtable.com/api")
        print("   • Table Name: Your Airtable table name")
        print("\n   Or set environment variables:")
        print("   • export AIRTABLE_API_KEY=your_key")
        print("   • export AIRTABLE_BASE_ID=your_base_id")
        print("   • export AIRTABLE_TABLE_NAME=ManagementPanel")
        return

    # Run sync
    sync.sync_data(args.input)

if __name__ == "__main__":
    main()