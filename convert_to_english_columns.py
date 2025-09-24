#!/usr/bin/env python3
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

print("K-Beauty 데이터 컬럼명을 영어로 변환 시작...")

# 1. 데이터 로드
print("\n1. 데이터 로드 중...")
df = pd.read_csv('/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Integrated_with_Match.csv')
print(f"   - 데이터: {len(df)} 행, {len(df.columns)} 컬럼")

# 2. 현재 컬럼 확인
print("\n2. 현재 컬럼 목록:")
for i, col in enumerate(df.columns):
    print(f"   {i+1:2d}. {col}")

# 3. 컬럼명 매핑 정의
column_mapping = {
    # 특별 규칙
    '이메일': 'UID',
    '전화번호': 'email',  # 첫 번째 전화번호를 email로
    '전화번호.1': 'phone',  # 두 번째 전화번호를 phone으로
    '응답시간': 'application_date',
    'Unnamed: 13': 'remarks',
    'Unnamed: 26': 'requested_content',

    # 한글 -> 영어 변환
    '이름': 'name',
    '성별': 'gender',
    '생년': 'birth_year',
    '국적': 'nationality',
    '문화권': 'culture_region',
    '인종': 'ethnicity',
    '비자': 'visa_type',
    '예약 지점': 'reservation_location',
    '예약 날짜': 'reservation_date',
    '예약시간': 'reservation_time',
    '예약 시간': 'reservation_time_alt',
    '참여여부결과': 'participation_result',
    '확정 여부': 'confirmation_status',
    '비고': 'notes',
    '수령 방식': 'receipt_method',
    '연락방법': 'contact_method',
    '연락처': 'contact_info',
    '최초 응대': 'first_response',
    '최초 등록 여부': 'first_registration',
    '추천인 코드': 'referral_code',
    '첨언': 'additional_notes',
    '신청 날짜': 'request_date',

    # 매칭 관련 필드 (이미 영어)
    'famigo_match_key': 'famigo_match_key',
    'match_type': 'match_type',
    'match_confidence': 'match_confidence',
    'famigo_id': 'famigo_id'
}

# 4. Unnamed 컬럼들 처리
print("\n3. 컬럼명 변환 중...")
unnamed_counter = 1
final_mapping = {}

for col in df.columns:
    if col in column_mapping:
        # 정의된 매핑 사용
        final_mapping[col] = column_mapping[col]
    elif col.startswith('Unnamed:'):
        # 매핑에 없는 Unnamed 컬럼은 별도 처리
        if col not in ['Unnamed: 13', 'Unnamed: 26']:
            final_mapping[col] = f'field_{unnamed_counter}'
            unnamed_counter += 1
    else:
        # 매핑에 없는 한글 컬럼은 그대로 유지 (필요시 영어로 변경)
        final_mapping[col] = col

# 5. 컬럼명 적용
df_renamed = df.rename(columns=final_mapping)

# 6. 컬럼 순서 재정렬 (중요한 필드를 앞으로)
priority_columns = [
    'UID', 'name', 'email', 'phone', 'gender', 'birth_year',
    'nationality', 'culture_region', 'ethnicity', 'visa_type',
    'reservation_location', 'reservation_date', 'reservation_time',
    'participation_result', 'confirmation_status',
    'application_date', 'famigo_match_key', 'match_type',
    'match_confidence', 'famigo_id'
]

# 우선순위 컬럼과 나머지 컬럼 분리
other_columns = [col for col in df_renamed.columns if col not in priority_columns]
ordered_columns = [col for col in priority_columns if col in df_renamed.columns] + other_columns

# 컬럼 순서 적용
df_final = df_renamed[ordered_columns]

# 7. 결과 저장
output_path = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Airtable_Ready.csv'
df_final.to_csv(output_path, index=False, encoding='utf-8-sig')

# 8. 변환 결과 출력
print("\n4. 변환 완료!")
print(f"   - 출력 파일: {output_path}")
print(f"   - 총 {len(df_final)} 행, {len(df_final.columns)} 컬럼")

print("\n5. 변환된 컬럼 매핑:")
for old, new in sorted(final_mapping.items()):
    if old != new:
        print(f"   {old:30s} → {new}")

print("\n6. 최종 컬럼 목록 (순서대로):")
for i, col in enumerate(df_final.columns[:20], 1):
    print(f"   {i:2d}. {col}")
if len(df_final.columns) > 20:
    print(f"   ... 외 {len(df_final.columns)-20}개 컬럼")

# 9. 데이터 샘플 확인
print("\n7. 데이터 샘플 (처음 3행):")
print(df_final[['UID', 'name', 'email', 'phone', 'match_type']].head(3).to_string())

print("\n✅ Airtable용 CSV 파일 생성 완료!")
print(f"   파일 위치: {output_path}")