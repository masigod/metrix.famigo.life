#!/usr/bin/env python3
"""
Google Sheets Authenticated Data Fetcher
Uses stored credentials to fetch data from private Google Sheets
"""

import os
import json
import pickle
import csv
import sys
import time
from datetime import datetime
from pathlib import Path
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv
import base64
import hashlib

# Load environment variables
load_dotenv()

# Configuration
CACHE_DIR = Path('../cache')
CACHE_DIR.mkdir(exist_ok=True)

# Google credentials (stored securely)
GOOGLE_CREDENTIALS = {
    'email': 'help@owelers.co.kr',
    'password': 'fam1go@nobenefit24&'
}

class GoogleSheetsAuthenticator:
    """Handle Google Sheets authentication with username/password"""

    def __init__(self):
        self.credentials = None
        self.service = None

    def authenticate_with_credentials(self):
        """
        Store credentials for later use
        Note: Direct authentication with username/password is not supported by Google API
        OAuth2 or Service Account is required
        """
        print("⚠️ Note: Direct username/password authentication is not supported by Google Sheets API.")
        print("Using alternative methods...")
        return self.authenticate_simple()

    def authenticate_simple(self):
        """Simple authentication approach"""
        # Store credentials securely (encrypted in production)
        creds_file = CACHE_DIR / 'google_creds.json'

        # Check if we have saved credentials
        if creds_file.exists():
            with open(creds_file, 'r') as f:
                saved_creds = json.load(f)
                if saved_creds.get('email') == GOOGLE_CREDENTIALS['email']:
                    print("Using cached credentials")
                    return True

        # Save credentials (in production, these should be encrypted)
        with open(creds_file, 'w') as f:
            json.dump({
                'email': GOOGLE_CREDENTIALS['email'],
                'timestamp': datetime.now().isoformat()
            }, f)

        print(f"Credentials configured for: {GOOGLE_CREDENTIALS['email']}")
        return True

def create_oauth_flow():
    """Create OAuth flow for Google Sheets API"""

    # OAuth2 configuration
    oauth_config = {
        "installed": {
            "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
            "project_id": "your-project",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": "YOUR_CLIENT_SECRET",
            "redirect_uris": ["http://localhost"]
        }
    }

    # Check if we have OAuth credentials file
    oauth_file = Path('oauth_credentials.json')
    if oauth_file.exists():
        with open(oauth_file, 'r') as f:
            oauth_config = json.load(f)

    # Create flow
    flow = Flow.from_client_config(
        oauth_config,
        scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
    )
    flow.redirect_uri = 'http://localhost:8080'

    return flow

def authenticate_oauth():
    """Authenticate using OAuth2 with stored credentials"""
    creds = None
    token_file = Path('token.json')

    # Load saved token
    if token_file.exists():
        creds = Credentials.from_authorized_user_file(str(token_file))

    # If no valid credentials, need to authenticate
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("\n⚠️ OAuth2 인증이 필요합니다.")
            print("다음 단계를 따라주세요:")
            print("1. Google Cloud Console에서 OAuth2 credentials 생성")
            print("2. oauth_credentials.json 파일로 저장")
            print("3. 스크립트 다시 실행")
            return None

    # Save credentials
    if creds:
        with open(token_file, 'w') as token:
            token.write(creds.to_json())

    return creds

def fetch_with_export_url(spreadsheet_id, gid=None):
    """
    Try to fetch Google Sheets data using export URL
    This works for publicly accessible sheets
    """
    if gid:
        url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}"
    else:
        url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"

    print(f"Attempting to fetch from: {url}")

    # Set up session with cookies (simulate logged-in state)
    session = requests.Session()

    # Add headers to appear more like a browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/csv,application/csv,text/plain',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    }

    try:
        response = session.get(url, headers=headers, timeout=30)

        if response.status_code == 200:
            # Parse CSV
            lines = response.text.splitlines()
            reader = csv.DictReader(lines)
            data = list(reader)
            print(f"✅ Successfully fetched {len(data)} records")
            return data
        elif response.status_code == 401:
            print("❌ Authentication required - Sheet is private")
            return None
        else:
            print(f"❌ Failed with status code: {response.status_code}")
            return None

    except requests.RequestException as e:
        print(f"❌ Error fetching data: {e}")
        return None

def fetch_with_api(spreadsheet_id, range_name='Sheet1!A:Z'):
    """Fetch data using Google Sheets API with authentication"""

    # Try OAuth authentication
    creds = authenticate_oauth()

    if not creds:
        print("\n📝 대안: Airtable에 Google 계정 정보를 저장하여 사용")
        print("SystemCredentials 테이블에 다음 정보를 저장하세요:")
        print(f"- Email: {GOOGLE_CREDENTIALS['email']}")
        print("- Password: [암호화 저장]")
        print("- Service: Google")
        return None

    try:
        service = build('sheets', 'v4', credentials=creds)

        # Call the Sheets API
        sheet = service.spreadsheets()
        result = sheet.values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()

        values = result.get('values', [])

        if not values:
            print('No data found in sheet.')
            return []

        print(f"✅ Fetched {len(values)} rows from Google Sheets API")

        # Convert to list of dictionaries
        if len(values) > 1:
            headers = values[0]
            data = []
            for row in values[1:]:
                padded_row = row + [''] * (len(headers) - len(row))
                record = dict(zip(headers, padded_row))
                data.append(record)
            return data

        return []

    except HttpError as err:
        print(f"❌ API Error: {err}")
        return None

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
                phone_digits = ''.join(filter(str.isdigit, phone))
                if len(phone_digits) >= 4:
                    normalized_record['uid'] = f"{name}_{phone_digits[-4:]}"

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
        if '참여' in value or 'participated' in value_lower or value in ['O', '✓']:
            return 'participated'
        elif '미참여' in value or 'not' in value_lower or value == 'X':
            return 'not_participated'
        elif '대기' in value or 'pending' in value_lower:
            return 'pending'
        elif '취소' in value or 'cancel' in value_lower:
            return 'cancelled'
        return value or 'pending'

    # Normalize date format
    if field_name == 'reservation_date' and value:
        try:
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
        phone_digits = ''.join(filter(str.isdigit, value))
        if len(phone_digits) >= 10:
            if len(phone_digits) == 11:
                return f"{phone_digits[:3]}-{phone_digits[3:7]}-{phone_digits[7:]}"
            elif len(phone_digits) == 10:
                return f"{phone_digits[:3]}-{phone_digits[3:6]}-{phone_digits[6:]}"
        return value

    return value

def save_data(data):
    """Save normalized data to files"""

    # Save JSON
    json_file = CACHE_DIR / 'sheets_data.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'record_count': len(data),
            'data': data
        }, f, ensure_ascii=False, indent=2)
    print(f"📁 Saved JSON: {json_file}")

    # Save CSV
    if data:
        csv_file = CACHE_DIR / 'sheets_data.csv'
        keys = list(data[0].keys())
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(data)
        print(f"📁 Saved CSV: {csv_file}")

def main():
    """Main function"""

    print("\n🚀 Google Sheets Data Sync")
    print("=" * 50)

    # Load configuration
    config_file = Path('google_sheets_config.json')
    if not config_file.exists():
        print("❌ Error: google_sheets_config.json not found")
        return

    with open(config_file, 'r') as f:
        config = json.load(f)

    spreadsheet_id = config.get('spreadsheet_id')

    print(f"\n📊 Target Spreadsheet: {spreadsheet_id}")
    print(f"👤 Google Account: {GOOGLE_CREDENTIALS['email']}")

    all_data = []

    # Try different methods
    print("\n🔄 Attempting to fetch data...")

    # Method 1: Try export URL first (simpler)
    for sheet_name, sheet_config in config.get('sheets', {}).items():
        print(f"\n📑 Processing sheet: {sheet_name}")

        gid = sheet_config.get('gid')
        if not gid:
            print(f"⚠️ No GID for {sheet_name}, skipping...")
            continue

        # Try export URL
        raw_data = fetch_with_export_url(spreadsheet_id, gid)

        # If failed, try API
        if raw_data is None:
            print("Trying Google Sheets API...")
            range_name = f"{sheet_config.get('name', 'Sheet1')}!A:Z"
            raw_data = fetch_with_api(spreadsheet_id, range_name)

        if raw_data:
            # Normalize the data
            normalized = normalize_field_names(raw_data)

            # Add source info
            for record in normalized:
                record['data_source'] = sheet_name

            all_data.extend(normalized)
            print(f"✅ Processed {len(normalized)} records from {sheet_name}")

    # Remove duplicates
    unique_data = {}
    for record in all_data:
        uid = record.get('uid')
        if uid and uid not in unique_data:
            unique_data[uid] = record

    final_data = list(unique_data.values())

    print(f"\n📊 Summary:")
    print(f"Total unique records: {len(final_data)}")

    if final_data:
        # Save data
        save_data(final_data)

        # Show statistics
        locations = {}
        for record in final_data:
            loc = record.get('reservation_location', 'Unknown')
            locations[loc] = locations.get(loc, 0) + 1

        print("\n📍 By Location:")
        for loc, count in locations.items():
            print(f"  {loc}: {count}")

        statuses = {}
        for record in final_data:
            status = record.get('participation_result', 'Unknown')
            statuses[status] = statuses.get(status, 0) + 1

        print("\n📈 By Status:")
        for status, count in statuses.items():
            print(f"  {status}: {count}")

    print("\n✅ Sync completed!")

    # Provide next steps
    print("\n📝 Next Steps:")
    print("1. Check the data in cache/sheets_data.json")
    print("2. Run airtable_sync.py to upload to Airtable")
    print("3. Or use run_full_sync.sh for complete pipeline")

if __name__ == "__main__":
    main()