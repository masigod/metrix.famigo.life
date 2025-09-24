# Airtable 스키마 정의서

## 📊 테이블명: K-Beauty Panel Management

## 🗂️ 필드 정의

### 1. 고유 식별자 필드

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| **UID** | Single line text (Primary) | 이메일 기반 고유 식별자 | ✅ | beautytravelbyval@gmail.com |
| **famigo_id** | Single line text | Famigo 시스템 ID | ❌ | FAM_01777 |

---

### 2. 개인정보 필드

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| **name** | Single line text | 참가자 이름 | ✅ | Widyastuti Valentina |
| **email** | Email | 연락용 이메일 | ✅ | beautytravelbyval@gmail.com |
| **phone** | Phone number | 전화번호 | ✅ | 010-8327-6230 |
| **gender** | Single select | 성별 | ✅ | Female / Male |
| **birth_year** | Date | 생년월일 | ✅ | 1984-02-14 |

**Gender 옵션:**
- Female
- Male

---

### 3. 국적 및 문화 정보

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| **nationality** | Single select | 국적 | ✅ | Indonesia |
| **culture_region** | Single select | 문화권 | ❌ | Southeast Asia |
| **ethnicity** | Single select | 인종 | ❌ | Asian |
| **visa_type** | Single select | 비자 유형 | ❌ | F-6 |

**Culture Region 옵션:**
- Southeast Asia
- East Asia
- South Asia
- North America
- South America
- Europe
- Africa
- Middle East
- Oceania

**Visa Type 옵션:**
- D-2 or D-4 or D-10 (학생)
- E-series (취업)
- F-series (거주)
- H-1 (관광취업)
- Other

---

### 4. 예약 정보

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| **reservation_location** | Single select | 예약 지점 | ✅ | 서울(Seoul) |
| **reservation_date** | Date | 예약 날짜 | ✅ | 2025-08-29 |
| **reservation_time** | Single line text | 예약 시간 | ❌ | 15:00 |

**Location 옵션:**
- 서울(Seoul)
- 수원(Suwon)
- cancel
- 취소
- x

---

### 5. 참여 관리

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| **participation_result** | Single select | 참여 결과 | ✅ | 참여 |
| **confirmation_status** | Single select | 확정 여부 | ❌ | o |
| **application_date** | Date | 신청일자 | ✅ | 2025-08-16 |

**Participation Result 옵션:**
- 참여
- 불참
- 보류
- 취소

**Confirmation Status 옵션:**
- o (확정)
- x (미확정)
- pending (대기)

---

### 6. 매칭 정보

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| **famigo_match_key** | Single line text | Famigo 매칭 키 | ❌ | FAM_01777 |
| **match_type** | Single select | 매칭 타입 | ✅ | 이메일매칭 |
| **match_confidence** | Number | 매칭 신뢰도 | ❌ | 50 |

**Match Type 옵션:**
- 완전매칭
- 이메일매칭
- 전화번호매칭
- 미매칭

---

### 7. 추가 정보

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| **receipt_method** | Single line text | 수령 방식 | ❌ | Cash |
| **contact_method** | Single line text | 연락 방법 | ❌ | Email |
| **first_response** | Single line text | 최초 응대일 | ❌ | 8/18 |
| **first_registration** | Checkbox | 최초 등록 여부 | ❌ | ✓ |
| **referral_code** | Single line text | 추천인 코드 | ❌ | REF123 |
| **notes** | Long text | 비고 | ❌ | 특이사항 없음 |
| **remarks** | Long text | 추가 메모 | ❌ | - |
| **additional_notes** | Long text | 첨언 | ❌ | - |
| **request_date** | Date | 요청 날짜 | ❌ | 2025-08-16 |
| **reservation_time_alt** | Single line text | 대체 예약 시간 | ❌ | Around noon |
| **requested_content** | Long text | 요청 내용 | ❌ | - |

---

## 🔧 Airtable 설정 가이드

### 1. Base 생성
```
1. Airtable 로그인
2. "Add a base" 클릭
3. "Start from scratch" 선택
4. Base 이름: "K-Beauty Panel Management"
```

### 2. 테이블 생성
```
1. 기본 테이블명을 "Participants"로 변경
2. Grid view 유지
```

### 3. 필드 생성 순서
1. **UID** (Primary field로 설정)
2. 개인정보 필드들
3. 국적/문화 필드들
4. 예약 정보 필드들
5. 참여 관리 필드들
6. 매칭 정보 필드들
7. 추가 정보 필드들

### 4. View 설정 권장사항

#### View 1: 전체 데이터
- 모든 필드 표시
- UID 기준 정렬

#### View 2: 예약 관리
- 필드: UID, name, reservation_location, reservation_date, reservation_time, participation_result
- 필터: reservation_date가 비어있지 않은 레코드
- 정렬: reservation_date 오름차순

#### View 3: 매칭 상태
- 필드: UID, name, match_type, match_confidence, famigo_id
- 그룹화: match_type별
- 정렬: match_confidence 내림차순

#### View 4: 미매칭 데이터
- 필터: match_type = "미매칭"
- 목적: 추가 매칭 작업 필요 레코드 확인

---

## 📤 CSV Import 설정

### Import 단계
1. **테이블 선택**: Participants
2. **파일 업로드**: K-Beauty_Panel_Normalized.csv
3. **인코딩**: UTF-8
4. **첫 행**: 헤더로 사용
5. **필드 매핑**: 자동 매핑 후 확인

### 필드 매핑 확인사항
- UID → Primary field
- Date 필드들이 올바른 형식인지 확인
- Single select 필드의 옵션 자동 생성 확인

---

## 🔐 권한 설정

### 권장 권한 레벨
1. **Owner**: 전체 관리 권한
2. **Editor**: 데이터 편집 가능
3. **Commenter**: 코멘트만 가능
4. **Read-only**: 읽기 전용

### 민감 정보 보호
- phone, email 필드는 필요한 사용자만 접근
- Personal view로 개인별 데이터만 보기 설정 가능

---

## 📈 Automation 추천

### 1. 신규 참가자 알림
- 트리거: 새 레코드 생성
- 액션: Slack/Email 알림

### 2. 예약일 리마인더
- 트리거: reservation_date 1일 전
- 액션: 참가자에게 이메일 발송

### 3. 매칭 상태 업데이트
- 트리거: match_type 변경
- 액션: famigo_id 필드 업데이트

---

## 🔄 데이터 동기화

### 정기 업데이트 주기
- 일일: 참여 상태 업데이트
- 주간: 신규 참가자 데이터 추가
- 월간: 전체 데이터 검증 및 정리

### API 연동 (선택사항)
```javascript
// Airtable API 예시
const base = require('airtable').base('YOUR_BASE_ID');

base('Participants').create([
  {
    "fields": {
      "UID": "example@email.com",
      "name": "Test User",
      "gender": "Female",
      "birth_year": "1990-01-01"
    }
  }
], function(err, records) {
  if (err) {
    console.error(err);
    return;
  }
  records.forEach(function (record) {
    console.log(record.getId());
  });
});
```

---

## 📋 체크리스트

### Airtable 업로드 전 확인사항
- [ ] CSV 파일이 UTF-8 with BOM 인코딩인가?
- [ ] 모든 필수 필드가 있는가?
- [ ] Date 필드가 YYYY-MM-DD 형식인가?
- [ ] Gender가 Female/Male로만 구성되어 있는가?
- [ ] UID가 고유한가?
- [ ] 전화번호 형식이 통일되어 있는가?

---

## 📞 지원 및 문의

- Airtable 공식 문서: https://support.airtable.com/
- API 문서: https://airtable.com/api
- 작성일: 2025.09.25