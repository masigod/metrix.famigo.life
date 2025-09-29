#!/usr/bin/env python3
"""
Simple Google Sheets Data Fetcher
Fetches data from Google Sheets using CSV export URL
No authentication required for public sheets
"""

import os
import json
import csv
import sys
from datetime import datetime
from pathlib import Path
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
CACHE_DIR = Path('../cache')
CACHE_DIR.mkdir(exist_ok=True)

def fetch_google_sheets_csv(spreadsheet_id, gid=None):
    """Fetch Google Sheets data as CSV using export URL"""

    # Build export URL
    if gid:
        url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}"
    else:
        url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"

    print(f"Fetching from: {url}")

    try:
        response = requests.get(url)
        response.raise_for_status()

        # Parse CSV
        lines = response.text.splitlines()
        reader = csv.DictReader(lines)
        data = list(reader)

        print(f"Successfully fetched {len(data)} records")
        return data

    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []

def normalize_field_names(data):
    """Normalize Korean field names to English"""
    field_mapping = {
        # Basic information
        '이름': 'name',
        '성함': 'name',
        '전화번호': 'phone',
        '휴대폰': 'phone',
        '연락처': 'phone',
        '이메일': 'email',
        '성별': 'gender',
        '생년월일': 'birth_date',
        '나이': 'age',

        # Reservation information
        '예약일': 'reservation_date',
        '예약날짜': 'reservation_date',
        '예약시간': 'reservation_time_slot',
        '시간대': 'reservation_time_slot',
        '예약지점': 'reservation_location',
        '지점': 'reservation_location',
        '위치': 'reservation_location',

        # Participation status
        '참여여부': 'participation_result',
        '참여상태': 'participation_result',
        '상태': 'participation_result',
        '확정여부': 'confirmation_status',
        '확정상태': 'confirmation_status',

        # Additional fields
        '메모': 'notes',
        '비고': 'notes',
        '특이사항': 'notes',
        '가입경로': 'signup_channel',
        '신청경로': 'signup_channel',
        '데이터소스': 'data_source',
        '소스': 'data_source',
    }

    normalized_data = []
    for record in data:
        normalized_record = {}

        for key, value in record.items():
            # Clean the key
            clean_key = key.strip() if key else ''

            # Find English equivalent
            english_key = field_mapping.get(clean_key, clean_key)

            # Clean and normalize value
            clean_value = value.strip() if value else ''
            normalized_value = normalize_value(english_key, clean_value)

            normalized_record[english_key] = normalized_value

        # Generate UID if not present
        if 'uid' not in normalized_record or not normalized_record['uid']:
            name = normalized_record.get('name', '')
            phone = normalized_record.get('phone', '')
            if name and phone:
                # Use last 4 digits of phone
                phone_digits = ''.join(filter(str.isdigit, phone))
                if len(phone_digits) >= 4:
                    normalized_record['uid'] = f"{name}_{phone_digits[-4:]}"
                else:
                    normalized_record['uid'] = f"{name}_{phone}"

        # Add metadata
        normalized_record['sync_timestamp'] = datetime.now().isoformat()
        normalized_record['processing_status'] = 'synced'

        normalized_data.append(normalized_record)

    return normalized_data

def normalize_value(field_name, value):
    """Normalize specific field values"""
    if not value:
        return ''

    value = str(value).strip()

    # Normalize gender
    if field_name == 'gender':
        if value in ['남', '남자', 'M', 'm', '남성', 'Male']:
            return 'Male'
        elif value in ['여', '여자', 'F', 'f', '여성', 'Female']:
            return 'Female'
        return value

    # Normalize location
    if field_name == 'reservation_location':
        if '서울' in value or 'Seoul' in value.upper():
            return 'Seoul'
        elif '수원' in value or 'Suwon' in value.upper():
            return 'Suwon'
        return value

    # Normalize participation status
    if field_name == 'participation_result':
        value_lower = value.lower()
        if '참여' in value or 'participated' in value_lower or value == 'O' or value == '✓':
            return 'participated'
        elif '미참여' in value or 'not' in value_lower or value == 'X':
            return 'not_participated'
        elif '대기' in value or 'pending' in value_lower:
            return 'pending'
        elif '취소' in value or 'cancel' in value_lower:
            return 'cancelled'
        return value

    # Normalize confirmation status
    if field_name == 'confirmation_status':
        value_lower = value.lower()
        if '확정' in value or 'confirmed' in value_lower or value == 'O':
            return 'confirmed'
        elif '미확정' in value or 'not' in value_lower or value == 'X':
            return 'not_confirmed'
        return value

    # Normalize date format
    if field_name == 'reservation_date' and value:
        # Try to parse and reformat date
        try:
            # Handle various date formats
            for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y', '%Y.%m.%d']:
                try:
                    date_obj = datetime.strptime(value, fmt)
                    return date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    continue
        except:
            pass
        return value

    # Normalize phone numbers
    if field_name == 'phone':
        # Remove non-numeric characters
        phone_digits = ''.join(filter(str.isdigit, value))
        if len(phone_digits) >= 10:
            # Format as 010-XXXX-XXXX
            if len(phone_digits) == 11:
                return f"{phone_digits[:3]}-{phone_digits[3:7]}-{phone_digits[7:]}"
            elif len(phone_digits) == 10:
                return f"{phone_digits[:3]}-{phone_digits[3:6]}-{phone_digits[6:]}"
        return value

    return value

def save_to_json(data, filename='sheets_data.json'):
    """Save data to JSON file"""
    cache_file = CACHE_DIR / filename

    output = {
        'timestamp': datetime.now().isoformat(),
        'record_count': len(data),
        'data': data
    }

    with open(cache_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(data)} records to {cache_file}")

def save_to_csv(data, filename='sheets_data.csv'):
    """Save data to CSV file"""
    if not data:
        print("No data to save")
        return

    csv_file = CACHE_DIR / filename

    # Get all unique keys
    all_keys = set()
    for record in data:
        all_keys.update(record.keys())

    # Sort keys for consistent output
    fieldnames = sorted(list(all_keys))

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"Saved CSV to {csv_file}")

def main():
    """Main function"""

    # Load configuration
    config_file = Path('google_sheets_config.json')
    if not config_file.exists():
        print("Error: google_sheets_config.json not found")
        return []

    with open(config_file, 'r') as f:
        config = json.load(f)

    spreadsheet_id = config.get('spreadsheet_id')
    if not spreadsheet_id:
        print("Error: spreadsheet_id not found in config")
        return []

    all_data = []

    # Fetch data from each sheet
    for sheet_name, sheet_config in config.get('sheets', {}).items():
        print(f"\nFetching {sheet_name} sheet...")

        gid = sheet_config.get('gid')
        if not gid:
            print(f"Warning: No GID for {sheet_name}, skipping...")
            continue

        # Fetch data
        raw_data = fetch_google_sheets_csv(spreadsheet_id, gid)

        if raw_data:
            # Normalize the data
            normalized = normalize_field_names(raw_data)

            # Add source info
            for record in normalized:
                record['data_source'] = sheet_name

            all_data.extend(normalized)
            print(f"Processed {len(normalized)} records from {sheet_name}")

    # Remove duplicates based on UID
    unique_data = {}
    for record in all_data:
        uid = record.get('uid')
        if uid:
            # Keep the first occurrence (or you could merge them)
            if uid not in unique_data:
                unique_data[uid] = record
        else:
            # Records without UID are kept as-is
            import uuid
            temp_uid = str(uuid.uuid4())
            record['uid'] = temp_uid
            unique_data[temp_uid] = record

    final_data = list(unique_data.values())

    print(f"\nTotal unique records: {len(final_data)}")

    # Save to files
    save_to_json(final_data)
    save_to_csv(final_data)

    # Print summary
    if final_data:
        # Count by location
        locations = {}
        for record in final_data:
            loc = record.get('reservation_location', 'Unknown')
            locations[loc] = locations.get(loc, 0) + 1

        print("\nBy Location:")
        for loc, count in locations.items():
            print(f"  {loc}: {count}")

        # Count by status
        statuses = {}
        for record in final_data:
            status = record.get('participation_result', 'Unknown')
            statuses[status] = statuses.get(status, 0) + 1

        print("\nBy Status:")
        for status, count in statuses.items():
            print(f"  {status}: {count}")

    return final_data

if __name__ == "__main__":
    main()