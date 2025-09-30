# 🚀 Credentials Manager Quick Start Guide

빠르게 Google 계정을 등록하고 테스트하는 가이드입니다.

---

## ⚡ 5분 안에 시작하기

### 1️⃣ Airtable 테이블 생성 (2분)

1. Airtable Base 열기
2. 새 테이블 생성: `SystemCredentials`
3. 다음 필드 추가:

```
필드명                 | 타입              | 옵션
--------------------|------------------|------------------
credential_id       | Autonumber       | (자동)
service_name        | Single Select    | Google, Airtable, Netlify, Other
credential_type     | Single Select    | USERNAME_PASSWORD, API_KEY, OAuth2
username            | Single line text |
password            | Long text        |
api_key             | Long text        |
additional_config   | Long text        |
is_active           | Checkbox         | (기본 체크)
environment         | Single Select    | Production, Development, Test
notes               | Long text        |
created_at          | Created time     | (자동)
updated_at          | Last modified    | (자동)
```

**주의**: Single Select 옵션 값은 정확히 일치해야 합니다!

---

### 2️⃣ Netlify 환경 변수 설정 (1분)

Netlify Dashboard → Site Settings → Environment Variables

```bash
Airtable_API_Key=pat.xxxxxxxxxxxxxxxxxx
Airtable_Base_ID=appXXXXXXXXXXXX
Airtable_SystemCredentials_ID=SystemCredentials
```

**저장 후 사이트 재배포!**

---

### 3️⃣ 스키마 검증 (선택, 1분)

로컬에서 검증:

```bash
cd /Users/lua/Metrix

# 환경 변수 설정
export Airtable_API_Key=pat.xxxxx
export Airtable_Base_ID=appXXXX
export Airtable_SystemCredentials_ID=SystemCredentials

# 검증 실행
npm run verify:schema
```

또는:

```bash
node scripts/verify-airtable-schema.js
```

**예상 출력:**
```
✅ 모든 검증 통과! 테이블이 올바르게 구성되었습니다.
```

---

### 4️⃣ Google 계정 등록 (1분)

1. 브라우저에서 열기:
   ```
   https://[your-site].netlify.app/credentials-manager.html
   ```

2. 개발자 도구 콘솔 열기 (F12)

3. 폼 입력:
   ```
   Service Name: Google
   Credential Type: USERNAME_PASSWORD
   Username: help@owelers.co.kr
   Password: [실제 비밀번호]
   Environment: Production
   Status: ✓ Active

   Additional Configuration:
   {
     "spreadsheet_id": "1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY"
   }

   Notes: K-Beauty 예약 데이터 관리용
   Master Key: [강력한 키 입력 - 기억하세요!]
   ```

4. "Save Credentials" 클릭

5. 콘솔에서 확인:
   ```javascript
   ✅ Credential saved successfully: {success: true, ...}
   ```

6. Airtable에서 확인:
   - SystemCredentials 테이블 열기
   - 새 레코드 생성 확인

---

## ✅ 성공 확인

### 예상 결과

1. **토스트 메시지**:
   ```
   ✅ Credentials saved successfully to Airtable
   ```

2. **브라우저 콘솔**:
   ```javascript
   Sending credential data to API... {service_name: "Google", ...}
   ✅ Credential saved successfully: {success: true, credential: {...}}
   ```

3. **Netlify Function 로그** (Netlify Dashboard):
   ```
   Creating credential with data: {
     service_name: 'Google',
     credential_type: 'USERNAME_PASSWORD',
     has_password: true,
     has_additional_config: true
   }
   Credential created successfully: recXXXXXXXXXX
   ```

4. **Airtable 레코드**:
   ```
   credential_id: 1
   service_name: Google
   credential_type: USERNAME_PASSWORD
   username: help@owelers.co.kr
   password: U2FsdGVkX1+... (암호화됨)
   environment: Production
   is_active: ✓
   additional_config: {"spreadsheet_id": "..."}
   notes: K-Beauty 예약 데이터 관리용
   ```

---

## 🐛 문제 해결

### 문제: "Failed to save" 에러

#### 1. 콘솔 로그 확인
```javascript
❌ Failed to save credential: {
  error: "...",
  details: "..."
}
```

#### 2. 일반적인 오류와 해결 방법

| 에러 메시지 | 원인 | 해결 방법 |
|-----------|-----|----------|
| Missing required fields | service_name 또는 credential_type 누락 | 필수 필드 입력 |
| Invalid JSON format | additional_config JSON 오류 | JSON 형식 수정 (큰따옴표 사용) |
| INVALID_VALUE_FOR_COLUMN | Single Select 옵션 불일치 | Airtable에서 옵션 확인 |
| AUTHENTICATION_REQUIRED | API Key 오류 | Netlify 환경 변수 확인 |
| NOT_FOUND | 테이블명 오류 | 테이블명이 "SystemCredentials"인지 확인 |

#### 3. Single Select 옵션 확인

**service_name** 옵션:
- Google (정확히 이 이름)
- Airtable
- Netlify
- Other

**credential_type** 옵션:
- USERNAME_PASSWORD (대소문자 정확히)
- API_KEY
- OAuth2

**environment** 옵션:
- Production
- Development
- Test

---

### 문제: 콘솔에 에러 없는데 Airtable에 저장 안됨

#### 확인 사항

1. **Netlify Function 로그 확인**
   ```
   Netlify Dashboard → Functions → credentials-api → Logs
   ```

   찾을 로그:
   ```
   Credential created successfully: recXXXX
   ```

2. **Airtable 권한 확인**
   - Personal Access Token에 Base 쓰기 권한 있는지 확인
   - Token 생성 시 "data.records:write" 권한 체크

3. **환경 변수 재확인**
   ```bash
   # Netlify Dashboard에서 확인
   Airtable_API_Key=pat... (pat. 으로 시작해야 함)
   Airtable_Base_ID=app... (app 으로 시작해야 함)
   Airtable_SystemCredentials_ID=SystemCredentials (정확히 일치)
   ```

   **수정 후 반드시 사이트 재배포!**

---

## 📚 자세한 가이드

더 자세한 정보는 다음 문서를 참고하세요:

1. **문제 진단 및 수정 리포트**
   - `/Users/lua/Metrix/CREDENTIALS_MANAGER_FIX_REPORT.md`
   - 모든 수정 사항과 근본 원인 분석

2. **상세 테스트 가이드**
   - `/Users/lua/Metrix/CREDENTIALS_TESTING_GUIDE.md`
   - 모든 테스트 시나리오와 디버깅 가이드

3. **Airtable 스키마**
   - `/Users/lua/Metrix/AIRTABLE_CREDENTIAL_SYSTEM_SCHEMA.md`
   - 완전한 4개 테이블 시스템 스키마

---

## 🎯 다음 단계

### Google Sheets API 연동

credential을 등록한 후, management.js에서 사용:

```javascript
// 저장된 credential 가져오기
const credential = await fetchCredential('Google');

// Google Sheets 데이터 가져오기
const sheetsData = await fetchGoogleSheets(
  credential.username,
  decryptPassword(credential.password, masterKey),
  credential.additional_config.spreadsheet_id
);
```

### 추가 기능 개발

1. **자동 토큰 갱신** (OAuth2)
2. **사용 로그 기록** (CredentialUsageLog)
3. **감사 로그** (CredentialAuditLog)
4. **접근 권한 관리** (CredentialRequest)

---

## 🔐 보안 체크리스트

- [ ] Master Key를 안전하게 보관 (1Password, LastPass 등)
- [ ] .env 파일을 .gitignore에 추가
- [ ] 실제 비밀번호가 로그에 출력되지 않는지 확인
- [ ] Airtable에 암호화된 형태로 저장되었는지 확인
- [ ] Netlify 환경 변수가 public이 아닌지 확인

---

## 📞 지원

문제가 계속되면:

1. 브라우저 콘솔 로그 캡처
2. Netlify Function 로그 캡처
3. Airtable 스크린샷 캡처
4. 위 문서들 참조

---

**작성자**: Claude Code
**최종 업데이트**: 2025-09-30

**빠른 링크**:
- [수정 리포트](./CREDENTIALS_MANAGER_FIX_REPORT.md)
- [테스트 가이드](./CREDENTIALS_TESTING_GUIDE.md)
- [스키마 문서](./AIRTABLE_CREDENTIAL_SYSTEM_SCHEMA.md)