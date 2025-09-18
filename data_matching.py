#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from datetime import datetime

# 파일 경로
base_file = '/Users/owlers_dylan/Metrix/source/Metrix_merged_final.csv'
update_file = '/Users/owlers_dylan/Downloads/참가자 모집상황표(공유용) - 서울 관리 (3).csv'
output_file = '/Users/owlers_dylan/Metrix/source/Metrix_updated_with_participation.xlsx'

try:
    print("데이터 파일을 읽는 중...")

    # 기본 데이터 읽기
    df_base = pd.read_csv(base_file, encoding='utf-8-sig')
    print(f"기본 데이터: {df_base.shape[0]}개 행")

    # 업데이트 데이터 읽기
    df_update = pd.read_csv(update_file, encoding='utf-8', skiprows=1)  # 첫 줄은 설명이므로 스킵
    print(f"업데이트 데이터: {df_update.shape[0]}개 행")

    # 이름 정규화 함수
    def normalize_name(name):
        if pd.isna(name):
            return ''
        # 공백 제거, 소문자 변환
        name = str(name).strip().lower()
        # 특수문자 제거
        name = ''.join(e for e in name if e.isalnum() or e.isspace())
        return ' '.join(name.split())  # 다중 공백 제거

    # 이름 컬럼 정규화
    df_base['이름_정규화'] = df_base['작성자'].apply(normalize_name)
    df_update['이름_정규화'] = df_update['이름'].apply(normalize_name)

    # NAME 컬럼도 확인 (영문 이름)
    df_update['NAME_정규화'] = df_update['NAME'].apply(normalize_name)

    print("\n매칭 작업 시작...")

    # 매칭된 레코드 추적
    matched_indices = []
    unmatched_update = []

    # 업데이트 데이터 순회
    for idx, row in df_update.iterrows():
        matched = False
        participation_status = row['참여 여부 결과']

        if pd.notna(participation_status) and participation_status != '':
            # 이름으로 매칭 시도
            name_to_match = row['이름_정규화']
            name_eng_to_match = row['NAME_정규화']

            # 한글 이름으로 매칭
            if name_to_match:
                matches = df_base[df_base['이름_정규화'] == name_to_match].index
                if len(matches) > 0:
                    for match_idx in matches:
                        df_base.at[match_idx, '참여여부결과'] = participation_status
                        matched_indices.append(match_idx)
                    matched = True
                    print(f"  매칭 성공 (한글): {row['이름']} -> {participation_status}")

            # 영문 이름으로 매칭 시도
            if not matched and name_eng_to_match:
                matches = df_base[df_base['이름_정규화'] == name_eng_to_match].index
                if len(matches) > 0:
                    for match_idx in matches:
                        df_base.at[match_idx, '참여여부결과'] = participation_status
                        matched_indices.append(match_idx)
                    matched = True
                    print(f"  매칭 성공 (영문): {row['NAME']} -> {participation_status}")

            # 미매칭 레코드 저장
            if not matched and (name_to_match or name_eng_to_match):
                unmatched_update.append({
                    'UID': row['UID'],
                    '이름': row['이름'],
                    'NAME': row['NAME'],
                    '예약 날짜': row['예약 날짜'],
                    '참여 여부 결과': participation_status,
                    '이유': '기본 데이터에서 일치하는 이름 없음'
                })
                print(f"  미매칭: {row['이름']} / {row['NAME']}")

    # 정규화 컬럼 제거
    df_base = df_base.drop(columns=['이름_정규화'])

    # 상태 업데이트 (참여완료 상태 반영)
    df_base.loc[df_base['참여여부결과'] == '참여', '상태'] = 'completed'

    print(f"\n매칭 결과:")
    print(f"  - 매칭된 레코드: {len(set(matched_indices))}개")
    print(f"  - 미매칭 레코드: {len(unmatched_update)}개")

    # 참여 상태별 통계
    participation_counts = df_base['참여여부결과'].value_counts()
    print(f"\n참여 여부 통계:")
    for status, count in participation_counts.items():
        print(f"  {status}: {count}개")

    # 미매칭 데이터프레임 생성
    df_unmatched = pd.DataFrame(unmatched_update)

    # Excel 파일로 저장 (두 개의 시트)
    print(f"\n결과를 Excel 파일로 저장 중: {output_file}")
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # 매칭된 데이터 시트
        df_base.to_excel(writer, sheet_name='매칭데이터', index=False)

        # 미매칭 데이터 시트
        if len(df_unmatched) > 0:
            df_unmatched.to_excel(writer, sheet_name='미매칭데이터', index=False)
        else:
            # 빈 데이터프레임이라도 시트 생성
            pd.DataFrame({'메시지': ['미매칭 데이터 없음']}).to_excel(
                writer, sheet_name='미매칭데이터', index=False
            )

        # 통계 시트
        stats_data = {
            '항목': ['전체 레코드', '매칭 성공', '미매칭', '참여 완료', '참여 대기'],
            '개수': [
                len(df_base),
                len(set(matched_indices)),
                len(unmatched_update),
                len(df_base[df_base['참여여부결과'] == '참여']),
                len(df_base[df_base['참여여부결과'].isna()])
            ]
        }
        df_stats = pd.DataFrame(stats_data)
        df_stats.to_excel(writer, sheet_name='통계', index=False)

    # CSV로도 저장 (웹에서 사용)
    csv_output = '/Users/owlers_dylan/Metrix/source/Metrix_merged_final.csv'
    df_base.to_csv(csv_output, index=False, encoding='utf-8-sig')
    print(f"CSV 파일 업데이트: {csv_output}")

    print("\n✅ 작업이 성공적으로 완료되었습니다!")
    print(f"결과 파일:")
    print(f"  - Excel: {output_file}")
    print(f"  - CSV: {csv_output}")

except Exception as e:
    print(f"❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()