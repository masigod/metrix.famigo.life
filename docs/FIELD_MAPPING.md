# Field Mapping Documentation

## Google Sheets → Airtable 필드 매핑

### 주요 필드 (Primary Fields)

| 한글 필드명 | 영문 필드명 | 데이터 타입 | 설명 | Airtable Type |
|------------|------------|------------|------|--------------|
| UID | uid | String | 고유 식별자 (Primary Key) | Single line text |
| 이름 | name | String | 참가자 이름 | Single line text |
| 전화번호 | phone | String | 연락처 | Phone number |
| 이메일 | email | String | 이메일 주소 | Email |
| 성별 | gender | String | 성별 (Male/Female) | Single select |
| 생년월일 | birth_date | Date | 생년월일 | Date |
| 국적 | nationality | String | 국적 | Single line text |
| 거주지역 | residence_area | String | 거주 지역 | Single line text |

### 예약 정보 (Reservation Info)

| 한글 필드명 | 영문 필드명 | 데이터 타입 | 설명 | Airtable Type |
|------------|------------|------------|------|--------------|
| 예약 날짜 | reservation_date | Date | 예약 날짜 (정렬 기준 1) | Date |
| 시스템 예약 시간대 | reservation_time_slot | String | 예약 시간대 (정렬 기준 2) | Single select |
| 실제 예약 시간 | actual_reservation_time | Time | 실제 예약된 시간 | Time |
| 예약 위치 | reservation_location | String | 서울/수원 | Single select |
| 예약 상태 | reservation_status | String | 예약 상태 | Single select |

### 참여 관리 (Participation Management)

| 한글 필드명 | 영문 필드명 | 데이터 타입 | 설명 | Airtable Type |
|------------|------------|------------|------|--------------|
| 참여 여부 결과 | participation_result | String | 참여/불참/보류/취소 (결과값) | Single select |
| 참여 날짜 | participation_date | Date | 실제 참여 날짜 | Date |
| 참여 시간 | participation_time | Time | 실제 참여 시간 | Time |
| 확인 상태 | confirmation_status | String | 확인 여부 (o/x/pending) | Single select |
| 참여 노트 | participation_notes | Text | 참여 관련 메모 | Long text |

### 매칭 정보 (Matching Info)

| 한글 필드명 | 영문 필드명 | 데이터 타입 | 설명 | Airtable Type |
|------------|------------|------------|------|--------------|
| 매칭 키 | matching_key | String | MetrixTable2 매칭 키 | Single line text |
| 매칭 타입 | matching_type | String | 매칭 방식 | Single select |
| 매칭 신뢰도 | matching_confidence | Number | 매칭 신뢰도 (0-100) | Number |
| 매칭 날짜 | matching_date | Date | 매칭 처리 날짜 | Date |

### 시스템 필드 (System Fields)

| 한글 필드명 | 영문 필드명 | 데이터 타입 | 설명 | Airtable Type |
|------------|------------|------------|------|--------------|
| 데이터 소스 | data_source | String | 서울/수원 | Single select |
| 생성일 | created_at | DateTime | 레코드 생성 시간 | Created time |
| 수정일 | updated_at | DateTime | 마지막 수정 시간 | Last modified time |
| 처리 상태 | processing_status | String | 처리 상태 | Single select |
| 동기화 날짜 | sync_date | DateTime | 마지막 동기화 시간 | Date & time |

## 데이터 타입 변환 규칙

### 날짜 형식
- **입력**: YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY
- **출력**: YYYY-MM-DD (ISO 8601)

### 시간 형식
- **입력**: HH:MM, HH:MM:SS, 오전/오후 HH:MM
- **출력**: HH:MM:SS (24시간 형식)

### 전화번호 형식
- **입력**: 010-XXXX-XXXX, 010XXXXXXXX, +82-10-XXXX-XXXX
- **출력**: 010-XXXX-XXXX (표준 형식)

### 성별 매핑
- 남/남성/Male/M → "Male"
- 여/여성/Female/F → "Female"

### 참여 결과 매핑
- 참여/참가/완료/O → "참여"
- 불참/미참/취소/X → "불참"
- 보류/대기/미정 → "보류"
- 취소/철회 → "취소"

## 정렬 우선순위
1. reservation_date (ASC)
2. reservation_time_slot (ASC)
3. uid (ASC)

## 중복 제거 규칙
- Primary Key: uid
- 중복 발견 시: 최신 updated_at 기준으로 유지
- 병합 규칙: 빈 필드는 이전 레코드에서 가져옴

## Airtable 테이블 명
- Table Name: `ManagementPanel`
- View Names:
  - `All Records` - 전체 레코드
  - `Seoul` - 서울 데이터만
  - `Suwon` - 수원 데이터만
  - `Participated` - 참여 완료
  - `Pending` - 보류 상태
  - `Today` - 오늘 예약