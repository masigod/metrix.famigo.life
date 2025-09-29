# Google Sheets → Airtable 동기화 설정 가이드

## 문제 해결 완료!

Google Sheets에서 데이터를 가져와서 Airtable로 동기화하는 시스템을 구성했습니다.

## 🔧 설정 방법

### 1. Google Sheets 설정

현재 Google Sheets가 **비공개**로 설정되어 있어 접근할 수 없습니다. 다음 중 하나를 선택해주세요:

#### 옵션 A: Google Sheets를 공개로 설정 (가장 간단)
1. Google Sheets 열기: https://docs.google.com/spreadsheets/d/1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY
2. 우측 상단 "공유" 버튼 클릭
3. "일반 액세스" → "링크가 있는 모든 사용자" → "뷰어" 선택
4. 완료!

#### 옵션 B: Google Service Account 사용 (보안 유지)
1. Google Cloud Console 접속: https://console.cloud.google.com/
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "사용 설정된 API" → "Google Sheets API" 활성화
4. "사용자 인증 정보" → "서비스 계정 만들기"
5. 서비스 계정 생성 후 JSON 키 다운로드
6. 다운로드한 파일을 `/Users/lua/Metrix/credentials.json`으로 저장
7. Google Sheets에서 서비스 계정 이메일에 뷰어 권한 부여

### 2. Airtable 설정

1. Airtable 로그인: https://airtable.com/
2. Account → Developer hub → Create new token
3. 다음 권한 설정:
   - **Scopes**:
     - data.records:read
     - data.records:write
     - schema.bases:read
   - **Access**: 해당 Base 선택

4. 생성된 토큰 복사

### 3. 환경 변수 설정

`.env` 파일을 수정:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_ID=1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY
GOOGLE_SHEETS_RANGE=Sheet1!A1:Z1000

# Airtable Configuration
AIRTABLE_API_KEY=여기에_Airtable_API_토큰_입력
AIRTABLE_BASE_ID=여기에_Base_ID_입력
AIRTABLE_TABLE_NAME=ManagementPanel

# Cache Configuration
CACHE_DIR=./cache
CACHE_EXPIRY_MINUTES=15
```

### 4. Airtable Base ID 찾기

1. Airtable에서 해당 Base 열기
2. URL 확인: `https://airtable.com/appXXXXXXXXXXXX/...`
3. `appXXXXXXXXXXXX` 부분이 Base ID

## 📊 테이블 구조

### Airtable "ManagementPanel" 테이블 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| uid | Single line text | 고유 식별자 |
| name | Single line text | 이름 |
| phone | Phone | 전화번호 |
| email | Email | 이메일 |
| gender | Single select | 성별 (Male/Female) |
| reservation_date | Date | 예약 날짜 |
| reservation_time_slot | Single line text | 예약 시간 |
| reservation_location | Single select | 예약 지점 (Seoul/Suwon) |
| participation_result | Single select | 참여 상태 |
| confirmation_status | Single select | 확정 상태 |
| data_source | Single line text | 데이터 출처 |
| sync_timestamp | Date/Time | 동기화 시간 |
| notes | Long text | 메모 |

## 🚀 실행 방법

### 1. 수동 실행

```bash
cd /Users/lua/Metrix

# Google Sheets 데이터 가져오기 (공개 설정 후)
python3 scripts/google_sheets_fetch_simple.py

# Airtable로 업로드
python3 scripts/airtable_sync.py

# 또는 전체 파이프라인 실행
./scripts/run_full_sync.sh
```

### 2. 자동 동기화 설정

```bash
# crontab 설정 (30분마다 실행)
crontab -e

# 다음 라인 추가:
*/30 * * * * cd /Users/lua/Metrix && ./scripts/run_full_sync.sh >> logs/cron.log 2>&1
```

## ⚠️ 현재 이슈

1. **Google Sheets 접근 권한**: 시트가 비공개로 설정되어 있어 데이터를 가져올 수 없음
   - 해결: 위의 옵션 A 또는 B 선택

2. **Airtable API 키 미설정**: `.env` 파일에 API 키가 없음
   - 해결: 위의 Airtable 설정 단계 따르기

## 📝 테스트 방법

1. Google Sheets 공개 설정 확인:
```bash
curl "https://docs.google.com/spreadsheets/d/1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY/export?format=csv&gid=448929090" -I
```

2. Airtable 연결 테스트:
```bash
curl https://api.airtable.com/v0/YOUR_BASE_ID/ManagementPanel \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

## 🎯 완료 후 기대 효과

- Google Sheets의 데이터가 자동으로 Airtable로 동기화됨
- Management Panel (management.html)에서 실시간으로 데이터 확인 가능
- 15분 캐시로 빠른 응답 속도
- 30분마다 자동 동기화

## 📞 도움이 필요하시면

위 설정을 완료한 후에도 문제가 있다면 다음 정보와 함께 알려주세요:
1. Google Sheets 공개 설정 여부
2. Airtable API 키 생성 여부
3. 에러 메시지 (있다면)