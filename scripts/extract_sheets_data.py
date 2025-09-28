#!/usr/bin/env python3
"""
Google Sheets Data Extraction Script
Extract and process data from Seoul and Suwon management tabs
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
import re

# Configuration
FIELD_MAPPING_FILE = 'field_mapping.json'
OUTPUT_DIR = '../source'

def load_field_mapping():
    """Load field mapping configuration"""
    mapping_file = os.path.join(os.path.dirname(__file__), FIELD_MAPPING_FILE)

    # Default mapping if file doesn't exist
    default_mapping = {
        "korean_to_english": {
            "UID": "uid",
            "이름": "name",
            "전화번호": "phone",
            "이메일": "email",
            "성별": "gender",
            "생년월일": "birth_date",
            "국적": "nationality",
            "거주지역": "residence_area",
            "예약 날짜": "reservation_date",
            "시스템 예약 시간대": "reservation_time_slot",
            "실제 예약 시간": "actual_reservation_time",
            "예약 위치": "reservation_location",
            "예약 상태": "reservation_status",
            "참여 여부 결과": "participation_result",
            "참여 날짜": "participation_date",
            "참여 시간": "participation_time",
            "확인 상태": "confirmation_status",
            "참여 노트": "participation_notes",
            "매칭 키": "matching_key",
            "매칭 타입": "matching_type",
            "매칭 신뢰도": "matching_confidence",
            "데이터 소스": "data_source"
        },
        "value_mapping": {
            "gender": {
                "남": "Male", "남성": "Male", "Male": "Male", "M": "Male",
                "여": "Female", "여성": "Female", "Female": "Female", "F": "Female"
            },
            "participation_result": {
                "참여": "participated",
                "참가": "participated",
                "완료": "participated",
                "O": "participated",
                "o": "participated",
                "불참": "not_participated",
                "미참": "not_participated",
                "X": "not_participated",
                "x": "not_participated",
                "보류": "pending",
                "대기": "pending",
                "미정": "pending",
                "취소": "cancelled",
                "철회": "cancelled"
            },
            "confirmation_status": {
                "o": "confirmed",
                "O": "confirmed",
                "x": "not_confirmed",
                "X": "not_confirmed",
                "": "pending",
                "대기": "pending"
            }
        }
    }

    if os.path.exists(mapping_file):
        with open(mapping_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # Create the mapping file
        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(default_mapping, f, ensure_ascii=False, indent=2)
        return default_mapping

def normalize_phone(phone):
    """Normalize phone number format"""
    if pd.isna(phone):
        return None

    # Remove all non-numeric characters
    phone = re.sub(r'[^0-9]', '', str(phone))

    # Add country code if missing
    if phone.startswith('10') and len(phone) == 10:
        phone = '0' + phone
    elif phone.startswith('82'):
        phone = '0' + phone[2:]

    # Format as 010-XXXX-XXXX
    if len(phone) == 11 and phone.startswith('01'):
        return f"{phone[:3]}-{phone[3:7]}-{phone[7:]}"

    return phone

def normalize_date(date_str):
    """Normalize date format to YYYY-MM-DD"""
    if pd.isna(date_str):
        return None

    date_str = str(date_str).strip()

    # Try different date formats
    formats = [
        '%Y-%m-%d',
        '%Y/%m/%d',
        '%d/%m/%Y',
        '%d-%m-%Y',
        '%Y.%m.%d',
        '%d.%m.%Y'
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except:
            continue

    return date_str

def normalize_time(time_str):
    """Normalize time format to HH:MM:SS"""
    if pd.isna(time_str):
        return None

    time_str = str(time_str).strip()

    # Remove AM/PM indicators and convert
    time_str = time_str.replace('오전', 'AM').replace('오후', 'PM')

    # Try different time formats
    formats = [
        '%H:%M:%S',
        '%H:%M',
        '%I:%M %p',
        '%I:%M:%S %p'
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(time_str, fmt)
            return dt.strftime('%H:%M:%S')
        except:
            continue

    # If just hour:minute, add seconds
    if re.match(r'^\d{1,2}:\d{2}$', time_str):
        return time_str + ':00'

    return time_str

def process_csv_data(file_path, location, mapping):
    """Process CSV file and apply field mapping"""
    try:
        # Try different encodings
        for encoding in ['utf-8', 'cp949', 'euc-kr']:
            try:
                df = pd.read_csv(file_path, encoding=encoding)
                print(f"Successfully read {file_path} with {encoding} encoding")
                break
            except:
                continue
        else:
            print(f"Failed to read {file_path}")
            return None

        # Add data source
        df['데이터 소스'] = location

        # Rename columns based on mapping
        korean_to_english = mapping['korean_to_english']
        df.rename(columns=korean_to_english, inplace=True)

        # Apply value mappings
        value_mapping = mapping['value_mapping']

        # Map gender
        if 'gender' in df.columns and 'gender' in value_mapping:
            df['gender'] = df['gender'].map(value_mapping['gender']).fillna(df['gender'])

        # Map participation result
        if 'participation_result' in df.columns and 'participation_result' in value_mapping:
            df['participation_result'] = df['participation_result'].map(
                value_mapping['participation_result']
            ).fillna(df['participation_result'])

        # Map confirmation status
        if 'confirmation_status' in df.columns and 'confirmation_status' in value_mapping:
            df['confirmation_status'] = df['confirmation_status'].map(
                value_mapping['confirmation_status']
            ).fillna(df['confirmation_status'])

        # Normalize phone numbers
        if 'phone' in df.columns:
            df['phone'] = df['phone'].apply(normalize_phone)

        # Normalize dates
        date_columns = ['birth_date', 'reservation_date', 'participation_date']
        for col in date_columns:
            if col in df.columns:
                df[col] = df[col].apply(normalize_date)

        # Normalize times
        time_columns = ['actual_reservation_time', 'participation_time']
        for col in time_columns:
            if col in df.columns:
                df[col] = df[col].apply(normalize_time)

        # Add system fields
        df['created_at'] = datetime.now().isoformat()
        df['updated_at'] = datetime.now().isoformat()
        df['processing_status'] = 'imported'
        df['sync_date'] = datetime.now().isoformat()

        return df

    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return None

def remove_duplicates(df):
    """Remove duplicates based on UID"""
    if df is None or df.empty:
        return df

    # Sort by updated_at (newest first) to keep the latest record
    if 'updated_at' in df.columns:
        df = df.sort_values('updated_at', ascending=False)

    # Remove duplicates keeping the first (newest) occurrence
    if 'uid' in df.columns:
        df = df.drop_duplicates(subset=['uid'], keep='first')
        print(f"Removed duplicates. Remaining records: {len(df)}")

    return df

def sort_data(df):
    """Sort data by reservation_date and reservation_time_slot"""
    if df is None or df.empty:
        return df

    sort_columns = []
    if 'reservation_date' in df.columns:
        sort_columns.append('reservation_date')
    if 'reservation_time_slot' in df.columns:
        sort_columns.append('reservation_time_slot')
    if 'uid' in df.columns:
        sort_columns.append('uid')

    if sort_columns:
        df = df.sort_values(sort_columns, ascending=True)
        print(f"Sorted by: {', '.join(sort_columns)}")

    return df

def generate_statistics(df):
    """Generate statistics for the processed data"""
    if df is None or df.empty:
        return {}

    stats = {
        'total_records': len(df),
        'unique_uids': df['uid'].nunique() if 'uid' in df.columns else 0,
        'data_sources': df['data_source'].value_counts().to_dict() if 'data_source' in df.columns else {},
        'participation_status': df['participation_result'].value_counts().to_dict() if 'participation_result' in df.columns else {},
        'gender_distribution': df['gender'].value_counts().to_dict() if 'gender' in df.columns else {},
        'processing_timestamp': datetime.now().isoformat()
    }

    return stats

def main():
    """Main execution function"""
    print("=" * 50)
    print("Google Sheets Data Extraction Tool")
    print("=" * 50)

    # Load field mapping
    mapping = load_field_mapping()
    print(f"Loaded field mapping with {len(mapping['korean_to_english'])} fields")

    # Process Seoul data
    print("\n📍 Processing Seoul data...")
    seoul_file = os.path.join(OUTPUT_DIR, '참가자 모집상황표(공유용) - 서울 관리 (3).csv')
    seoul_df = None
    if os.path.exists(seoul_file):
        seoul_df = process_csv_data(seoul_file, '서울', mapping)
        if seoul_df is not None:
            print(f"  - Loaded {len(seoul_df)} records from Seoul")
    else:
        print(f"  - Seoul file not found: {seoul_file}")

    # Process Suwon data (if exists)
    print("\n📍 Processing Suwon data...")
    suwon_file = os.path.join(OUTPUT_DIR, '참가자 모집상황표(공유용) - 수원 관리.csv')
    suwon_df = None
    if os.path.exists(suwon_file):
        suwon_df = process_csv_data(suwon_file, '수원', mapping)
        if suwon_df is not None:
            print(f"  - Loaded {len(suwon_df)} records from Suwon")
    else:
        print(f"  - Suwon file not found: {suwon_file}")

    # Combine data
    print("\n🔄 Combining data...")
    dfs_to_combine = [df for df in [seoul_df, suwon_df] if df is not None]

    if dfs_to_combine:
        combined_df = pd.concat(dfs_to_combine, ignore_index=True)
        print(f"  - Combined total: {len(combined_df)} records")

        # Remove duplicates
        print("\n🧹 Removing duplicates...")
        combined_df = remove_duplicates(combined_df)

        # Sort data
        print("\n📊 Sorting data...")
        combined_df = sort_data(combined_df)

        # Generate statistics
        print("\n📈 Generating statistics...")
        stats = generate_statistics(combined_df)

        # Save processed data
        output_file = os.path.join(OUTPUT_DIR, 'Management_Panel_Data.csv')
        combined_df.to_csv(output_file, index=False, encoding='utf-8')
        print(f"\n✅ Saved processed data to: {output_file}")

        # Save statistics
        stats_file = os.path.join(OUTPUT_DIR, 'Management_Panel_Stats.json')
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
        print(f"✅ Saved statistics to: {stats_file}")

        # Print summary
        print("\n" + "=" * 50)
        print("Summary:")
        print(f"  - Total records: {stats['total_records']}")
        print(f"  - Unique UIDs: {stats['unique_uids']}")
        if stats['data_sources']:
            print("  - Data sources:")
            for source, count in stats['data_sources'].items():
                print(f"    • {source}: {count}")
        if stats['participation_status']:
            print("  - Participation status:")
            for status, count in stats['participation_status'].items():
                print(f"    • {status}: {count}")
        print("=" * 50)

    else:
        print("❌ No data to process")

    print("\n✅ Processing complete!")

if __name__ == "__main__":
    main()