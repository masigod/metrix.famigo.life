#!/usr/bin/env python3
import pandas as pd
import numpy as np
import re
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

print("K-Beauty 데이터 정규화 시작...")

# 1. 데이터 로드
print("\n1. 데이터 로드 중...")
df = pd.read_csv('/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Airtable_Ready.csv')
print(f"   - 원본 데이터: {len(df)} 행")

# 변경 사항 추적
changes = {
    'gender': {'before': 0, 'after': 0},
    'birth_year': {'before': 0, 'after': 0},
    'reservation_location': {'before': 0, 'after': 0},
    'reservation_date': {'before': 0, 'after': 0},
    'reservation_time': {'before': 0, 'after': 0}
}

# 2. Gender 필드 정규화
print("\n2. Gender 필드 정규화...")
gender_mapping = {
    # 영어
    'female': 'Female',
    'male': 'Male',
    'f': 'Female',
    'm': 'Male',

    # 한글
    '여': 'Female',
    '남': 'Male',
    '여자': 'Female',
    '남자': 'Male',
    '여성': 'Female',
    '남성': 'Male',

    # 한자
    '女': 'Female',
    '男': 'Male',

    # 기타 가능한 형식
    '여(female)': 'Female',
    '남(male)': 'Male',
    'woman': 'Female',
    'man': 'Male'
}

def normalize_gender(value):
    if pd.isna(value):
        return None

    value_lower = str(value).strip().lower()

    # 매핑에서 찾기
    for key, mapped_value in gender_mapping.items():
        if key in value_lower:
            return mapped_value

    # 기본 영어 형식 확인
    if value_lower in ['female', 'male']:
        return value_lower.capitalize()

    return value  # 매핑되지 않은 값은 원본 유지

# Gender 변경 전 상태 확인
gender_before = df['gender'].value_counts().to_dict()
print(f"   변경 전 gender 값 분포: {gender_before}")

df['gender'] = df['gender'].apply(normalize_gender)
changes['gender']['after'] = df['gender'].notna().sum()

# Gender 변경 후 상태 확인
gender_after = df['gender'].value_counts().to_dict()
print(f"   변경 후 gender 값 분포: {gender_after}")

# 3. Birth Year 포맷 통일화
print("\n3. Birth Year 포맷 통일화...")

def normalize_birth_year(value):
    if pd.isna(value):
        return None

    value_str = str(value).strip()

    # YYYY-MM-DD 형식에서 연도만 추출
    if '-' in value_str and len(value_str) >= 10:
        try:
            date_obj = pd.to_datetime(value_str, errors='coerce')
            if pd.notna(date_obj):
                return date_obj.strftime('%Y-%m-%d')
        except:
            pass

    # YYYY 형식
    if value_str.isdigit() and len(value_str) == 4:
        year = int(value_str)
        if 1900 <= year <= 2010:
            return f"{year}-01-01"  # 연도만 있으면 01-01 추가

    # YY 형식 (두 자리 연도)
    if value_str.isdigit() and len(value_str) == 2:
        year = int(value_str)
        if year > 50:
            return f"19{year:02d}-01-01"
        else:
            return f"20{year:02d}-01-01"

    return value_str  # 변환 불가능한 경우 원본 유지

birth_year_before = df['birth_year'].notna().sum()
df['birth_year'] = df['birth_year'].apply(normalize_birth_year)
birth_year_after = df['birth_year'].notna().sum()
print(f"   Birth year 정규화: {birth_year_before} → {birth_year_after}")

# 4. Reservation Location 정규화
print("\n4. Reservation Location 정규화...")

def normalize_location(value):
    if pd.isna(value):
        return None

    value_str = str(value).strip()

    # '거부' → 'cancel' 변경
    if '거부' in value_str.lower():
        return 'cancel'

    return value_str

location_before = df['reservation_location'].value_counts().to_dict()
df['reservation_location'] = df['reservation_location'].apply(normalize_location)
location_after = df['reservation_location'].value_counts().to_dict()

if '거부' in location_before:
    print(f"   '거부' → 'cancel' 변경: {location_before.get('거부', 0)} 건")

# 5. Reservation Date 날짜 포맷 통일 및 검증
print("\n5. Reservation Date 날짜 포맷 통일...")

def normalize_date(value):
    if pd.isna(value):
        return None

    value_str = str(value).strip()

    # 날짜가 아닌 텍스트 제거
    if any(keyword in value_str.lower() for keyword in ['거부', 'cancel', '변경', 'change', '대상 아님', 'n/a']):
        return None

    # 다양한 날짜 형식 처리
    date_patterns = [
        r'(\d{4})\.(\d{1,2})\.(\d{1,2})',  # YYYY.MM.DD
        r'(\d{4})-(\d{1,2})-(\d{1,2})',    # YYYY-MM-DD
        r'(\d{4})/(\d{1,2})/(\d{1,2})',    # YYYY/MM/DD
        r'(\d{1,2})/(\d{1,2})/(\d{4})',    # MM/DD/YYYY or DD/MM/YYYY
    ]

    for pattern in date_patterns:
        match = re.search(pattern, value_str)
        if match:
            groups = match.groups()
            try:
                if len(groups[0]) == 4:  # YYYY first
                    year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                else:  # YYYY last
                    day_or_month = int(groups[0])
                    month_or_day = int(groups[1])
                    year = int(groups[2])

                    # 미국식(MM/DD/YYYY) 가정
                    month = day_or_month
                    day = month_or_day

                # 유효성 검사
                if 2024 <= year <= 2026 and 1 <= month <= 12 and 1 <= day <= 31:
                    return f"{year:04d}-{month:02d}-{day:02d}"
            except:
                continue

    return None  # 날짜 형식이 아니면 None

date_before = df['reservation_date'].notna().sum()
df['reservation_date'] = df['reservation_date'].apply(normalize_date)
date_after = df['reservation_date'].notna().sum()
print(f"   날짜 정규화: {date_before} → {date_after} (삭제된 항목: {date_before - date_after})")

# 6. Reservation Time 시간 형식 검증
print("\n6. Reservation Time 시간 형식 검증...")

def normalize_time(value):
    if pd.isna(value):
        return None

    value_str = str(value).strip()

    # 시간이 아닌 텍스트 제거
    if any(keyword in value_str.lower() for keyword in ['거부', 'cancel', '변경', 'change', '대상 아님', 'n/a', 'pending']):
        return None

    # 시간 형식 패턴
    time_patterns = [
        r'^(\d{1,2}):(\d{2})$',           # HH:MM
        r'^(\d{1,2}):(\d{2}):(\d{2})$',   # HH:MM:SS
        r'^(\d{1,2})시(\d{0,2})',          # 한글 형식
        r'^(\d{1,2})h(\d{0,2})',          # 24h format
    ]

    for pattern in time_patterns:
        match = re.match(pattern, value_str)
        if match:
            groups = match.groups()
            hour = int(groups[0])
            minute = int(groups[1]) if len(groups) > 1 and groups[1] else 0

            # 유효성 검사
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                return f"{hour:02d}:{minute:02d}"

    # AM/PM 형식 처리
    am_pm_pattern = r'^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)'
    match = re.match(am_pm_pattern, value_str)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2))
        am_pm = match.group(3).upper()

        if am_pm == 'PM' and hour < 12:
            hour += 12
        elif am_pm == 'AM' and hour == 12:
            hour = 0

        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}"

    return None  # 시간 형식이 아니면 None

time_before = df['reservation_time'].notna().sum()
df['reservation_time'] = df['reservation_time'].apply(normalize_time)
time_after = df['reservation_time'].notna().sum()
print(f"   시간 정규화: {time_before} → {time_after} (삭제된 항목: {time_before - time_after})")

# 7. 결과 저장
output_path = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Normalized.csv'
df.to_csv(output_path, index=False, encoding='utf-8-sig')

# 8. 정규화 요약 출력
print("\n" + "="*60)
print("정규화 작업 완료 요약")
print("="*60)

print(f"\n📊 전체 레코드: {len(df)} 행")

print("\n✅ Gender 필드:")
print(f"   - 고유값: {df['gender'].nunique()}")
print(f"   - 분포: {df['gender'].value_counts().to_dict()}")

print("\n✅ Birth Year 필드:")
print(f"   - 유효한 날짜: {df['birth_year'].notna().sum()} / {len(df)}")
sample_births = df['birth_year'].dropna().head(5).tolist()
print(f"   - 샘플: {sample_births}")

print("\n✅ Reservation Location 필드:")
print(f"   - 고유값: {df['reservation_location'].nunique()}")
location_counts = df['reservation_location'].value_counts().head(5).to_dict()
print(f"   - 상위 5개 값: {location_counts}")

print("\n✅ Reservation Date 필드:")
print(f"   - 유효한 날짜: {df['reservation_date'].notna().sum()} / {len(df)}")
print(f"   - 제거된 항목: {date_before - date_after}")

print("\n✅ Reservation Time 필드:")
print(f"   - 유효한 시간: {df['reservation_time'].notna().sum()} / {len(df)}")
print(f"   - 제거된 항목: {time_before - time_after}")

print(f"\n💾 최종 파일 저장: {output_path}")

# 샘플 데이터 출력
print("\n📋 정규화된 데이터 샘플 (5행):")
sample_cols = ['UID', 'name', 'gender', 'birth_year', 'reservation_location', 'reservation_date', 'reservation_time']
available_cols = [col for col in sample_cols if col in df.columns]
print(df[available_cols].head().to_string(index=False))