# Airtable 테이블 생성 요청 프롬프트 템플릿

## 🎯 CSV 데이터 업로드 시 사용할 프롬프트

### 옵션 1: 간단한 요청
```
이 CSV 파일을 Airtable의 metrix_beauty 테이블로 가져와주세요.
필드 타입을 자동으로 인식하고 다음과 같이 설정해주세요:
- 날짜 필드는 Date 타입으로
- 이메일 필드는 Email 타입으로
- 상태 관련 필드는 Single Select로
```

### 옵션 2: 상세한 요청
```
CSV 파일을 Airtable로 가져오기 위한 테이블 구조를 생성해주세요.

테이블명: metrix_beauty
용도: 뷰티 패널 예약 관리 시스템

주요 필드 매핑:
- 작성자 → Name (Single line text)
- 아이디 → Email (Email)
- 예약 날짜 → Reservation_Date (Date)
- 예약시간 → Reservation_Time (Single select)
- 상태 → Status (Single select: 예약대기/예약확정/신청완료/참여완료/취소)
- 그룹구분 → Group (Single select: PANEL1-5)

Single Select 옵션값들을 자동으로 생성해주세요.
```

### 옵션 3: 데이터 분석 포함 요청
```
첨부한 CSV 파일을 분석해서 Airtable metrix_beauty 테이블 구조를 제안해주세요.

요구사항:
1. 한글 필드명을 영문으로 변환
2. 적절한 필드 타입 자동 지정
3. 중복 데이터 제거
4. 상태/그룹별 분류 가능한 구조
5. 날짜/시간 필드 표준화

추가로 다음 정보도 필요합니다:
- 전체 레코드 수
- 각 상태별 통계
- 데이터 품질 이슈 (빈 값, 형식 오류 등)
```

## 🔄 데이터 동기화 요청 프롬프트

### 기존 테이블 업데이트
```
기존 Airtable metrix_beauty 테이블에 새로운 CSV 데이터를 병합해주세요.

병합 기준:
- Primary Key: Email
- 중복 처리: 기존 레코드 업데이트
- 신규 레코드: 추가
- 업데이트 필드: 예약 날짜, 상태, 참여 결과

변경 사항 요약을 제공해주세요.
```

### 일괄 상태 업데이트
```
Panel5 그룹의 모든 레코드를 다음과 같이 업데이트해주세요:
- 예약 날짜가 없는 경우 → 상태를 "예약대기"로
- 예약 날짜가 있는 경우 → 상태를 "예약확정"으로
- 참여여부결과가 "참여"인 경우 → 상태를 "참여완료"로
```

## 📊 데이터 조회 요청 프롬프트

### 필터링된 데이터 요청
```
metrix_beauty 테이블에서 다음 조건의 데이터를 조회해주세요:
- 그룹: PANEL5
- 상태: 예약대기
- 기간: 이번 주

결과를 Excel 형식으로 내보내기 가능하게 해주세요.
```

### 통계 요청
```
metrix_beauty 테이블의 현재 상태를 요약해주세요:
- 전체 레코드 수
- 상태별 분포 (예약대기/확정/완료 등)
- 그룹별 참여율
- 오늘/이번 주 예약 현황
- 지점별 예약 분포
```

## 🛠️ 테이블 구조 수정 요청

### 필드 추가
```
metrix_beauty 테이블에 다음 필드를 추가해주세요:
- Priority: Single select (높음/중간/낮음)
- Last_Contact: Date
- Contact_Count: Number
- Tags: Multiple select
```

### 뷰 생성
```
metrix_beauty 테이블에 다음 뷰들을 생성해주세요:

1. "오늘 예약":
   - 필터: Reservation_Date = TODAY()
   - 정렬: Reservation_Time 오름차순

2. "Panel5 대기":
   - 필터: Group = "PANEL5" AND Status = "예약대기"
   - 정렬: Submission_Date 오름차순

3. "이번 주 완료":
   - 필터: Status = "참여완료" AND Reservation_Date is this week
```

## 💡 활용 팁

### ChatGPT/Claude에게 요청할 때:
```
첨부한 CSV 파일로 Airtable 테이블을 만들려고 합니다.

맥락:
- 뷰티 제품 테스트 패널 참가자 관리
- 약 1000명의 지원자 데이터
- 예약 시스템과 연동 필요

요청사항:
1. 최적의 테이블 구조 제안
2. 필드 타입 및 관계 설정
3. 자동화 가능한 부분 식별
4. API 연동을 위한 필드명 표준화
```

### Airtable Support에 문의할 때:
```
I need to import Korean CSV data into Airtable.
Table name: metrix_beauty
Records: ~1000

Issues:
- Korean text encoding (UTF-8)
- Date format conversion needed
- Need to set up Single Select options in bulk

Can you guide me on:
1. Best practices for Korean data import
2. Bulk field type conversion
3. API rate limits for initial import
```

## 📝 자주 사용하는 필터 공식

```javascript
// 오늘 예약
AND(Reservation_Date = TODAY(), Status != "취소")

// 이번 주 예약
AND(
  Reservation_Date >= WEEKDAY(TODAY(), 2),
  Reservation_Date <= WEEKDAY(TODAY(), 8)
)

// Panel5 미확정
AND(
  Group = "PANEL5",
  OR(Status = "예약대기", Status = "")
)

// 7일 이상 대기 중
AND(
  Status = "예약대기",
  DATETIME_DIFF(TODAY(), Submission_Date, 'days') > 7
)
```

## 🔗 유용한 Airtable 포뮬러

```javascript
// 우선순위 자동 설정
IF(
  DATETIME_DIFF(TODAY(), Submission_Date, 'days') > 7,
  "🔴 높음",
  IF(
    DATETIME_DIFF(TODAY(), Submission_Date, 'days') > 3,
    "🟡 중간",
    "🟢 낮음"
  )
)

// 상태 이모지 표시
SWITCH(
  Status,
  "예약대기", "⏳",
  "예약확정", "✅",
  "참여완료", "🎉",
  "취소", "❌",
  "❓"
)

// 예약일까지 남은 일수
IF(
  Reservation_Date,
  DATETIME_DIFF(Reservation_Date, TODAY(), 'days') & "일 남음",
  "미정"
)
```