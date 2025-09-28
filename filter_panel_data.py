#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np

def filter_panel_data():
    """
    통합된 K-Beauty 패널 데이터에서 특정 조건의 레코드를 제거

    제거 조건:
    1. '확정여부' 필드값이 '취소','중복','탈락','거부','x','X'
    2. '참여여부결과' 필드값이 '불가','불참'
    """

    # 입력 파일
    input_file = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Merged.csv'

    print("CSV 파일 읽기...")
    df = pd.read_csv(input_file, encoding='utf-8-sig')
    initial_count = len(df)
    print(f"초기 레코드 수: {initial_count}")

    # 컬럼 이름 정리 (공백 제거)
    df.columns = df.columns.str.strip()

    # 제거할 값들 정의
    exclude_confirmed = ['취소', '중복', '탈락', '거부', 'x', 'X']
    exclude_participation = ['불가', '불참']

    print("\n필터링 전 데이터 분석:")

    # '확정 여부' 필드 분석 (띄어쓰기 고려)
    confirmed_columns = [col for col in df.columns if '확정' in col and '여부' in col]
    if confirmed_columns:
        confirmed_col = confirmed_columns[0]
        print(f"\n'{confirmed_col}' 필드 값 분포:")
        value_counts = df[confirmed_col].value_counts()
        for value, count in value_counts.items():
            if pd.notna(value):
                print(f"  - {value}: {count}개")

    # '참여여부결과' 필드 분석
    if '참여여부결과' in df.columns:
        print(f"\n'참여여부결과' 필드 값 분포:")
        value_counts = df['참여여부결과'].value_counts()
        for value, count in value_counts.items():
            if pd.notna(value):
                print(f"  - {value}: {count}개")

    print("\n필터링 시작...")

    # 필터링 전 레코드 수
    before_filter = len(df)

    # 1. '확정 여부' 필드 필터링
    removed_confirmed = 0
    if confirmed_columns:
        confirmed_col = confirmed_columns[0]
        # 문자열 정규화 (공백 제거, 소문자 변환)
        df['확정여부_정규화'] = df[confirmed_col].astype(str).str.strip().str.lower()
        exclude_confirmed_lower = [val.lower() for val in exclude_confirmed]

        # 제거할 레코드 식별
        mask_confirmed = df['확정여부_정규화'].isin(exclude_confirmed_lower)
        removed_confirmed = mask_confirmed.sum()

        if removed_confirmed > 0:
            print(f"  - '확정 여부' 조건으로 제거할 레코드: {removed_confirmed}개")
            removed_values = df[mask_confirmed][confirmed_col].value_counts()
            for value, count in removed_values.items():
                print(f"    • {value}: {count}개")

        # 필터링 적용
        df = df[~mask_confirmed]
        df = df.drop('확정여부_정규화', axis=1)

    # 2. '참여여부결과' 필드 필터링
    removed_participation = 0
    if '참여여부결과' in df.columns:
        # 문자열 정규화
        df['참여여부결과_정규화'] = df['참여여부결과'].astype(str).str.strip()

        # 제거할 레코드 식별
        mask_participation = df['참여여부결과_정규화'].isin(exclude_participation)
        removed_participation = mask_participation.sum()

        if removed_participation > 0:
            print(f"  - '참여여부결과' 조건으로 제거할 레코드: {removed_participation}개")
            removed_values = df[mask_participation]['참여여부결과'].value_counts()
            for value, count in removed_values.items():
                print(f"    • {value}: {count}개")

        # 필터링 적용
        df = df[~mask_participation]
        df = df.drop('참여여부결과_정규화', axis=1)

    # 결과 요약
    total_removed = before_filter - len(df)
    print(f"\n=== 필터링 결과 ===")
    print(f"초기 레코드 수: {initial_count}")
    print(f"제거된 레코드 수: {total_removed}")
    print(f"  - 확정 여부 조건: {removed_confirmed}개")
    print(f"  - 참여여부결과 조건: {removed_participation}개")
    print(f"최종 레코드 수: {len(df)}")

    # 필터링 후 데이터 검증
    print("\n필터링 후 데이터 검증:")
    if confirmed_columns:
        confirmed_col = confirmed_columns[0]
        remaining_values = df[confirmed_col].value_counts()
        print(f"\n'{confirmed_col}' 필드 남은 값들:")
        for value, count in remaining_values.head(10).items():
            if pd.notna(value):
                print(f"  - {value}: {count}개")

    if '참여여부결과' in df.columns:
        remaining_values = df['참여여부결과'].value_counts()
        print(f"\n'참여여부결과' 필드 남은 값들:")
        for value, count in remaining_values.head(10).items():
            if pd.notna(value):
                print(f"  - {value}: {count}개")

    # 결과 저장
    output_file = '/Users/owlers_dylan/Metrix/source/K-Beauty_Panel_Filtered.csv'
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\n필터링 완료: {output_file}")

    return df

if __name__ == "__main__":
    result = filter_panel_data()
    print("\n작업 완료!")