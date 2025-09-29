# 📌 최종 해결 방안 - Google Sheets to Airtable 동기화

## 현재 상황

Google Sheets가 비공개로 설정되어 있고, Google 계정 정보(`help@owelers.co.kr`)를 가지고 있지만, **Google의 보안 정책상 username/password로는 API 접근이 불가능**합니다.

## ✅ 실행 가능한 해결책 (우선순위 순)

### 방법 1: Google Service Account 사용 (가장 안전하고 권장) ⭐

1. **제공된 Google 계정으로 로그인**
   ```
   Email: help@owelers.co.kr
   Password: fam1go@nobenefit24&
   ```

2. **Google Cloud Console 설정**
   - https://console.cloud.google.com/ 접속
   - 새 프로젝트 생성
   - Google Sheets API 활성화
   - Service Account 생성
   - JSON 키 다운로드

3. **Google Sheets에 권한 부여**
   - Service Account 이메일 복사 (예: `service@project.iam.gserviceaccount.com`)
   - Google Sheets 열기
   - 공유 → Service Account 이메일 추가 (뷰어 권한)

4. **스크립트 실행**
   ```bash
   # JSON 키 파일을 credentials.json으로 저장 후
   python3 scripts/google_sheets_sync.py
   ```

### 방법 2: OAuth2 인증 사용 (사용자 동의 필요)

1. **Google Cloud Console에서 OAuth2 설정**
   - OAuth 2.0 클라이언트 ID 생성
   - 리다이렉트 URI: `http://localhost:8080`
   - credentials 다운로드

2. **첫 실행시 브라우저 인증**
   ```bash
   python3 scripts/google_sheets_auth_sync.py
   # 브라우저가 열리면 Google 계정으로 로그인
   ```

### 방법 3: Google Sheets 공개 설정 (가장 간단하지만 보안 취약) ⚠️

1. **Google Sheets 공개 설정**
   - Google 계정으로 로그인
   - [스프레드시트 열기](https://docs.google.com/spreadsheets/d/1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY)
   - 공유 → "링크가 있는 모든 사용자" → "뷰어"

2. **스크립트 실행**
   ```bash
   python3 scripts/google_sheets_fetch_simple.py
   ```

### 방법 4: 수동 CSV 다운로드 후 처리 (임시 해결책)

1. **Google Sheets에서 CSV 다운로드**
   - Google 계정으로 로그인
   - 파일 → 다운로드 → CSV

2. **CSV 파일을 cache 폴더에 저장**
   ```bash
   mv ~/Downloads/서울_관리.csv /Users/lua/Metrix/cache/seoul.csv
   mv ~/Downloads/수원_관리.csv /Users/lua/Metrix/cache/suwon.csv
   ```

3. **Airtable로 업로드**
   ```bash
   python3 scripts/airtable_sync.py --from-csv
   ```

## 📊 Airtable Credentials Table 구성

### SystemCredentials 테이블 생성

| Field | Type | Value |
|-------|------|-------|
| credential_id | Autonumber | 1 |
| service_name | Single Select | Google |
| credential_type | Single Select | USERNAME_PASSWORD |
| username | Text | help@owelers.co.kr |
| password | Password | (암호화 저장) |
| additional_config | Long Text | {"spreadsheet_id": "..."} |
| is_active | Checkbox | ✓ |
| environment | Single Select | Production |

## 🔐 보안 권고사항

1. **절대 비밀번호를 평문으로 저장하지 마세요**
2. **Service Account 방식을 우선 사용하세요**
3. **API 키는 환경 변수로 관리하세요**
4. **정기적으로 비밀번호를 변경하세요**

## 🚀 완전 자동화 설정

### 1. Service Account 설정 완료 후

```bash
# .env 파일 수정
echo "GOOGLE_SERVICE_ACCOUNT_FILE=credentials.json" >> .env
echo "AIRTABLE_API_KEY=your_key" >> .env
echo "AIRTABLE_BASE_ID=your_base" >> .env

# 전체 동기화 실행
./scripts/run_full_sync.sh
```

### 2. Cron 자동 실행 설정

```bash
# 30분마다 자동 실행
crontab -e

# 추가:
*/30 * * * * cd /Users/lua/Metrix && ./scripts/run_full_sync.sh
```

## 📝 현재 진행 상태

✅ **완료된 작업:**
- Airtable credentials 테이블 스키마 정의
- Google Sheets 동기화 스크립트 작성
- 환경 설정 파일 생성
- Python 패키지 설치

⏳ **필요한 작업:**
1. Google Cloud Console에서 Service Account 생성
2. 또는 Google Sheets 공개 설정
3. Airtable API 키 생성 및 설정
4. 동기화 테스트

## 🆘 문제 해결

### "401 Unauthorized" 오류
→ Google Sheets가 비공개 상태. 위 방법 중 하나 선택

### "No module named 'google'" 오류
```bash
pip3 install -r requirements.txt
```

### Airtable 연결 실패
→ `.env` 파일에 API 키 설정 확인

## 📞 지원

설정에 어려움이 있으시면 다음 정보와 함께 문의하세요:
- 선택한 방법 (1~4)
- 발생한 오류 메시지
- 완료한 단계

---

**중요**: Google 계정 정보는 안전하게 보관하시고, 공개 저장소에 올리지 마세요!