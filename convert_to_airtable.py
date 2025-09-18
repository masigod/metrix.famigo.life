#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from datetime import datetime

# 파일 경로
input_file = '/Users/owlers_dylan/Metrix/source/Metrix_merged_final.csv'
output_file = '/Users/owlers_dylan/Metrix/metrix_beauty_import_real.csv'

try:
    print("실제 데이터를 읽는 중...")

    # CSV 파일 읽기
    df = pd.read_csv(input_file, encoding='utf-8-sig')
    print(f"원본 데이터: {df.shape[0]}개 행, {df.shape[1]}개 열")

    # Airtable 형식 데이터프레임 생성
    airtable_df = pd.DataFrame()

    # 필드 매핑
    # ID는 자동 생성되므로 생략 가능
    airtable_df['Name'] = df['작성자'].fillna(df.get('1. What is your full name? (Please write exactly as shown in your ARC or passport)', ''))
    airtable_df['Email'] = df['아이디']
    airtable_df['Phone'] = df['21-1, Please write your phone number.'].fillna('')

    # Gender 매핑
    gender_map = {
        'Female': '여성',
        'Male': '남성',
        '여성': '여성',
        '남성': '남성',
        'Babae / 여성': '여성',
        'Lalaki / 남성': '남성'
    }
    airtable_df['Gender'] = df.get('2.  What is your gender?', '').map(lambda x: gender_map.get(x, x) if pd.notna(x) else '')

    # Birth_Date 처리
    def parse_birth_date(date_str):
        if pd.isna(date_str):
            return ''
        try:
            # 다양한 날짜 형식 처리
            date_str = str(date_str)
            if '/' in date_str:
                # YYYY/MM/DD 형식
                return pd.to_datetime(date_str, format='%Y/%m/%d').strftime('%Y-%m-%d')
            elif '-' in date_str:
                # YYYY-MM-DD 형식
                return pd.to_datetime(date_str).strftime('%Y-%m-%d')
            else:
                return ''
        except:
            return ''

    airtable_df['Birth_Date'] = df.get('3. Please enter your date of birth. (YYYY/MM/DD)- ⚠️ Note: Please do not enter the registration date', '').apply(parse_birth_date)

    # Nationality 매핑
    airtable_df['Nationality'] = df.get('회원정보국가', '').fillna(df.get('4. What is your nationality?', ''))

    # Culture (문화권) 매핑
    airtable_df['Culture'] = df.get('4. What is your nationality?', '')

    # Race 매핑
    race_col = df.get('6. Please check one or more of the following groups in which you consider yourself to be a member', '')
    airtable_df['Race'] = race_col.apply(lambda x: str(x).replace('/', ',') if pd.notna(x) else '')

    # Reservation_Date 처리
    def parse_reservation_date(date_str):
        if pd.isna(date_str):
            return ''
        try:
            date_str = str(date_str)
            # 2025.09.24 형식 처리
            if '.' in date_str:
                parts = date_str.split('.')
                if len(parts) == 3:
                    return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
            # YYYY-MM-DD 형식
            elif '-' in date_str:
                return date_str
            else:
                return ''
        except:
            return ''

    airtable_df['Reservation_Date'] = df['예약 날짜'].apply(parse_reservation_date)

    # Reservation_Time
    airtable_df['Reservation_Time'] = df['예약시간'].fillna('')

    # Location
    airtable_df['Location'] = df['예약 지점'].fillna(df.get('24. At which location would you like to join this event?', ''))

    # Status 매핑
    status_map = {
        'waiting': '예약대기',
        'confirmed': '예약확정',
        'applied': '신청완료',
        'completed': '참여완료',
        'cancelled': '취소'
    }
    airtable_df['Status'] = df['상태'].apply(lambda x: status_map.get(x, x) if pd.notna(x) else '예약대기')

    # Participation_Result
    airtable_df['Participation_Result'] = df['참여여부결과'].fillna('')

    # Group
    airtable_df['Group'] = df.get('그룹구분', '').fillna('')

    # Submission_Date (응답시간)
    def parse_submission_date(date_str):
        if pd.isna(date_str):
            return ''
        try:
            # datetime 형식으로 변환
            dt = pd.to_datetime(date_str)
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except:
            return ''

    airtable_df['Submission_Date'] = df.get('응답시간', '').apply(parse_submission_date)

    # Preferred_Dates
    airtable_df['Preferred_Dates'] = df.get('25. When can you visit the site? Please select all available dates, and we will confirm your appointment. (Please choose maximum of 2)', '').fillna('')

    # Preferred_Time
    airtable_df['Preferred_Time'] = df.get('26. Which time slot do you prefer?', '').fillna('')

    # First_Response
    airtable_df['First_Response'] = df.get('최초 응대', '').fillna('')

    # Confirmation
    airtable_df['Confirmation'] = df.get('확정 여부', '').fillna('')

    # Visa_Status
    airtable_df['Visa_Status'] = df.get('22. What is your current visa status?', '').fillna('')

    # Payment_Method
    payment_map = {
        'Cash (You need Korean Account )': '현금',
        'Cash (Korean Account needed) / 현금 (한국 계좌 필요)': '현금',
        'Gift Card (Shinsegae Gift Certificate)': '상품권',
        'Gift Card (Shinsegae Gift Certificate) / 신세계 상품권': '상품권'
    }
    payment_col = df.get('23. In what form would you like to receive the participation fee for the survey?', '')
    airtable_df['Payment_Method'] = payment_col.apply(lambda x: payment_map.get(x, x) if pd.notna(x) else '')

    # Contact_Method
    contact_col = df.get('20. How can I contact you?', '')
    airtable_df['Contact_Method'] = contact_col.apply(lambda x: str(x).replace('/', ',') if pd.notna(x) else '')

    # Contact_Info
    airtable_df['Contact_Info'] = df.get('21-2. Please write you email information', '').fillna('')

    # Referral_Code
    airtable_df['Referral_Code'] = df.get('28. Who recommended you? Please write that person\'s  referral code. (Optional)', '').fillna('')

    # Notes (비고)
    airtable_df['Notes'] = df.get('비고', '').fillna('')

    # Additional_Notes (첨언)
    airtable_df['Additional_Notes'] = df.get('첨언', '').fillna('')

    # Skin related fields (추가 정보로 Notes에 통합)
    skin_info = []
    if '12.  What is your skin complexion?' in df.columns:
        skin_info.append('Skin Complexion: ' + df['12.  What is your skin complexion?'].fillna(''))
    if '11. What is your skin tone?' in df.columns:
        skin_info.append('Skin Tone: ' + df['11. What is your skin tone?'].fillna(''))
    if '13. How sensitive do you think your skin is?' in df.columns:
        skin_info.append('Skin Sensitivity: ' + df['13. How sensitive do you think your skin is?'].fillna(''))

    # Tags 설정 (조건에 따라)
    def set_tags(row):
        tags = []
        # 재참여자 체크
        if pd.notna(row.get('최초 등록 여부', '')) and row['최초 등록 여부'] != '':
            tags.append('재참여')
        else:
            tags.append('신규')

        # Group이 PANEL5인 경우
        if row.get('그룹구분') == 'PANEL5':
            tags.append('우선처리')

        return ','.join(tags) if tags else ''

    airtable_df['Tags'] = df.apply(set_tags, axis=1)

    # Created_Time (응답시간을 기준으로)
    airtable_df['Created_Time'] = airtable_df['Submission_Date']

    # Modified_Time (현재 시간)
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    airtable_df['Modified_Time'] = current_time

    # Sync_Status
    airtable_df['Sync_Status'] = 'pending'

    # 빈 값을 빈 문자열로 변경
    airtable_df = airtable_df.fillna('')

    # 중복 제거 (Email 기준)
    print(f"\n중복 제거 전: {len(airtable_df)}개")
    airtable_df = airtable_df.drop_duplicates(subset=['Email'], keep='first')
    print(f"중복 제거 후: {len(airtable_df)}개")

    # 상태별 통계
    print("\n상태별 분포:")
    status_counts = airtable_df['Status'].value_counts()
    for status, count in status_counts.items():
        print(f"  {status}: {count}개")

    # 그룹별 통계
    print("\n그룹별 분포:")
    group_counts = airtable_df['Group'].value_counts()
    for group, count in group_counts.items():
        if group:  # 빈 값 제외
            print(f"  {group}: {count}개")

    # Panel5 및 빈 그룹 통계
    panel5_empty = len(airtable_df[(airtable_df['Group'] == 'PANEL5') | (airtable_df['Group'] == '')])
    print(f"\nPanel5 + 빈 그룹: {panel5_empty}개")

    # CSV 저장
    airtable_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\n✅ Airtable 형식 CSV 생성 완료: {output_file}")
    print(f"총 {len(airtable_df)}개 레코드")

    # 샘플 데이터 출력
    print("\n첫 5개 레코드 샘플:")
    print(airtable_df[['Name', 'Email', 'Status', 'Reservation_Date', 'Group']].head())

except Exception as e:
    print(f"❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()