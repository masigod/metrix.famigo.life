#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np

# 파일 경로
metrix_file = '/Users/owlers_dylan/Metrix/source/Metrix_최종_20250917_sorted_by_AO_fixed.csv'
kbeauty_file = '/Users/owlers_dylan/Metrix/source/K-Beauty_Skin_Care_Panel_Data - Details.csv'
output_file = '/Users/owlers_dylan/Metrix/source/Metrix_merged_final.csv'

try:
    print("데이터 파일을 읽는 중...")

    # Metrix 데이터 읽기
    df_metrix = pd.read_csv(metrix_file, encoding='utf-8-sig')
    print(f"Metrix 데이터: {df_metrix.shape[0]}개 행")

    # K-Beauty 데이터 읽기 (첫 번째 행은 업데이트 정보이므로 스킵)
    df_kbeauty = pd.read_csv(kbeauty_file, encoding='utf-8', skiprows=1)
    print(f"K-Beauty 데이터: {df_kbeauty.shape[0]}개 행")

    # 컬럼명 매핑
    column_mapping = {
        '이메일': '아이디',
        '이름': '작성자',
        '응답시간': '응답시간',
        '국적': '회원정보국가',
        '문화권': '4. What is your nationality?',
        '성별': '2.  What is your gender?',
        '생년': '3. Please enter your date of birth. (YYYY/MM/DD)- ⚠️ Note: Please do not enter the registration date',
        '인종': '6. Please check one or more of the following groups in which you consider yourself to be a member',
        '비자': '22. What is your current visa status?',
        '수령 방식': '23. In what form would you like to receive the participation fee for the survey?',
        '연락방법': '20. How can I contact you?',
        '연락처': '21-2. Please write you email information',
        '전화번호': '21-1, Please write your phone number.',
        '예약 지점': '예약 지점',
        '예약 날짜': '예약 날짜',
        '예약시간': '예약시간',
        '최초 응대': '최초 응대',
        '확정 여부': '확정 여부',
        '참여여부결과': '참여여부결과',
        '추천인 코드': '28. Who recommended you? Please write that person\'s  referral code. (Optional)',
        '비고': '비고',
        '첨언': '첨언',
        '신청 날짜': '25. When can you visit the site? Please select all available dates, and we will confirm your appointment. (Please choose maximum of 2)',
        '예약 시간': '26. Which time slot do you prefer?'
    }

    # K-Beauty 데이터의 컬럼명을 Metrix 형식으로 변경
    df_kbeauty_renamed = df_kbeauty.rename(columns=column_mapping)

    # 상태 컬럼 추가
    df_metrix['상태'] = df_metrix.apply(lambda row:
        '취소' if row.get('확정 여부') == 'x' else
        '참여완료' if row.get('참여여부결과') == '참여' else
        '예약확정' if pd.notna(row.get('예약 날짜')) and pd.notna(row.get('예약시간')) else
        '예약대기', axis=1)

    df_kbeauty_renamed['상태'] = df_kbeauty_renamed.apply(lambda row:
        '취소' if row.get('확정 여부') == 'x' else
        '참여완료' if row.get('참여여부결과') == '참여' else
        '예약확정' if pd.notna(row.get('예약 날짜')) and pd.notna(row.get('예약시간')) else
        '예약대기', axis=1)

    # 두 데이터프레임 병합 (이메일 기준)
    print("\n데이터 병합 중...")

    # 모든 컬럼을 포함하여 병합
    all_columns = list(set(df_metrix.columns) | set(df_kbeauty_renamed.columns))

    # 빈 데이터프레임 생성
    df_merged = pd.DataFrame(columns=all_columns)

    # Metrix 데이터 추가
    for col in all_columns:
        if col in df_metrix.columns:
            df_merged[col] = df_metrix[col]

    # K-Beauty 데이터 중 새로운 이메일만 추가
    existing_emails = set(df_metrix['아이디'].dropna())
    df_kbeauty_new = df_kbeauty_renamed[~df_kbeauty_renamed['아이디'].isin(existing_emails)]

    print(f"K-Beauty에서 새로 추가될 데이터: {df_kbeauty_new.shape[0]}개")

    # 새 데이터 추가
    df_merged = pd.concat([df_merged, df_kbeauty_new], ignore_index=True, sort=False)

    # K-Beauty의 기존 이메일 데이터로 업데이트
    df_kbeauty_existing = df_kbeauty_renamed[df_kbeauty_renamed['아이디'].isin(existing_emails)]

    for _, row in df_kbeauty_existing.iterrows():
        email = row['아이디']
        idx = df_merged[df_merged['아이디'] == email].index

        if len(idx) > 0:
            idx = idx[0]
            # 중요 필드 업데이트 (K-Beauty 데이터가 더 최신인 경우)
            update_fields = ['예약 날짜', '예약시간', '예약 지점', '최초 응대', '확정 여부',
                           '참여여부결과', '상태', '비고', '첨언']

            for field in update_fields:
                if field in row and pd.notna(row[field]) and row[field] != '':
                    df_merged.at[idx, field] = row[field]

    # 중복 제거 (이메일 기준)
    print(f"\n병합 전 총 데이터: {df_merged.shape[0]}개")
    df_merged = df_merged.drop_duplicates(subset=['아이디'], keep='first')
    print(f"중복 제거 후 총 데이터: {df_merged.shape[0]}개")

    # 중요 컬럼을 앞쪽으로 정렬
    priority_columns = ['아이디', '작성자', '상태', '예약 날짜', '예약시간', '예약 지점',
                       '회원정보국가', '21-1, Please write your phone number.',
                       '참여여부결과', '최초 응대', '확정 여부', '응답시간']

    # 우선순위 컬럼 중 실제로 존재하는 것만 선택
    priority_columns = [col for col in priority_columns if col in df_merged.columns]
    other_columns = [col for col in df_merged.columns if col not in priority_columns]

    # 컬럼 순서 재정렬
    df_merged = df_merged[priority_columns + other_columns]

    # CSV로 저장
    print(f"\n병합된 데이터를 저장 중: {output_file}")
    df_merged.to_csv(output_file, index=False, encoding='utf-8-sig')

    print("✅ 성공적으로 완료되었습니다!")
    print(f"최종 데이터: {df_merged.shape[0]}개 행, {df_merged.shape[1]}개 컬럼")

    # 상태별 통계
    print("\n상태별 통계:")
    status_counts = df_merged['상태'].value_counts()
    for status, count in status_counts.items():
        print(f"  {status}: {count}개")

except Exception as e:
    print(f"❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()