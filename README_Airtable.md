# Metrix Airtable 연동 시스템

## 개요
Metrix 예약 관리 시스템을 Airtable과 실시간으로 연동하여 데이터를 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능
- ✅ Airtable 실시간 데이터 동기화
- ✅ CSV 파일을 Airtable로 직접 가져오기
- ✅ 인라인 편집 및 즉시 저장
- ✅ 자동 동기화 (30초 간격)
- ✅ 상태별/날짜별 필터링
- ✅ Excel 내보내기

## 파일 구조
```
/Users/owlers_dylan/Metrix/
├── reservation-tracker-airtable.html  # 메인 웹 애플리케이션
├── airtable-config.js                # Airtable 설정 파일
├── airtable-service.js               # Airtable API 서비스 모듈
└── README_Airtable.md               # 설명서
```

## 설치 및 설정

### 1. Airtable 준비

1. [Airtable](https://airtable.com) 계정 생성
2. 새 Base 생성 또는 기존 Base 사용
3. 테이블 생성 (예: `Metrix_Reservations`)

### 2. Airtable API 키 발급

1. [Airtable Account](https://airtable.com/account) 접속
2. "Personal access tokens" 섹션에서 새 토큰 생성
3. 필요한 권한 설정:
   - `data.records:read` - 레코드 읽기
   - `data.records:write` - 레코드 쓰기
   - `schema.bases:read` - Base 구조 읽기

### 3. Base ID 확인

1. Airtable에서 사용할 Base 열기
2. URL에서 Base ID 확인: `https://airtable.com/app[BASE_ID]/...`
3. `app`으로 시작하는 문자열이 Base ID

### 4. 필드 매핑 설정

`airtable-config.js` 파일에서 Airtable 필드와 로컬 필드 매핑 수정:

```javascript
const FIELD_MAPPING = {
    'Name': '작성자',          // Airtable 필드 : 로컬 필드
    'Email': '아이디',
    'Phone': '21-1, Please write your phone number.',
    // ... 필요에 따라 추가/수정
};
```

## 사용 방법

### 1. 웹 애플리케이션 실행

```bash
# 브라우저에서 직접 열기
open /Users/owlers_dylan/Metrix/reservation-tracker-airtable.html

# 또는 Python 서버로 실행
cd /Users/owlers_dylan/Metrix/
python -m http.server 8000
# 브라우저에서 http://localhost:8000/reservation-tracker-airtable.html 접속
```

### 2. Airtable 연결

1. API Key 입력: Personal Access Token
2. Base ID 입력: app로 시작하는 ID
3. Table Name 입력: 테이블 이름 (예: Metrix_Reservations)
4. "Airtable 연결" 버튼 클릭

### 3. 데이터 관리

#### CSV 가져오기
1. CSV 파일 선택
2. "CSV → Airtable" 버튼 클릭
3. 자동으로 Airtable에 데이터 업로드

#### 실시간 편집
- 예약 날짜/시간 클릭하여 직접 수정
- 변경사항은 즉시 Airtable에 저장

#### 자동 동기화
- "자동 동기화" 토글 활성화
- 30초마다 자동으로 데이터 새로고침

## Airtable 테이블 구조 예시

| 필드명 | 타입 | 설명 |
|--------|------|------|
| Name | Single line text | 예약자 이름 |
| Email | Email | 이메일 주소 |
| Phone | Phone number | 전화번호 |
| Reservation_Date | Date | 예약 날짜 |
| Reservation_Time | Single line text | 예약 시간 |
| Status | Single select | 상태 (예약대기/확정/완료 등) |
| Location | Single select | 예약 지점 |
| Nationality | Single line text | 국적 |
| Participation_Result | Single select | 참여 결과 |
| Notes | Long text | 비고 |

## 보안 주의사항

⚠️ **중요**: API 키는 절대 공개 저장소에 커밋하지 마세요!

- API 키는 브라우저 LocalStorage에 암호화되어 저장됩니다
- 프로덕션 환경에서는 서버 측 프록시 사용을 권장합니다
- API 키는 최소 권한 원칙에 따라 필요한 권한만 부여하세요

## API 제한사항

- Airtable API 요청 제한: 5 requests/second
- 한 번에 최대 100개 레코드 조회
- 한 번에 최대 10개 레코드 생성/수정
- 페이로드 크기: 최대 500KB

## 문제 해결

### 연결 실패
- API 키가 올바른지 확인
- Base ID가 정확한지 확인
- 테이블 이름이 정확한지 확인 (대소문자 구분)
- 네트워크 연결 상태 확인

### 데이터가 표시되지 않음
- 필드 매핑이 올바른지 확인
- Airtable 테이블에 데이터가 있는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 저장 실패
- API 키에 쓰기 권한이 있는지 확인
- 필드 타입이 일치하는지 확인
- API 요청 제한에 걸리지 않았는지 확인

## 추가 개발 가능 기능

- [ ] 웹훅을 통한 실시간 업데이트
- [ ] 배치 작업 큐 시스템
- [ ] 오프라인 모드 지원
- [ ] 데이터 충돌 해결 메커니즘
- [ ] 다중 테이블 동기화
- [ ] 커스텀 필드 타입 지원
- [ ] 데이터 백업/복원 기능

## 라이선스
내부 사용 전용

## 지원
문의사항은 개발팀에 연락하세요.