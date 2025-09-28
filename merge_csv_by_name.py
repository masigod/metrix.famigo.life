#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import os

def merge_csv_files():
    """
    3개의 K-Beauty CSV 파일을 통합하고 이름 기준으로 중복 제거
    """

    # 파일 경로 설정
    base_path = '/Users/owlers_dylan/Metrix/source'
    csv_files = [
        'K-Beauty_Skin_Care_Panel_Data_1.csv',
        'K-Beauty_Skin_Care_Panel_Data_2.csv',
        'K-Beauty_Skin_Care_Panel_Data_3.csv'
    ]

    # 모든 데이터프레임을 저장할 리스트
    all_dataframes = []

    print("CSV 파일 읽기 시작...")

    for file in csv_files:
        file_path = os.path.join(base_path, file)
        print(f"\n처리 중: {file}")

        try:
            # CSV 읽기 - 첫 번째 행 스킵 (날짜 정보)
            df = pd.read_csv(file_path, skiprows=1, encoding='utf-8-sig')

            # 빈 행 제거
            df = df.dropna(how='all')

            # 이름 필드가 있는 행만 필터링
            if '이름' in df.columns:
                df = df[df['이름'].notna()]
                df = df[df['이름'].str.strip() != '']

                print(f"  - 유효한 레코드 수: {len(df)}")
                all_dataframes.append(df)
            else:
                print(f"  - 경고: '이름' 컬럼이 없습니다.")

        except Exception as e:
            print(f"  - 오류 발생: {e}")

    # 모든 데이터프레임 통합
    print("\n\n데이터 통합 중...")
    merged_df = pd.concat(all_dataframes, ignore_index=True)
    print(f"통합된 총 레코드 수: {len(merged_df)}")

    # 이름 기준 중복 제거 (첫 번째 레코드 유지)
    print("\n이름 기준 중복 제거 중...")

    # 이름 정규화 (공백 제거, 대소문자 통일)
    merged_df['이름_정규화'] = merged_df['이름'].str.strip().str.lower()

    # 중복 제거 전 중복 레코드 확인
    duplicates = merged_df[merged_df.duplicated(subset=['이름_정규화'], keep=False)]
    duplicate_names = duplicates.groupby('이름_정규화')['이름'].apply(list).to_dict()

    if duplicate_names:
        print(f"\n발견된 중복 이름 ({len(duplicate_names)}개):")
        for normalized_name, original_names in list(duplicate_names.items())[:10]:  # 처음 10개만 표시
            print(f"  - {original_names[0]} ({len(original_names)}개 중복)")

    # 중복 제거 (첫 번째 레코드 유지)
    final_df = merged_df.drop_duplicates(subset=['이름_정규화'], keep='first')

    # 임시 컬럼 제거
    final_df = final_df.drop('이름_정규화', axis=1)

    removed_count = len(merged_df) - len(final_df)
    print(f"\n제거된 중복 레코드 수: {removed_count}")
    print(f"최종 레코드 수: {len(final_df)}")

    # 결과 저장
    output_file = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Merged.csv'
    final_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\n통합 완료: {output_file}")

    # 통계 정보 출력
    print("\n=== 통합 통계 ===")
    print(f"파일 1: {len(all_dataframes[0]) if len(all_dataframes) > 0 else 0} 레코드")
    print(f"파일 2: {len(all_dataframes[1]) if len(all_dataframes) > 1 else 0} 레코드")
    print(f"파일 3: {len(all_dataframes[2]) if len(all_dataframes) > 2 else 0} 레코드")
    print(f"통합 전: {len(merged_df)} 레코드")
    print(f"중복 제거: {removed_count} 레코드")
    print(f"최종 결과: {len(final_df)} 레코드")

    # 컬럼 정보 출력
    print(f"\n총 컬럼 수: {len(final_df.columns)}")
    print("주요 컬럼:", list(final_df.columns)[:10])

    return final_df

if __name__ == "__main__":
    result = merge_csv_files()
    print("\n작업 완료!")