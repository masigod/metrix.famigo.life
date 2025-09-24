#!/usr/bin/env python3
import pandas as pd
import numpy as np
import re
from difflib import SequenceMatcher
import warnings
warnings.filterwarnings('ignore')

def normalize_phone(phone):
    """전화번호 정규화"""
    if pd.isna(phone):
        return None
    phone = str(phone).strip()
    phone = re.sub(r'[^0-9]', '', phone)

    # 010으로 시작하는 11자리 또는 10자리 번호 정규화
    if len(phone) == 10 and phone.startswith('10'):
        phone = '0' + phone
    elif len(phone) == 11 and phone.startswith('010'):
        pass
    elif len(phone) == 11 and phone.startswith('821'):
        # 국제번호 형식 처리 (82-10-xxxx-xxxx)
        phone = '0' + phone[2:]
    elif len(phone) == 12 and phone.startswith('8210'):
        # 국제번호 형식 처리 (82-10-xxxx-xxxx)
        phone = '0' + phone[2:]
    else:
        # 유효하지 않은 번호는 원본 유지
        pass

    return phone

def normalize_email(email):
    """이메일 정규화"""
    if pd.isna(email):
        return None
    email = str(email).strip().lower()
    if '@' not in email:
        return None
    return email

def calculate_similarity(str1, str2):
    """두 문자열의 유사도 계산"""
    if pd.isna(str1) or pd.isna(str2):
        return 0
    return SequenceMatcher(None, str(str1), str(str2)).ratio()

print("데이터 크로스 체킹 시작...")

# 1. 데이터 로드
print("\n1. K-Beauty 통합 데이터 로드...")
kbeauty_df = pd.read_csv('/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Integrated.csv')
print(f"   - K-Beauty 데이터: {len(kbeauty_df)} 행")

print("\n2. Famigo 데이터 로드...")
famigo_df = pd.read_csv('/Users/owlers_dylan/Metrix/source/famigo_member_Sep_23_2025_1_final_cleaned.csv')
print(f"   - Famigo 데이터: {len(famigo_df)} 행")

# 2. 각 데이터의 컬럼 확인
print("\n3. 데이터 구조 분석...")
print(f"   - K-Beauty 컬럼: {list(kbeauty_df.columns)[:10]}...")
print(f"   - Famigo 컬럼: {list(famigo_df.columns)[:10]}...")

# 3. 전화번호와 이메일 컬럼 찾기
# K-Beauty 데이터의 컬럼 찾기
kbeauty_email_col = None
kbeauty_phone_cols = []

for col in kbeauty_df.columns:
    if '이메일' in col or 'email' in col.lower():
        kbeauty_email_col = col
        break

for col in kbeauty_df.columns:
    if '전화번호' in col or 'phone' in col.lower() or '연락처' in col:
        kbeauty_phone_cols.append(col)

print(f"\n   K-Beauty 이메일 컬럼: {kbeauty_email_col}")
print(f"   K-Beauty 전화번호 컬럼들: {kbeauty_phone_cols}")

# Famigo 데이터의 컬럼 찾기
famigo_email_col = None
famigo_phone_col = None

for col in famigo_df.columns:
    if '이메일' in col or 'email' in col.lower() or 'Email' in col:
        famigo_email_col = col
        break

for col in famigo_df.columns:
    if '전화번호' in col or 'phone' in col.lower() or '연락처' in col or 'Phone' in col or 'Mobile' in col:
        famigo_phone_col = col
        break

print(f"   Famigo 이메일 컬럼: {famigo_email_col}")
print(f"   Famigo 전화번호 컬럼: {famigo_phone_col}")

# 4. 정규화된 키 생성
print("\n4. 매칭을 위한 정규화 키 생성...")

# K-Beauty 데이터 정규화
if kbeauty_email_col:
    kbeauty_df['normalized_email'] = kbeauty_df[kbeauty_email_col].apply(normalize_email)
else:
    kbeauty_df['normalized_email'] = None

# 전화번호가 여러 컬럼에 있을 수 있으므로 첫 번째 유효한 값 사용
kbeauty_df['normalized_phone'] = None
for phone_col in kbeauty_phone_cols:
    if phone_col in kbeauty_df.columns:
        temp_phones = kbeauty_df[phone_col].apply(normalize_phone)
        kbeauty_df['normalized_phone'] = kbeauty_df['normalized_phone'].combine_first(temp_phones)

# Famigo 데이터 정규화
if famigo_email_col:
    famigo_df['normalized_email'] = famigo_df[famigo_email_col].apply(normalize_email)
else:
    famigo_df['normalized_email'] = None

if famigo_phone_col:
    famigo_df['normalized_phone'] = famigo_df[famigo_phone_col].apply(normalize_phone)
else:
    famigo_df['normalized_phone'] = None

# 5. 매칭 수행
print("\n5. 데이터 매칭 수행...")

# 매칭 결과를 저장할 컬럼들 초기화
kbeauty_df['famigo_match_key'] = None
kbeauty_df['match_type'] = '미매칭'
kbeauty_df['match_confidence'] = 0
kbeauty_df['famigo_id'] = None

matched_count = 0
email_matched = 0
phone_matched = 0
both_matched = 0

# Famigo 데이터에 인덱스 기반 ID 생성
famigo_df['famigo_id'] = 'FAM_' + famigo_df.index.astype(str).str.zfill(5)

# 각 K-Beauty 레코드에 대해 Famigo 매칭 찾기
for idx in range(len(kbeauty_df)):
    kb_email = kbeauty_df.loc[idx, 'normalized_email']
    kb_phone = kbeauty_df.loc[idx, 'normalized_phone']

    best_match = None
    best_score = 0
    match_type = None

    # Famigo 데이터와 비교
    for f_idx in range(len(famigo_df)):
        f_email = famigo_df.loc[f_idx, 'normalized_email']
        f_phone = famigo_df.loc[f_idx, 'normalized_phone']
        f_id = famigo_df.loc[f_idx, 'famigo_id']

        email_match = False
        phone_match = False
        score = 0

        # 이메일 매칭 확인
        if kb_email and f_email:
            if kb_email == f_email:
                email_match = True
                score += 50
            else:
                similarity = calculate_similarity(kb_email, f_email)
                if similarity > 0.9:
                    email_match = True
                    score += 40 * similarity

        # 전화번호 매칭 확인
        if kb_phone and f_phone:
            if kb_phone == f_phone:
                phone_match = True
                score += 50
            elif len(kb_phone) >= 10 and len(f_phone) >= 10:
                # 마지막 8자리 비교 (앞자리가 다를 수 있음)
                if kb_phone[-8:] == f_phone[-8:]:
                    phone_match = True
                    score += 40

        # 매칭 타입 결정
        if email_match and phone_match:
            current_match_type = '완전매칭'
            score = 100
        elif email_match:
            current_match_type = '이메일매칭'
        elif phone_match:
            current_match_type = '전화번호매칭'
        else:
            continue

        # 최고 점수 매칭 업데이트
        if score > best_score:
            best_score = score
            best_match = f_id
            match_type = current_match_type

    # 매칭 결과 저장
    if best_match:
        kbeauty_df.loc[idx, 'famigo_match_key'] = best_match
        kbeauty_df.loc[idx, 'match_type'] = match_type
        kbeauty_df.loc[idx, 'match_confidence'] = best_score
        kbeauty_df.loc[idx, 'famigo_id'] = best_match

        matched_count += 1
        if match_type == '완전매칭':
            both_matched += 1
        elif match_type == '이메일매칭':
            email_matched += 1
        elif match_type == '전화번호매칭':
            phone_matched += 1

# 6. 정규화 컬럼 제거 (최종 파일에는 불필요)
kbeauty_df = kbeauty_df.drop(columns=['normalized_email', 'normalized_phone'], errors='ignore')

# 7. 결과 저장
output_path = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Integrated_with_Match.csv'
kbeauty_df.to_csv(output_path, index=False, encoding='utf-8-sig')

# 8. 결과 요약
print("\n=== 매칭 결과 요약 ===")
print(f"전체 K-Beauty 레코드: {len(kbeauty_df)}")
print(f"매칭된 레코드: {matched_count} ({matched_count/len(kbeauty_df)*100:.1f}%)")
print(f"미매칭 레코드: {len(kbeauty_df) - matched_count} ({(len(kbeauty_df) - matched_count)/len(kbeauty_df)*100:.1f}%)")
print(f"\n매칭 타입별 분포:")
print(f"  - 완전매칭 (이메일+전화번호): {both_matched}")
print(f"  - 이메일만 매칭: {email_matched}")
print(f"  - 전화번호만 매칭: {phone_matched}")

# 9. 매칭/미매칭 데이터 별도 저장
matched_df = kbeauty_df[kbeauty_df['match_type'] != '미매칭']
unmatched_df = kbeauty_df[kbeauty_df['match_type'] == '미매칭']

matched_df.to_csv('/Users/owlers_dylan/Metrix/source/K-Beauty_Matched.csv', index=False, encoding='utf-8-sig')
unmatched_df.to_csv('/Users/owlers_dylan/Metrix/source/K-Beauty_Unmatched.csv', index=False, encoding='utf-8-sig')

print(f"\n파일 저장 완료:")
print(f"  - 전체 (매칭키 포함): {output_path}")
print(f"  - 매칭 데이터만: /Users/owlers_dylan/Metrix/source/K-Beauty_Matched.csv")
print(f"  - 미매칭 데이터만: /Users/owlers_dylan/Metrix/source/K-Beauty_Unmatched.csv")

print("\n매칭 신뢰도 분포:")
confidence_groups = kbeauty_df[kbeauty_df['match_confidence'] > 0]['match_confidence'].value_counts().sort_index(ascending=False)
for confidence, count in confidence_groups.items():
    print(f"  - {confidence}점: {count}건")