#!/usr/bin/env python3
import pandas as pd
import numpy as np
from difflib import SequenceMatcher
import warnings
warnings.filterwarnings('ignore')

def normalize_name(name):
    """이름 정규화 - 공백, 대소문자 통일"""
    if pd.isna(name):
        return None
    return str(name).strip().lower().replace('  ', ' ')

def calculate_name_similarity(name1, name2):
    """두 이름의 유사도 계산"""
    if pd.isna(name1) or pd.isna(name2):
        return 0

    name1_norm = normalize_name(name1)
    name2_norm = normalize_name(name2)

    if not name1_norm or not name2_norm:
        return 0

    # 완전 일치
    if name1_norm == name2_norm:
        return 1.0

    # 부분 일치 (한 이름이 다른 이름에 포함)
    if name1_norm in name2_norm or name2_norm in name1_norm:
        return 0.9

    # 유사도 계산
    return SequenceMatcher(None, name1_norm, name2_norm).ratio()

print("Participation Result 업데이트 시작...")

# 1. 데이터 로드
print("\n1. 데이터 로드 중...")

# K-Beauty 정규화 데이터
kbeauty_df = pd.read_csv('/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Normalized.csv')
print(f"   - K-Beauty 데이터: {len(kbeauty_df)} 행")

# Metrix Seoul 데이터 로드
metrix_raw = pd.read_csv('/Users/owlers_dylan/Metrix/source/Metrix_matching_seoul.csv')
# 실제 데이터는 1번 행부터 시작 (0번 행이 헤더)
header_row = metrix_raw.iloc[0]
metrix_df = metrix_raw[1:].copy()
metrix_df.columns = header_row
print(f"   - Metrix Seoul 데이터: {len(metrix_df)} 행")

# 2. PANEL5 데이터 필터링
print("\n2. PANEL5 데이터 필터링...")

# 컬럼명 확인 및 정리
print(f"   - 컬럼 수: {len(metrix_df.columns)}")
print(f"   - 주요 컬럼: {list(metrix_df.columns[:10])}")

# 컬럼명이 잘못 파싱된 경우를 대비하여 확인
target_column = None
for col in metrix_df.columns:
    if '확인된' in col and '그룹' in col:
        target_column = col
        break

if not target_column:
    # 직접 컬럼 이름 지정 (16번째 컬럼)
    target_column = metrix_df.columns[15] if len(metrix_df.columns) > 15 else None

print(f"   - 사용할 컬럼: {target_column}")

# PANEL5 관련 데이터 추출
if target_column:
    panel5_df = metrix_df[
        (metrix_df[target_column] == 'PANEL5') |
        (metrix_df[target_column] == 'PANEL5?')
    ].copy()

    print(f"   - PANEL5 관련 레코드: {len(panel5_df)} 건")
    print(f"     • PANEL5: {len(panel5_df[panel5_df[target_column] == 'PANEL5'])} 건")
    print(f"     • PANEL5?: {len(panel5_df[panel5_df[target_column] == 'PANEL5?'])} 건")
else:
    print("   - 오류: 그룹ID 컬럼을 찾을 수 없습니다.")
    panel5_df = pd.DataFrame()

# 이름 필드 확인 (NAME 우선, 없으면 이름 사용)
if len(panel5_df) > 0:
    # 컬럼 인덱스로 접근 (7번째가 NAME, 6번째가 이름)
    name_col = panel5_df.columns[7] if len(panel5_df.columns) > 7 else None
    korean_name_col = panel5_df.columns[6] if len(panel5_df.columns) > 6 else None

    if name_col and korean_name_col:
        panel5_df['매칭이름'] = panel5_df[name_col].fillna(panel5_df[korean_name_col])
    else:
        panel5_df['매칭이름'] = None
else:
    panel5_df['매칭이름'] = None

# 유효한 이름이 있는 레코드만 필터링
valid_panel5 = panel5_df[panel5_df['매칭이름'].notna()].copy()
print(f"   - 유효한 이름이 있는 PANEL5 레코드: {len(valid_panel5)} 건")

# 3. 이름 매칭 및 업데이트
print("\n3. 이름 기준 매칭 시작...")

updated_count = 0
matched_details = []

for idx, kbeauty_row in kbeauty_df.iterrows():
    kbeauty_name = kbeauty_row['name']

    if pd.isna(kbeauty_name):
        continue

    best_match = None
    best_score = 0
    best_panel_row = None

    # PANEL5 데이터와 이름 매칭
    for _, panel_row in valid_panel5.iterrows():
        panel_name = panel_row['매칭이름']

        # 유사도 계산
        similarity = calculate_name_similarity(kbeauty_name, panel_name)

        if similarity > best_score and similarity >= 0.8:  # 80% 이상 유사도
            best_score = similarity
            best_match = panel_name
            best_panel_row = panel_row

    # 매칭된 경우 participation_result 업데이트
    if best_match:
        old_value = kbeauty_df.loc[idx, 'participation_result']
        kbeauty_df.loc[idx, 'participation_result'] = '참여'

        updated_count += 1
        matched_details.append({
            'kbeauty_name': kbeauty_name,
            'matched_name': best_match,
            'similarity': best_score,
            'group_id': best_panel_row[target_column] if target_column else 'PANEL5',
            'old_value': old_value,
            'new_value': '참여'
        })

# 4. 업데이트 결과 출력
print(f"\n4. 업데이트 완료:")
print(f"   - 업데이트된 레코드: {updated_count} 건")

if updated_count > 0:
    print("\n   매칭 상세 (상위 10건):")
    for i, detail in enumerate(matched_details[:10], 1):
        print(f"   {i:2d}. {detail['kbeauty_name'][:30]:30s} ← {detail['matched_name'][:30]:30s} "
              f"(유사도: {detail['similarity']:.2%}, 그룹: {detail['group_id']})")

# 5. participation_result 통계
print("\n5. Participation Result 통계:")
participation_counts = kbeauty_df['participation_result'].value_counts()
for status, count in participation_counts.items():
    print(f"   - {status}: {count} 건")

# 6. 결과 저장
output_path = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Final.csv'
kbeauty_df.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f"\n✅ 최종 파일 저장: {output_path}")
print(f"   총 {len(kbeauty_df)} 행, {updated_count} 건 업데이트")

# 7. 매칭 로그 저장 (검증용)
if matched_details:
    log_df = pd.DataFrame(matched_details)
    log_path = '/Users/owlers_dylan/Metrix/source/participation_update_log.csv'
    log_df.to_csv(log_path, index=False, encoding='utf-8-sig')
    print(f"\n📋 매칭 로그 저장: {log_path}")

# 8. PANEL5 미매칭 레코드 확인
if len(valid_panel5) > 0:
    print("\n📊 PANEL5 데이터 매칭 결과:")
    matched_names = [d['matched_name'] for d in matched_details]
    unmatched_panel5 = valid_panel5[~valid_panel5['매칭이름'].isin(matched_names)]

    if len(unmatched_panel5) > 0:
        print(f"   - 미매칭 PANEL5 레코드: {len(unmatched_panel5)} 건")
        print("   미매칭 이름 샘플:")
        for i, (_, row) in enumerate(unmatched_panel5.head(5).iterrows(), 1):
            group_val = row[target_column] if target_column else 'N/A'
            print(f"     {i}. {row['매칭이름']} (그룹: {group_val})")
    else:
        print("   - 모든 PANEL5 레코드가 매칭되었습니다.")
else:
    print("\n⚠️ PANEL5 데이터를 찾을 수 없습니다.")

print("\n✨ Participation Result 업데이트 완료!")