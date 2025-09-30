# 🧪 Credentials Manager 테스트 가이드

**프로젝트**: Metrix K-Beauty System
**최종 업데이트**: 2025-09-30

---

## 📋 사전 준비 사항

### 1. Netlify 환경 변수 확인

Netlify Dashboard → Site Settings → Environment Variables

```bash
✓ Airtable_API_Key=pat.xxxxxxxxxxxxx
✓ Airtable_Base_ID=appXXXXXXXXXXXX
✓ Airtable_SystemCredentials_ID=SystemCredentials
```

### 2. Airtable 테이블 확인

**Base**: K-Beauty Management System
**Table**: SystemCredentials

필수 필드 확인:
- ✓ credential_id (Autonumber)
- ✓ service_name (Single Select: Google, Airtable, Netlify, Other)
- ✓ credential_type (Single Select: USERNAME_PASSWORD, API_KEY, OAuth2)
- ✓ username (Single line text)
- ✓ password (Long text)
- ✓ api_key (Long text)
- ✓ additional_config (Long text)
- ✓ is_active (Checkbox)
- ✓ environment (Single Select: Production, Development, Test)
- ✓ notes (Long text)
- ✓ created_at (Created time)

---

## 🚀 테스트 시나리오

### 시나리오 1: Google 계정 등록 (USERNAME_PASSWORD)

#### 목표
help@owelers.co.kr Google 계정을 SystemCredentials에 등록하여 Google Sheets API 접근

#### 단계별 절차

1. **페이지 열기**
   ```
   https://[your-site].netlify.app/credentials-manager.html
   ```

2. **브라우저 개발자 도구 열기**
   - Chrome: F12 또는 Cmd+Option+I (Mac)
   - Console 탭으로 이동

3. **폼 입력**
   ```
   Service Name: Google
   Credential Type: USERNAME_PASSWORD
   Username/Email: help@owelers.co.kr
   Password: [실제 Google 계정 비밀번호]
   Environment: Production
   Status: ✓ Active

   Additional Configuration (JSON):
   {
     "spreadsheet_id": "1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY",
     "sheets": {
       "seoul": {
         "name": "서울 관리",
         "gid": "448929090"
       },
       "suwon": {
         "name": "수원 관리",
         "gid": ""
       }
     }
   }

   Notes: K-Beauty 예약 데이터 관리용 Google 계정

   Master Encryption Key: [강력한 마스터 키 - 기억할 것!]
   ```

4. **"Save Credentials" 버튼 클릭**

5. **콘솔 로그 확인**
   ```javascript
   // 예상 출력:
   Sending credential data to API... {
     service_name: "Google",
     credential_type: "USERNAME_PASSWORD",
     environment: "Production",
     has_password: true,
     has_api_key: false
   }

   ✅ Credential saved successfully: {
     success: true,
     credential: {
       id: "recXXXXXXXXXX",
       fields: {...}
     }
   }
   ```

6. **토스트 메시지 확인**
   ```
   ✅ "Credentials saved successfully to Airtable"
   ```

7. **Airtable 확인**
   - Airtable Base 열기
   - SystemCredentials 테이블로 이동
   - 새 레코드 생성 확인:
     ```
     service_name: Google
     credential_type: USERNAME_PASSWORD
     username: help@owelers.co.kr
     password: U2FsdGVkX1+... (암호화됨)
     environment: Production
     is_active: ✓
     additional_config: {"spreadsheet_id": "..."}
     ```

#### 성공 기준
- ✅ 토스트 메시지: "Credentials saved successfully to Airtable"
- ✅ 콘솔 로그: "✅ Credential saved successfully"
- ✅ Airtable에 새 레코드 생성
- ✅ additional_config가 올바른 JSON 형식으로 저장
- ✅ password가 암호화된 형태로 저장

---

### 시나리오 2: Airtable API Key 등록

#### 목표
Airtable Personal Access Token 저장

#### 폼 입력
```
Service Name: Airtable
Credential Type: API_KEY
API Key: pat.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: Production
Status: ✓ Active
Notes: K-Beauty Base 접근용 API Key
Master Encryption Key: [마스터 키]
```

#### 예상 결과
- API Key가 암호화되어 저장
- credential_type = API_KEY
- username, password 필드는 null

---

### 시나리오 3: 필수 필드 누락 테스트

#### 목표
필수 필드 검증 동작 확인

#### 테스트 케이스

**테스트 3-1: service_name 누락**
```
Service Name: (비워둠)
Credential Type: API_KEY
→ 저장 시도
```

**예상 결과:**
```
❌ 토스트: "Failed to save: Missing required fields: service_name and credential_type are required"
```

**테스트 3-2: credential_type 누락**
```
Service Name: Google
Credential Type: (비워둠)
→ 저장 시도
```

**예상 결과:**
```
❌ 토스트: "Failed to save: Missing required fields: service_name and credential_type are required"
```

---

### 시나리오 4: JSON 검증 테스트

#### 목표
additional_config의 JSON 형식 검증 확인

#### 테스트 케이스

**테스트 4-1: 잘못된 JSON 형식**
```
Additional Configuration:
{invalid json format}
```

**예상 결과:**
```
❌ 토스트: "Failed to save: Invalid JSON format in additional_config field"
❌ 콘솔: "Invalid JSON in additional_config: SyntaxError..."
```

**테스트 4-2: 올바른 JSON**
```
Additional Configuration:
{"key": "value", "number": 123, "nested": {"a": 1}}
```

**예상 결과:**
```
✅ 저장 성공
✅ Airtable에 pretty-print 형식으로 저장:
{
  "key": "value",
  "number": 123,
  "nested": {
    "a": 1
  }
}
```

---

### 시나리오 5: 암호화/복호화 테스트

#### 목표
Master Key를 사용한 암호화 및 복호화 동작 확인

#### 단계

1. **데이터 입력 및 저장**
   ```
   Password: MySecretPassword123!
   Master Key: TestMasterKey2024
   → 저장
   ```

2. **Airtable 확인**
   ```
   password 필드 값: U2FsdGVkX1+xxxxxxxxxxxxxxxXXXXXX (암호화됨)
   ```

3. **복호화 테스트**
   - Credentials Manager 페이지에서 "View" 버튼 클릭
   - Master Key 입력: TestMasterKey2024
   - 복호화된 비밀번호 확인: MySecretPassword123!

4. **잘못된 Master Key 테스트**
   - "View" 버튼 클릭
   - 잘못된 Master Key 입력: WrongKey
   - 예상 결과: [Decryption Failed]

---

### 시나리오 6: 로컬 저장 폴백 테스트

#### 목표
Netlify Function 실패 시 로컬 저장 동작 확인

#### 시뮬레이션 방법

**옵션 1: 네트워크 차단**
- 브라우저 개발자 도구 → Network 탭
- "Offline" 체크
- 저장 시도

**옵션 2: 잘못된 환경 변수 (개발 환경)**
- Netlify 환경 변수 일시 삭제
- 저장 시도

#### 예상 동작
```
1. Netlify Function 호출 실패
2. 콘솔 에러: "❌ Network error: Failed to fetch"
3. 토스트: "Network error: Failed to fetch"
4. 확인 프롬프트: "Could not connect to server. Would you like to save locally?"
5. "확인" 클릭 시 → localStorage에 저장
6. 토스트: "Credentials saved locally"
```

---

## 🐛 문제 해결 가이드

### 문제 1: "Failed to save" 에러

#### 증상
토스트 메시지: "Failed to save: [에러 메시지]"

#### 진단 단계

1. **콘솔 로그 확인**
   ```javascript
   ❌ Failed to save credential: {
     error: "...",
     details: "...",
     airtable_response: {...}
   }
   ```

2. **에러 메시지별 해결 방법**

   **"Missing required fields"**
   - 원인: service_name 또는 credential_type 누락
   - 해결: 필수 필드 입력

   **"Invalid JSON format"**
   - 원인: additional_config JSON 형식 오류
   - 해결: JSON 형식 수정 (큰따옴표 사용, 쉼표 확인)

   **"INVALID_VALUE_FOR_COLUMN"**
   - 원인: Single Select 옵션 값 불일치
   - 해결: Airtable에서 Single Select 옵션 확인
     - service_name: Google, Airtable, Netlify, Other
     - credential_type: USERNAME_PASSWORD, API_KEY, OAuth2
     - environment: Production, Development, Test

   **"AUTHENTICATION_REQUIRED"**
   - 원인: Airtable API Key 오류
   - 해결: Netlify 환경 변수 확인

   **"NOT_FOUND"**
   - 원인: Base ID 또는 테이블명 오류
   - 해결: 환경 변수 확인
     - Airtable_Base_ID=appXXXXXXXXXXXX
     - Airtable_SystemCredentials_ID=SystemCredentials

---

### 문제 2: Airtable에 저장되지 않음

#### 진단 체크리스트

1. **Netlify Function 로그 확인**
   ```bash
   # Netlify Dashboard
   Site > Functions > credentials-api > Logs
   ```

   확인할 로그:
   ```
   Creating credential with data: {...}
   Sending request to Airtable: https://...
   Credential created successfully: recXXXX
   ```

2. **Airtable 권한 확인**
   - Personal Access Token에 Base 쓰기 권한 있는지 확인
   - Base 공유 설정 확인

3. **필드 타입 확인**
   - Airtable 스키마와 코드가 일치하는지 확인
   - AIRTABLE_CREDENTIAL_SYSTEM_SCHEMA.md 참조

---

### 문제 3: 암호화된 데이터를 복호화할 수 없음

#### 원인
- Master Key를 잊어버림
- 다른 Master Key로 저장

#### 해결 방법
**Master Key는 복구 불가능!**
- 새 credential을 다시 등록해야 함
- 중요: Master Key를 안전한 곳에 보관 (1Password, LastPass 등)

---

## 📊 Netlify Function 로그 해석

### 성공 시 로그
```
[INFO] Creating credential with data: {
  service_name: 'Google',
  credential_type: 'USERNAME_PASSWORD',
  environment: 'Production',
  is_active: true,
  has_password: true,
  has_api_key: false,
  has_additional_config: true
}

[INFO] Sending request to Airtable: https://api.airtable.com/v0/appXXXX/SystemCredentials

[INFO] Credential created successfully: recXXXXXXXXXX
```

### 실패 시 로그
```
[ERROR] Airtable API Error: {
  status: 422,
  statusText: 'Unprocessable Entity',
  error: {
    type: 'INVALID_VALUE_FOR_COLUMN',
    message: 'Field "credential_type" cannot accept value "WRONG_TYPE"'
  }
}
```

---

## 🎯 최종 체크리스트

테스트 완료 후 다음 사항을 확인하세요:

- [ ] Google 계정 등록 성공
- [ ] Airtable에 레코드 생성 확인
- [ ] additional_config JSON 형식 올바름
- [ ] password 암호화 확인
- [ ] 필수 필드 검증 동작 확인
- [ ] JSON 검증 동작 확인
- [ ] 에러 메시지가 명확하게 표시됨
- [ ] Master Key로 복호화 가능
- [ ] Netlify Function 로그 정상
- [ ] 로컬 저장 폴백 동작 확인

---

## 🔐 보안 체크리스트

- [ ] Master Key를 안전하게 보관
- [ ] 실제 비밀번호가 콘솔 로그에 출력되지 않음
- [ ] Airtable에 암호화된 형태로 저장됨
- [ ] API 응답에서 민감 정보가 마스킹됨
- [ ] Netlify Function 로그에 민감 정보 없음

---

## 📞 지원

문제가 계속 발생하면:

1. **진단 리포트 생성**
   - 브라우저 콘솔 전체 복사
   - Netlify Function 로그 복사
   - 에러 메시지 스크린샷

2. **환경 확인**
   - Netlify 환경 변수 스크린샷
   - Airtable 테이블 스키마 스크린샷

3. **문의**
   - CREDENTIALS_MANAGER_FIX_REPORT.md 참조
   - 상세 에러 정보 포함

---

**작성자**: Claude Code
**최종 업데이트**: 2025-09-30