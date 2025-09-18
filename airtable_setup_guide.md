# Airtable metrix_beauty 테이블 설정 가이드

## 📋 필수 필드 목록 (복사해서 사용)

### 1단계: 기본 정보 필드 생성
```
ID → Autonumber
Name → Single line text
Email → Email
Phone → Phone number
Gender → Single select (남성, 여성, 기타)
Birth_Date → Date
Nationality → Single line text
```

### 2단계: 예약 관련 필드 생성
```
Reservation_Date → Date
Reservation_Time → Single select
Location → Single select
Status → Single select
Participation_Result → Single select
Group → Single select
```

### 3단계: Single Select 옵션 값

**Reservation_Time 옵션:**
```
10:00
10:30
11:00
11:30
12:00
12:30
13:00
13:30
14:00
14:30
15:00
15:30
16:00
16:30
17:00
17:30
18:00
```

**Location 옵션:**
```
서울(Seoul)
수원(Suwon)
```

**Status 옵션:**
```
예약대기
예약확정
신청완료
참여완료
취소
```

**Participation_Result 옵션:**
```
참여
불참
불가
중복
거부
변경
보류
```

**Group 옵션:**
```
PANEL1
PANEL2
PANEL3
PANEL4
PANEL5
```

### 4단계: 추가 정보 필드
```
Submission_Date → Date and time
Preferred_Dates → Long text
Preferred_Time → Single line text
First_Response → Single line text
Confirmation → Single select (o, x)
Notes → Long text
Additional_Notes → Long text
```

### 5단계: 부가 정보 필드
```
Culture → Single line text
Race → Multiple select
Visa_Status → Single line text
Payment_Method → Single select
Contact_Method → Single line text
Contact_Info → Single line text
Referral_Code → Single line text
```

### 6단계: 시스템 필드 (자동 생성)
```
Created_Time → Created time
Modified_Time → Last modified time
Modified_By → Last modified by
Sync_Status → Single select (synced, pending, error)
```

## 🎯 빠른 설정 팁

1. **Excel/CSV에서 가져오기로 시작**:
   - 기존 CSV 파일이 있다면 먼저 가져온 후 필드 타입 변경
   - Airtable이 자동으로 필드 생성

2. **필드 순서 조정**:
   - 드래그 앤 드롭으로 필드 순서 변경
   - Name을 첫 번째 필드로 설정 (Primary field)

3. **뷰 생성 권장**:
   - "오늘 예약" - Reservation_Date = TODAY()
   - "예약대기" - Status = "예약대기"
   - "이번 주" - Reservation_Date is within "this week"
   - "Panel5" - Group = "PANEL5"

## 🔧 웹 애플리케이션 연결

1. HTML 파일 열기:
```bash
open /Users/owlers_dylan/Metrix/reservation-tracker-airtable.html
```

2. 연결 정보 입력:
   - **API Key**: pat로 시작하는 Personal Access Token
   - **Base ID**: app로 시작하는 ID (URL에서 확인)
   - **Table Name**: metrix_beauty
   - **View Name**: Grid view (또는 생성한 뷰 이름)

3. "Airtable 연결" 클릭

## ✅ 체크리스트

- [ ] Airtable 계정 생성
- [ ] Base 생성
- [ ] metrix_beauty 테이블 생성
- [ ] 모든 필드 추가
- [ ] Single select 옵션 값 입력
- [ ] Personal Access Token 생성
- [ ] Base ID 확인
- [ ] 웹 애플리케이션 연결 테스트
- [ ] CSV 데이터 가져오기 테스트

## 📌 주의사항

1. **필드명은 정확히 입력**: 대소문자 구분
2. **Date 형식**: ISO format (YYYY-MM-DD) 권장
3. **Time zone**: Asia/Seoul 설정
4. **권한**: Personal Access Token에 read/write 권한 필요

## 🆘 문제 해결

**필드가 안 보이는 경우:**
- View 설정에서 Hidden fields 확인
- 필드명 오타 확인

**데이터 타입 불일치:**
- Single line text ↔ Single select 변환 주의
- Date 필드는 날짜 형식 확인

**동기화 안 되는 경우:**
- API Key 권한 확인
- Table name 정확히 입력 (metrix_beauty)
- Base ID 확인