#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pandas as pd
import sys

# Excel 파일 경로
excel_file = '/Users/owlers_dylan/Metrix/source/Metrix 최종_20250917_sorted_by_AO.xlsx'
csv_file = '/Users/owlers_dylan/Metrix/source/Metrix_최종_20250917_sorted_by_AO_fixed.csv'

try:
    # Excel 파일 읽기
    print("Excel 파일을 읽는 중...")
    df = pd.read_excel(excel_file)

    # 데이터 확인
    print(f"데이터 형태: {df.shape}")
    print(f"컬럼 수: {len(df.columns)}")
    print("\n첫 5개 행 미리보기:")
    print(df.head())

    # UTF-8 인코딩으로 CSV 저장
    print(f"\nCSV 파일로 저장 중: {csv_file}")
    df.to_csv(csv_file, index=False, encoding='utf-8-sig')

    print("✅ 성공적으로 변환되었습니다!")
    print(f"저장된 파일: {csv_file}")

except Exception as e:
    print(f"❌ 오류 발생: {e}")
    sys.exit(1)