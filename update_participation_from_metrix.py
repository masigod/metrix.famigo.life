#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
from difflib import SequenceMatcher

def normalize_name(name):
    """이름 정규화 - 공백 제거, 소문자 변환"""
    if pd.isna(name):
        return ""
    return str(name).strip().lower().replace(" ", "")

def similarity(a, b):
    """두 문자열의 유사도 계산"""
    return SequenceMatcher(None, a, b).ratio()

def find_best_match(name, name_list, threshold=0.8):
    """
    이름 목록에서 가장 유사한 이름 찾기
    threshold: 최소 유사도 (기본 80%)
    """
    if not name:
        return None

    normalized_name = normalize_name(name)
    best_match = None
    best_score = 0

    for idx, candidate in enumerate(name_list):
        normalized_candidate = normalize_name(candidate)
        score = similarity(normalized_name, normalized_candidate)

        if score > best_score and score >= threshold:
            best_score = score
            best_match = idx

    return best_match

def update_participation_from_metrix():
    """
    Metrix matching 파일들의 참여 여부 결과를 K-Beauty 패널 데이터에 업데이트
    - 이름 기준 매칭
    - 중복 시 '참여' 우선
    """

    # 파일 경로
    panel_file = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Filtered.csv'
    metrix_seoul = '/Users/owlers_dylan/Metrix/source/Metrix_matching_seoul.csv'
    metrix_suwon = '/Users/owlers_dylan/Metrix/source/Metrix_matching_suwon.csv'

    print("데이터 파일 읽기...")

    # K-Beauty 패널 데이터 읽기
    panel_df = pd.read_csv(panel_file, encoding='utf-8-sig')
    initial_count = len(panel_df)
    print(f"K-Beauty 패널 데이터: {initial_count}개 레코드")

    # Metrix 데이터 읽기
    print("\nMetrix 데이터 읽기...")

    # 헤더를 명시적으로 지정
    column_names = ['no', '참여장소', '예약 날짜', '시스템 예약 시간대', '확정 예약시간',
                   'UID', '이름', 'NAME', '성별(Q2)', '연령대(Q3)', '국적(Q1_R)',
                   '국가명(Q1_0)', '연락처', '참여 여부 결과', '그룹ID', '확인된 그룹ID(~9/20)',
                   '설문링크', 'seq', '메트릭스_국적(Q1_R)', '메트릭스_성별(Q2)',
                   '메트릭스_연령대(Q3)', '사전신청서내 UID', '메일 발송 여부']

    # 서울 데이터 읽기 (4번째 행부터 데이터)
    seoul_df = pd.read_csv(metrix_seoul, skiprows=4, encoding='utf-8-sig',
                           names=column_names[:22])  # 서울은 22개 컬럼

    # 수원 데이터 읽기 (4번째 행부터 데이터)
    suwon_df = pd.read_csv(metrix_suwon, skiprows=4, encoding='utf-8-sig',
                          names=column_names)  # 수원은 23개 컬럼 (메일 발송 여부 포함)

    print(f"Metrix Seoul: {len(seoul_df)}개 레코드")
    print(f"Metrix Suwon: {len(suwon_df)}개 레코드")

    # 컬럼 이름 정리
    panel_df.columns = panel_df.columns.str.strip()

    # 컬럼 확인
    print(f"\nSeoul 컬럼: {list(seoul_df.columns[:10])}")
    print(f"Suwon 컬럼: {list(suwon_df.columns[:10])}")

    # Metrix 데이터 통합
    print("\nMetrix 데이터 통합 중...")
    metrix_df = pd.concat([seoul_df, suwon_df], ignore_index=True)

    # 유효한 데이터만 필터링
    metrix_df = metrix_df[metrix_df['이름'].notna()]
    print(f"통합된 Metrix 데이터: {len(metrix_df)}개 레코드")

    # 이름별 참여 여부 집계 (참여 우선)
    print("\n이름별 참여 여부 집계 중...")
    participation_dict = {}

    for _, row in metrix_df.iterrows():
        name = row['이름']
        participation = row['참여 여부 결과']

        if pd.notna(name) and pd.notna(participation):
            normalized = normalize_name(name)

            if normalized not in participation_dict:
                participation_dict[normalized] = {
                    'original_name': name,
                    'participation': participation,
                    'count': 1
                }
            else:
                # 중복인 경우
                participation_dict[normalized]['count'] += 1
                # '참여'가 우선
                if participation == '참여':
                    participation_dict[normalized]['participation'] = '참여'
                elif participation_dict[normalized]['participation'] != '참여':
                    participation_dict[normalized]['participation'] = participation

    print(f"고유한 이름 수: {len(participation_dict)}")

    # 중복 이름 확인
    duplicates = {k: v for k, v in participation_dict.items() if v['count'] > 1}
    if duplicates:
        print(f"\n중복 이름 발견: {len(duplicates)}개")
        for key, value in list(duplicates.items())[:5]:
            print(f"  - {value['original_name']}: {value['count']}번 나타남 → '{value['participation']}'로 설정")

    # K-Beauty 패널 데이터 업데이트
    print("\nK-Beauty 패널 데이터 업데이트 중...")
    updated_count = 0
    match_details = []

    # 참여여부결과 컬럼이 없으면 생성
    if '참여여부결과' not in panel_df.columns:
        panel_df['참여여부결과'] = np.nan

    # 이전 값 저장
    panel_df['참여여부결과_이전'] = panel_df['참여여부결과']

    for idx, row in panel_df.iterrows():
        panel_name = row['이름']

        if pd.notna(panel_name):
            normalized_panel = normalize_name(panel_name)

            # 정확한 매칭 먼저 시도
            if normalized_panel in participation_dict:
                new_value = participation_dict[normalized_panel]['participation']
                old_value = panel_df.at[idx, '참여여부결과']

                panel_df.at[idx, '참여여부결과'] = new_value
                updated_count += 1

                match_details.append({
                    'panel_name': panel_name,
                    'metrix_name': participation_dict[normalized_panel]['original_name'],
                    'old_value': old_value,
                    'new_value': new_value,
                    'match_type': 'exact'
                })
            else:
                # 유사도 매칭 시도 (80% 이상)
                metrix_names = [participation_dict[k]['original_name'] for k in participation_dict.keys()]
                best_match_idx = find_best_match(panel_name, metrix_names, threshold=0.8)

                if best_match_idx is not None:
                    matched_name = metrix_names[best_match_idx]
                    normalized_matched = normalize_name(matched_name)
                    new_value = participation_dict[normalized_matched]['participation']
                    old_value = panel_df.at[idx, '참여여부결과']

                    panel_df.at[idx, '참여여부결과'] = new_value
                    updated_count += 1

                    match_details.append({
                        'panel_name': panel_name,
                        'metrix_name': matched_name,
                        'old_value': old_value,
                        'new_value': new_value,
                        'match_type': 'fuzzy'
                    })

    # 업데이트 결과 요약
    print(f"\n=== 업데이트 결과 ===")
    print(f"업데이트된 레코드: {updated_count}개")

    # 참여여부결과 변경 통계
    changed_df = panel_df[panel_df['참여여부결과'] != panel_df['참여여부결과_이전']]
    print(f"실제 변경된 레코드: {len(changed_df)}개")

    if len(changed_df) > 0:
        print("\n변경 내역 상위 10개:")
        for i, (_, row) in enumerate(changed_df.head(10).iterrows()):
            print(f"  {i+1}. {row['이름']}: {row['참여여부결과_이전']} → {row['참여여부결과']}")

    # 최종 참여여부결과 분포
    print("\n최종 참여여부결과 분포:")
    value_counts = panel_df['참여여부결과'].value_counts()
    for value, count in value_counts.items():
        print(f"  - {value}: {count}개")

    # 임시 컬럼 제거
    panel_df = panel_df.drop('참여여부결과_이전', axis=1)

    # 결과 저장
    output_file = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Updated.csv'
    panel_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\n업데이트 완료: {output_file}")

    # 매칭 상세 정보 저장
    if match_details:
        match_df = pd.DataFrame(match_details)
        match_file = '/Users/owlers_dylan/Metrix/source/matching_details.csv'
        match_df.to_csv(match_file, index=False, encoding='utf-8-sig')
        print(f"매칭 상세 정보: {match_file}")

    return panel_df

if __name__ == "__main__":
    result = update_participation_from_metrix()
    print("\n작업 완료!")