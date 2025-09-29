# Airtable Credentials Table Schema

## Table Name: `SystemCredentials`

외부 시스템 접근을 위한 인증 정보를 안전하게 관리하는 테이블입니다.

## 📊 테이블 구조

### 필드 정의

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| **credential_id** | Autonumber | 고유 식별자 (자동 생성) | 1, 2, 3... |
| **service_name** | Single Select | 서비스 이름 | Google, Airtable, Netlify |
| **credential_type** | Single Select | 인증 타입 | OAuth2, API_KEY, USERNAME_PASSWORD |
| **username** | Single line text | 사용자명/이메일 | help@owelers.co.kr |
| **password** | Password* | 비밀번호 (암호화 저장) | •••••••• |
| **api_key** | Password* | API 키 (해당시) | •••••••• |
| **refresh_token** | Long text | OAuth 리프레시 토큰 | (토큰 값) |
| **access_token** | Long text | OAuth 액세스 토큰 | (토큰 값) |
| **token_expiry** | Date & time | 토큰 만료 시간 | 2024-09-30 15:00 |
| **additional_config** | Long text (JSON) | 추가 설정 정보 | {"spreadsheet_id": "..."} |
| **is_active** | Checkbox | 활성화 상태 | ✓ |
| **environment** | Single Select | 환경 | Production, Development, Test |
| **created_at** | Created time | 생성 시간 | (자동) |
| **updated_at** | Last modified time | 수정 시간 | (자동) |
| **created_by** | Created by | 생성자 | (자동) |
| **notes** | Long text | 메모 | 관리용 Google 계정 |

## 🔐 보안 고려사항

### Password 필드 타입 설정
Airtable은 기본적으로 Password 필드 타입을 제공하지 않으므로, 다음 중 선택:

1. **Single line text + View 권한 제한**
   - 특정 사용자만 볼 수 있도록 View 권한 설정
   - Interface Designer에서 마스킹 처리

2. **Attachment 필드 사용**
   - 암호화된 파일로 저장
   - 접근 시에만 복호화

3. **외부 시크릿 관리 연동**
   - Airtable에는 참조 ID만 저장
   - 실제 비밀번호는 별도 서비스 사용

## 📝 초기 데이터 입력

### Google Sheets 접근용 레코드:

```json
{
  "credential_id": 1,
  "service_name": "Google",
  "credential_type": "USERNAME_PASSWORD",
  "username": "help@owelers.co.kr",
  "password": "[암호화된 비밀번호]",
  "api_key": "",
  "refresh_token": "",
  "access_token": "",
  "token_expiry": null,
  "additional_config": {
    "spreadsheet_id": "1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY",
    "scopes": ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    "sheets": {
      "seoul": {"name": "서울 관리", "gid": "448929090"},
      "suwon": {"name": "수원 관리", "gid": ""}
    }
  },
  "is_active": true,
  "environment": "Production",
  "notes": "K-Beauty 예약 데이터 관리용 Google 계정"
}
```

## 🛠️ Airtable에서 테이블 생성 방법

1. **Airtable Base에 접속**
2. **"Add or import" → "Create empty table"** 클릭
3. **테이블 이름을 "SystemCredentials"로 설정**
4. **위 필드들을 순서대로 추가**:
   - 각 필드 타입 선택
   - Single Select 필드는 옵션 추가:
     - service_name: Google, Airtable, Netlify, Other
     - credential_type: OAuth2, API_KEY, USERNAME_PASSWORD
     - environment: Production, Development, Test

## 🔄 Formula 필드 추가 (선택사항)

### display_name (Formula)
```
CONCATENATE(
  service_name,
  " - ",
  environment,
  IF(is_active, " ✓", " ✗")
)
```
결과: "Google - Production ✓"

### token_status (Formula)
```
IF(
  AND(token_expiry, token_expiry > NOW()),
  "🟢 Valid",
  IF(token_expiry, "🔴 Expired", "⚫ N/A")
)
```

### masked_password (Formula)
```
IF(
  LEN(password) > 0,
  CONCATENATE(LEFT(password, 3), "****"),
  ""
)
```

## 🔒 View 생성

### 1. Active Credentials View
- Filter: `is_active = TRUE`
- Sort: `service_name ASC`
- Hidden fields: password, api_key

### 2. Google Services View
- Filter: `service_name = "Google"`
- Visible fields: username, additional_config, token_status

### 3. Admin View
- All fields visible
- Grouped by: service_name
- Color coding by environment

## 🚨 중요 보안 사항

1. **절대 비밀번호를 평문으로 저장하지 마세요**
2. **Airtable Base 권한을 최소한으로 제한하세요**
3. **민감한 정보는 환경 변수나 시크릿 매니저 사용을 권장합니다**
4. **정기적으로 토큰과 비밀번호를 교체하세요**

## 📌 참고사항

- Airtable API로 이 테이블에 접근할 때는 별도의 API 키가 필요합니다
- 비밀번호 필드는 Airtable Interface Designer에서만 마스킹 가능합니다
- 프로덕션 환경에서는 AWS Secrets Manager, HashiCorp Vault 등의 전문 시크릿 관리 도구 사용을 권장합니다