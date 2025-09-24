# K-Beauty 패널 데이터 처리 가이드

## 📋 개요
이 문서는 K-Beauty 패널 데이터를 Airtable로 업로드하기 위한 전체 데이터 처리 프로세스를 설명합니다.

## 🔄 작업 프로세스

### 전체 플로우
```
원본 CSV 파일들 → 통합 → 중복 제거 → Famigo 매칭 → 영어 변환 → 정규화 → Airtable 업로드
```

---

## 📁 필요 파일 목록

### 입력 파일
1. `/source/K-Beauty_Skin_Care_Panel_Data_1.csv` - 패널 데이터 1
2. `/source/K-Beauty_Skin_Care_Panel_Data_2.csv` - 패널 데이터 2
3. `/source/K-Beauty_Skin_Care_Panel_Data_3.csv` - 패널 데이터 3
4. `/source/famigo_member_Sep_23_2025_1_final_cleaned.csv` - Famigo 회원 데이터

### Python 스크립트
1. `merge_csv_files.py` - CSV 파일 통합 및 중복 제거
2. `cross_check_data.py` - Famigo 데이터와 크로스 체킹
3. `convert_to_english_columns.py` - 컬럼명 영어 변환
4. `normalize_data.py` - 데이터 정규화

---

## 🚀 단계별 실행 가이드

### Step 1: CSV 파일 통합 및 중복 제거
```bash
python merge_csv_files.py
```

**기능:**
- 3개의 K-Beauty CSV 파일 통합
- 이메일과 전화번호 기반 중복 제거 (85% 이상 유사도)
- 정규화된 전화번호 형식 적용

**출력 파일:**
- `/source/K-Beauty_Panel_Integrated.csv`

**주요 로직:**
- 이메일 정규화: 소문자 변환, 공백 제거
- 전화번호 정규화: 010 형식 통일, 국제번호 처리
- 유사도 계산: SequenceMatcher 사용

---

### Step 2: Famigo 데이터와 크로스 체킹
```bash
python cross_check_data.py
```

**기능:**
- Famigo 회원 데이터와 매칭
- 매칭 키 생성 (FAM_XXXXX 형식)
- 매칭/미매칭 구분 필드 추가

**출력 파일:**
- `/source/K-Beauty_Panel_Integrated_with_Match.csv` (전체)
- `/source/K-Beauty_Matched.csv` (매칭 데이터)
- `/source/K-Beauty_Unmatched.csv` (미매칭 데이터)

**매칭 타입:**
- `완전매칭`: 이메일 + 전화번호 일치
- `이메일매칭`: 이메일만 일치
- `전화번호매칭`: 전화번호만 일치
- `미매칭`: 매칭 실패

---

### Step 3: 컬럼명 영어 변환
```bash
python convert_to_english_columns.py
```

**기능:**
- 한글 컬럼명을 영어로 변환
- Airtable 호환 필드명 생성

**출력 파일:**
- `/source/K-Beauty_Panel_Airtable_Ready.csv`

**주요 변환 규칙:**
| 원본 | 변환 | 설명 |
|------|------|------|
| 이메일 | UID | 고유 식별자로 사용 |
| 전화번호 | email | 이메일 필드로 매핑 |
| 전화번호.1 | phone | 실제 전화번호 |
| 응답시간 | application_date | 신청일자 |
| Unnamed: 13 | remarks | 비고 |
| Unnamed: 26 | requested_content | 요청 내용 |

---

### Step 4: 데이터 정규화
```bash
python normalize_data.py
```

**기능:**
- 데이터 형식 표준화
- 유효하지 않은 데이터 제거

**출력 파일:**
- `/source/K-Beauty_Panel_Normalized.csv`

**정규화 내용:**
1. **Gender**: 한글/한자/다국어 → Female/Male
2. **Birth Year**: YYYY-MM-DD 형식 통일
3. **Reservation Location**: '거부' → 'cancel'
4. **Reservation Date**: 유효한 날짜만 유지
5. **Reservation Time**: HH:MM 형식만 유지

---

## 🔧 통합 실행 스크립트

### 전체 프로세스 한 번에 실행
```bash
python run_all_processing.py
```

또는 개별 단계 실행:
```bash
# 순차적 실행
python merge_csv_files.py && \
python cross_check_data.py && \
python convert_to_english_columns.py && \
python normalize_data.py
```

---

## 📊 출력 파일 구조

### 최종 파일: `K-Beauty_Panel_Normalized.csv`

**파일 특징:**
- 총 1,120개 레코드
- 31개 필드
- UTF-8 with BOM 인코딩
- 중복 제거 완료
- 데이터 정규화 완료

---

## ⚙️ 설정 변경 가능 항목

### 1. 중복 제거 기준
`merge_csv_files.py` 파일 내:
```python
# 유사도 임계값 변경 (기본: 0.85)
email_match = (current_email == other_email) or (similarity > 0.85)
```

### 2. 날짜 유효성 범위
`normalize_data.py` 파일 내:
```python
# 연도 범위 변경 (기본: 2024-2026)
if 2024 <= year <= 2026 and 1 <= month <= 12 and 1 <= day <= 31:
```

### 3. 추가 컬럼 매핑
`convert_to_english_columns.py` 파일 내:
```python
column_mapping = {
    # 새로운 매핑 추가
    '새컬럼명': 'new_column_name',
    ...
}
```

---

## 🔍 데이터 검증

### 검증 스크립트 실행
```bash
python validate_output.py
```

### 수동 검증 체크리스트
- [ ] UID(이메일) 필드가 고유한가?
- [ ] Gender 필드가 Female/Male로만 구성되어 있는가?
- [ ] Birth Year가 YYYY-MM-DD 형식인가?
- [ ] Reservation Date/Time이 유효한 형식인가?
- [ ] 매칭 키가 올바르게 생성되었는가?

---

## 📝 주의사항

1. **파일 경로**: 모든 스크립트는 `/Users/owlers_dylan/Metrix/` 디렉토리 기준
2. **인코딩**: CSV 파일은 UTF-8 with BOM으로 저장
3. **데이터 백업**: 원본 파일은 수정하지 않음
4. **메모리**: 대용량 파일 처리 시 pandas 메모리 사용량 주의

---

## 🆘 문제 해결

### 일반적인 오류와 해결책

1. **KeyError: '전화번호'**
   - 원인: 컬럼명이 다름
   - 해결: 스크립트의 컬럼명 매핑 확인

2. **UnicodeDecodeError**
   - 원인: 인코딩 문제
   - 해결: encoding 파라미터 변경 (utf-8, cp949, euc-kr)

3. **MemoryError**
   - 원인: 메모리 부족
   - 해결: 청크 단위로 처리하도록 수정

---

## 📅 업데이트 이력

- 2025.09.25: 초기 버전 작성
- 작성자: Claude Code Assistant