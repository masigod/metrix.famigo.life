#!/usr/bin/env python3
import pandas as pd
import numpy as np
import re
from difflib import SequenceMatcher
import warnings
warnings.filterwarnings('ignore')

def normalize_phone(phone):
    if pd.isna(phone):
        return None
    phone = str(phone).strip()
    phone = re.sub(r'[^0-9]', '', phone)
    if len(phone) == 10 and phone.startswith('10'):
        phone = '0' + phone
    elif len(phone) == 11 and phone.startswith('010'):
        pass
    else:
        return None
    return phone

def normalize_email(email):
    if pd.isna(email):
        return None
    email = str(email).strip().lower()
    if '@' not in email:
        return None
    return email

def calculate_similarity(str1, str2):
    if pd.isna(str1) or pd.isna(str2):
        return 0
    return SequenceMatcher(None, str(str1), str(str2)).ratio()

def find_duplicates(df, phone_col='전화번호', email_col='이메일'):
    df = df.copy()

    if phone_col in df.columns:
        df['normalized_phone'] = df[phone_col].apply(normalize_phone)
    else:
        df['normalized_phone'] = None

    if email_col in df.columns:
        df['normalized_email'] = df[email_col].apply(normalize_email)
    else:
        df['normalized_email'] = None

    duplicate_indices = set()

    for i in range(len(df)):
        if i in duplicate_indices:
            continue

        current_phone = df.iloc[i]['normalized_phone']
        current_email = df.iloc[i]['normalized_email']

        for j in range(i + 1, len(df)):
            if j in duplicate_indices:
                continue

            other_phone = df.iloc[j]['normalized_phone']
            other_email = df.iloc[j]['normalized_email']

            phone_match = False
            if current_phone and other_phone:
                phone_match = (current_phone == other_phone)

            email_match = False
            if current_email and other_email:
                similarity = calculate_similarity(current_email, other_email)
                email_match = (current_email == other_email) or (similarity > 0.85)

            if phone_match or email_match:
                duplicate_indices.add(j)

    return duplicate_indices

print("K-Beauty 패널 데이터 CSV 파일 통합 시작...")

file_paths = [
    '/Users/owlers_dylan/Metrix/source/K-Beauty_Skin_Care_Panel_Data_1.csv',
    '/Users/owlers_dylan/Metrix/source/K-Beauty_Skin_Care_Panel_Data_2.csv',
    '/Users/owlers_dylan/Metrix/source/K-Beauty_Skin_Care_Panel_Data_3.csv'
]

all_data = []

for i, file_path in enumerate(file_paths, 1):
    print(f"\n파일 {i} 로딩: {file_path}")
    try:
        df = pd.read_csv(file_path, encoding='utf-8', skiprows=1)
    except:
        try:
            df = pd.read_csv(file_path, encoding='cp949', skiprows=1)
        except:
            df = pd.read_csv(file_path, encoding='euc-kr', skiprows=1)

    print(f"  - 행 수: {len(df)}")
    print(f"  - 컬럼: {list(df.columns)[:5]}...")

    df['source_file'] = f'file_{i}'
    all_data.append(df)

print("\n데이터 통합 중...")
combined_df = pd.concat(all_data, ignore_index=True)
print(f"통합된 총 행 수: {len(combined_df)}")

print("\n중복 제거 시작...")
print("이메일과 전화번호 기반으로 중복 확인 중...")

phone_col = None
email_col = None

for col in combined_df.columns:
    if '전화번호' in col or 'phone' in col.lower() or '연락처' in col:
        phone_col = col
        break

for col in combined_df.columns:
    if '이메일' in col or 'email' in col.lower():
        email_col = col
        break

print(f"  - 전화번호 컬럼: {phone_col}")
print(f"  - 이메일 컬럼: {email_col}")

if phone_col or email_col:
    duplicate_indices = find_duplicates(combined_df, phone_col=phone_col if phone_col else '전화번호', email_col=email_col if email_col else '이메일')
    print(f"발견된 중복 행 수: {len(duplicate_indices)}")
    clean_df = combined_df.drop(index=duplicate_indices).reset_index(drop=True)
else:
    print("전화번호 또는 이메일 컬럼을 찾을 수 없어 중복 제거를 건너뜁니다.")
    clean_df = combined_df

print(f"중복 제거 후 행 수: {len(clean_df)}")

clean_df = clean_df.drop(columns=['source_file'], errors='ignore')

airtable_columns_mapping = {
    '이메일': ['이메일', 'email', 'Email'],
    '이름': ['이름', 'name', 'Name'],
    '전화번호': ['전화번호', '연락처', 'phone', 'Phone'],
    '성별': ['성별', 'gender', 'Gender'],
    '생년': ['생년', '생년월일', 'birth', 'Birth'],
    '국적': ['국적', 'nationality', 'Nationality'],
    '문화권': ['문화권', 'culture', 'Culture'],
    '인종': ['인종', 'race', 'Race'],
    '비자': ['비자', 'visa', 'Visa'],
    '예약 지점': ['예약 지점', '예약지점', 'location', 'Location'],
    '예약 날짜': ['예약 날짜', '예약날짜', 'date', 'Date'],
    '예약시간': ['예약시간', '예약 시간', 'time', 'Time'],
    '참여여부결과': ['참여여부결과', '참여여부', 'participation', 'Participation'],
    '확정 여부': ['확정 여부', '확정여부', 'confirmed', 'Confirmed'],
    '비고': ['비고', 'note', 'Note', '첨언']
}

renamed_columns = {}
for target_col, possible_names in airtable_columns_mapping.items():
    for col in clean_df.columns:
        if any(name in col for name in possible_names):
            renamed_columns[col] = target_col
            break

clean_df.rename(columns=renamed_columns, inplace=True)

important_columns = [
    '이메일', '이름', '전화번호', '성별', '생년', '국적', '문화권',
    '인종', '비자', '예약 지점', '예약 날짜', '예약시간',
    '참여여부결과', '확정 여부', '비고'
]

final_columns = []
for col in important_columns:
    if col in clean_df.columns:
        final_columns.append(col)

for col in clean_df.columns:
    if col not in final_columns and col not in ['normalized_phone', 'normalized_email', 'source_file']:
        final_columns.append(col)

clean_df = clean_df[final_columns]

if 'normalized_phone' in clean_df.columns:
    clean_df = clean_df.drop(columns=['normalized_phone'])
if 'normalized_email' in clean_df.columns:
    clean_df = clean_df.drop(columns=['normalized_email'])

output_path = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Integrated.csv'
clean_df.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f"\n통합 완료!")
print(f"최종 파일: {output_path}")
print(f"총 행 수: {len(clean_df)}")
print(f"총 컬럼 수: {len(clean_df.columns)}")

print("\n데이터 요약:")
print(f"- 원본 파일 1: {len(all_data[0])} 행")
print(f"- 원본 파일 2: {len(all_data[1])} 행")
print(f"- 원본 파일 3: {len(all_data[2])} 행")
print(f"- 통합 후: {len(combined_df)} 행")
print(f"- 중복 제거 후: {len(clean_df)} 행")
if phone_col or email_col:
    print(f"- 제거된 중복: {len(duplicate_indices)} 행")

if '이메일' in clean_df.columns:
    email_filled = clean_df['이메일'].notna().sum()
    print(f"\n이메일 있는 행: {email_filled}/{len(clean_df)}")

if '전화번호' in clean_df.columns:
    phone_filled = clean_df['전화번호'].notna().sum()
    print(f"전화번호 있는 행: {phone_filled}/{len(clean_df)}")

print(f"\n최종 컬럼 목록: {list(clean_df.columns)[:10]}...")