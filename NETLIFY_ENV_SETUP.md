# 🔧 Netlify 환경변수 설정 가이드

## 필수 환경변수

Netlify 대시보드에서 다음 환경변수들을 설정해야 합니다:

### 1. Airtable API 설정

```bash
# Airtable API 키
Airtable_API_Key=your_airtable_api_key_here

# Airtable Base ID
Airtable_Base_ID=your_base_id_here

# ManagementPanel 테이블 ID (기본값: ManagementPanel)
Airtable_ManagementPanel_ID=ManagementPanel

# SystemCredentials 테이블 ID (기본값: SystemCredentials)
Airtable_SystemCredentials_ID=SystemCredentials

# CredentialUsageLog 테이블 ID (기본값: CredentialUsageLog)
Airtable_CredentialUsageLog_ID=CredentialUsageLog

# CredentialAuditLog 테이블 ID (기본값: CredentialAuditLog)
Airtable_CredentialAuditLog_ID=CredentialAuditLog

# CredentialRequest 테이블 ID (기본값: CredentialRequest)
Airtable_CredentialRequest_ID=CredentialRequest
```

## 📋 설정 방법

### 1단계: Netlify 대시보드 접속

1. https://app.netlify.com 로그인
2. 해당 사이트 선택
3. "Site settings" → "Environment variables" 클릭

### 2단계: 환경변수 추가

각 환경변수를 추가:

| Key | Value | Description |
|-----|-------|-------------|
| `Airtable_API_Key` | pat.xxxxx... | Airtable Personal Access Token |
| `Airtable_Base_ID` | appXXXXXXXXXXXX | Airtable Base ID |
| `Airtable_ManagementPanel_ID` | ManagementPanel | 메인 데이터 테이블 이름 |
| `Airtable_SystemCredentials_ID` | SystemCredentials | 인증정보 테이블 이름 |

### 3단계: Airtable에서 값 찾기

#### API Key (Personal Access Token):
1. Airtable 로그인
2. https://airtable.com/create/tokens 접속
3. "Create token" 클릭
4. Scopes 선택:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. Access 선택: 해당 Base 선택
6. "Create token" 클릭
7. 생성된 토큰 복사 (pat.로 시작)

#### Base ID:
1. Airtable Base 열기
2. URL 확인: `https://airtable.com/appXXXXXXXXXXXX/...`
3. `appXXXXXXXXXXXX` 부분이 Base ID

#### Table Name/ID:
- Airtable에서 생성한 테이블 이름
- 보통 테이블 이름 그대로 사용
- 예: `SystemCredentials`, `ManagementPanel`

## 🔐 보안 주의사항

- 환경변수는 **절대 코드에 하드코딩하지 마세요**
- `.env` 파일은 `.gitignore`에 추가
- API 키는 정기적으로 교체
- 최소 권한 원칙 적용

## ✅ 설정 확인

### 테스트 방법:

1. **로컬 테스트** (.env 파일 사용):
```bash
# .env 파일 생성
echo "Airtable_API_Key=your_key" >> .env
echo "Airtable_Base_ID=your_base" >> .env
echo "Airtable_SystemCredentials_ID=SystemCredentials" >> .env

# Netlify Dev 실행
netlify dev
```

2. **배포 후 테스트**:
```javascript
// 브라우저 콘솔에서
fetch('/.netlify/functions/credentials-api?action=list')
  .then(res => res.json())
  .then(console.log)
```

## 📝 사용되는 곳

### 1. `netlify/functions/credentials-api.js`
```javascript
const API_KEY = process.env.Airtable_API_Key;
const BASE_ID = process.env.Airtable_Base_ID;
const TABLE_NAME = process.env.Airtable_SystemCredentials_ID || 'SystemCredentials';
```

### 2. `netlify/functions/management-api.js`
```javascript
const API_KEY = process.env.Airtable_API_Key;
const BASE_ID = process.env.Airtable_Base_ID;
const TABLE_NAME = process.env.Airtable_ManagementPanel_ID || 'ManagementPanel';
```

### 3. `netlify/functions/airtable.js`
```javascript
const API_KEY = process.env.Airtable_API_Key;
const BASE_ID = process.env.Airtable_Base_ID;
```

## 🚨 트러블슈팅

### "Environment variable not set" 오류:
- Netlify 대시보드에서 환경변수 설정 확인
- 배포 다시 트리거 (Clear cache and deploy)

### "401 Unauthorized" 오류:
- API 키가 올바른지 확인
- API 키 권한 확인 (read/write 권한 필요)

### "Table not found" 오류:
- 테이블 이름이 정확한지 확인
- 대소문자 구분 확인

## 📌 참고

- 환경변수 변경 후 **재배포 필요**
- 로컬과 프로덕션 환경변수 분리 관리
- Netlify CLI로 환경변수 관리 가능:
  ```bash
  netlify env:set KEY value
  netlify env:get KEY
  netlify env:list
  ```

---

**중요**: 환경변수 값은 절대 공개 저장소에 커밋하지 마세요!