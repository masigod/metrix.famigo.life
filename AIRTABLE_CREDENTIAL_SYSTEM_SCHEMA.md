# 📊 Airtable Credential System - Complete Schema

## 시스템 구성

완전한 인증 관리 시스템을 위한 4개의 연관 테이블:

1. **SystemCredentials** - 인증 정보 저장
2. **CredentialUsageLog** - 사용 로그
3. **CredentialAuditLog** - 감사 로그
4. **CredentialRequest** - 인증 요청 관리

---

## 1️⃣ SystemCredentials Table

### 용도
외부 시스템 인증 정보를 암호화하여 저장

### 필드 정의

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| credential_id | Autonumber | 고유 식별자 | 1, 2, 3... |
| service_name | Single Select | 서비스 이름 | Google, Airtable, Netlify |
| credential_type | Single Select | 인증 타입 | USERNAME_PASSWORD, API_KEY, OAuth2 |
| username | Single line text | 사용자명/이메일 | help@owelers.co.kr |
| password | Long text | 암호화된 비밀번호 | U2FsdGVkX1+... |
| api_key | Long text | 암호화된 API 키 | U2FsdGVkX1+... |
| refresh_token | Long text | OAuth 리프레시 토큰 | (토큰 값) |
| access_token | Long text | OAuth 액세스 토큰 | (토큰 값) |
| token_expiry | Date & time | 토큰 만료 시간 | 2024-12-31 23:59 |
| additional_config | Long text | 추가 설정 (JSON) | {"spreadsheet_id": "..."} |
| is_active | Checkbox | 활성화 상태 | ✓ |
| environment | Single Select | 환경 | Production, Development, Test |
| last_used | Date & time | 마지막 사용 시간 | 2024-09-29 15:30 |
| usage_count | Number | 사용 횟수 | 42 |
| created_at | Created time | 생성 시간 | (자동) |
| updated_at | Last modified time | 수정 시간 | (자동) |
| created_by | Single line text | 생성자 | admin@company.com |
| notes | Long text | 메모 | 관리용 Google 계정 |

---

## 2️⃣ CredentialUsageLog Table

### 용도
인증 정보 사용 이력을 추적

### 필드 정의

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| log_id | Autonumber | 로그 ID | 1, 2, 3... |
| credential_id | Link to SystemCredentials | 사용된 인증 정보 | [SystemCredentials/1] |
| service_name | Lookup | 서비스명 (자동) | Google |
| action | Single Select | 수행 작업 | LOGIN, API_CALL, TOKEN_REFRESH |
| status | Single Select | 결과 상태 | SUCCESS, FAILED, ERROR |
| ip_address | Single line text | 요청 IP | 192.168.1.100 |
| user_agent | Long text | 브라우저 정보 | Mozilla/5.0... |
| request_method | Single Select | HTTP 메서드 | GET, POST, PUT, DELETE |
| endpoint | Single line text | API 엔드포인트 | /sheets/v4/values |
| response_code | Number | HTTP 응답 코드 | 200, 401, 500 |
| error_message | Long text | 오류 메시지 | Authentication failed |
| execution_time | Number | 실행 시간(ms) | 234 |
| data_processed | Number | 처리된 데이터 수 | 1500 |
| timestamp | Created time | 로그 시간 | (자동) |
| user_email | Single line text | 사용자 이메일 | user@company.com |
| session_id | Single line text | 세션 ID | sess_abc123... |

---

## 3️⃣ CredentialAuditLog Table

### 용도
인증 정보 변경 사항 감사 추적

### 필드 정의

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| audit_id | Autonumber | 감사 로그 ID | 1, 2, 3... |
| credential_id | Link to SystemCredentials | 대상 인증 정보 | [SystemCredentials/1] |
| action_type | Single Select | 작업 유형 | CREATE, UPDATE, DELETE, VIEW, DECRYPT |
| field_changed | Single line text | 변경된 필드 | password, api_key |
| old_value | Long text | 이전 값 (마스킹) | ****1234 |
| new_value | Long text | 새 값 (마스킹) | ****5678 |
| changed_by | Single line text | 변경자 | admin@company.com |
| change_reason | Long text | 변경 사유 | 정기 비밀번호 변경 |
| ip_address | Single line text | IP 주소 | 192.168.1.100 |
| user_agent | Long text | 브라우저 정보 | Mozilla/5.0... |
| risk_level | Single Select | 위험 수준 | LOW, MEDIUM, HIGH, CRITICAL |
| approved_by | Single line text | 승인자 | manager@company.com |
| approval_date | Date & time | 승인 일시 | 2024-09-29 14:00 |
| timestamp | Created time | 감사 로그 시간 | (자동) |
| compliance_check | Checkbox | 규정 준수 확인 | ✓ |
| notes | Long text | 추가 메모 | 보안 정책에 따른 변경 |

---

## 4️⃣ CredentialRequest Table

### 용도
인증 정보 생성/수정 요청 관리 워크플로우

### 필드 정의

| Field Name | Field Type | Description | Example |
|------------|------------|-------------|---------|
| request_id | Autonumber | 요청 ID | 1, 2, 3... |
| request_type | Single Select | 요청 유형 | NEW, UPDATE, DELETE, ACCESS |
| service_name | Single Select | 대상 서비스 | Google, Airtable |
| credential_type | Single Select | 인증 타입 | API_KEY, USERNAME_PASSWORD |
| requested_by | Single line text | 요청자 | developer@company.com |
| request_date | Created time | 요청 일시 | (자동) |
| business_justification | Long text | 업무 사유 | 데이터 동기화 자동화 필요 |
| urgency | Single Select | 긴급도 | LOW, NORMAL, HIGH, CRITICAL |
| status | Single Select | 처리 상태 | PENDING, APPROVED, REJECTED, COMPLETED |
| assigned_to | Single line text | 담당자 | security@company.com |
| approved_by | Single line text | 승인자 | manager@company.com |
| approval_date | Date & time | 승인 일시 | 2024-09-29 15:00 |
| rejection_reason | Long text | 반려 사유 | 추가 검토 필요 |
| credential_created | Link to SystemCredentials | 생성된 인증 정보 | [SystemCredentials/5] |
| expiry_date | Date | 만료 예정일 | 2024-12-31 |
| access_level | Single Select | 접근 권한 수준 | READ, WRITE, ADMIN |
| department | Single Select | 부서 | IT, Marketing, Finance |
| project_name | Single line text | 프로젝트명 | K-Beauty Sync System |
| compliance_reviewed | Checkbox | 규정 검토 완료 | ✓ |
| security_reviewed | Checkbox | 보안 검토 완료 | ✓ |
| notes | Long text | 메모 | 임시 프로젝트용, 3개월 후 재검토 |

---

## 🔗 테이블 관계도

```
CredentialRequest (요청)
    ↓ [승인시]
SystemCredentials (저장) ←─── CredentialUsageLog (사용 기록)
    ↓
CredentialAuditLog (변경 감사)
```

## 📊 Views 설정

### SystemCredentials Views

1. **Active Credentials**
   - Filter: `is_active = TRUE AND environment = "Production"`
   - Sort: `service_name ASC`

2. **Expiring Soon**
   - Filter: `token_expiry < DATEADD(NOW(), 7, 'days')`
   - Sort: `token_expiry ASC`

3. **High Usage**
   - Filter: `usage_count > 100`
   - Sort: `usage_count DESC`

### CredentialUsageLog Views

1. **Failed Attempts**
   - Filter: `status = "FAILED"`
   - Sort: `timestamp DESC`

2. **Today's Activity**
   - Filter: `IS_SAME(timestamp, TODAY(), 'day')`
   - Sort: `timestamp DESC`

3. **By Service**
   - Group by: `service_name`
   - Sort: `Count DESC`

### CredentialAuditLog Views

1. **High Risk Changes**
   - Filter: `risk_level IN ("HIGH", "CRITICAL")`
   - Sort: `timestamp DESC`

2. **Password Changes**
   - Filter: `field_changed = "password"`
   - Sort: `timestamp DESC`

3. **Pending Approval**
   - Filter: `approved_by IS NULL`
   - Sort: `timestamp ASC`

### CredentialRequest Views

1. **Pending Requests**
   - Filter: `status = "PENDING"`
   - Sort: `urgency DESC, request_date ASC`

2. **My Requests**
   - Filter: `requested_by = CURRENT_USER()`
   - Sort: `request_date DESC`

3. **Approved This Week**
   - Filter: `status = "APPROVED" AND approval_date >= DATEADD(NOW(), -7, 'days')`
   - Sort: `approval_date DESC`

## 🔐 보안 권한 설정

### 역할별 권한

| Role | SystemCredentials | UsageLog | AuditLog | Request |
|------|------------------|----------|----------|---------|
| Admin | Full Access | Full Access | Full Access | Full Access |
| Manager | View, Update | View | View | Approve/Reject |
| Developer | View (masked) | View Own | - | Create |
| Auditor | View (masked) | View | View | View |

## 📈 자동화 설정

### Automations

1. **자동 만료 알림**
   - Trigger: `token_expiry < 30 days`
   - Action: Send email to owner

2. **비정상 사용 감지**
   - Trigger: `5 failed attempts in 10 minutes`
   - Action: Disable credential, notify security

3. **정기 감사 리포트**
   - Trigger: Weekly
   - Action: Generate audit report

4. **요청 자동 할당**
   - Trigger: New request created
   - Action: Assign to security team

## 📝 사용 예시

### 1. 새 인증 정보 요청
```
1. CredentialRequest 테이블에 새 요청 생성
2. 승인자가 검토 및 승인
3. SystemCredentials에 자동 생성
4. CredentialAuditLog에 CREATE 기록
```

### 2. 인증 정보 사용
```
1. API가 SystemCredentials 조회
2. 인증 정보로 외부 서비스 접근
3. CredentialUsageLog에 사용 기록
4. usage_count 자동 증가
```

### 3. 비밀번호 변경
```
1. SystemCredentials 업데이트
2. CredentialAuditLog에 UPDATE 기록
3. 이전/새 값 마스킹하여 저장
4. 변경 사유 기록
```

## 🎯 환경변수 설정

```bash
# Netlify Environment Variables
Airtable_API_Key=pat.xxxxx...
Airtable_Base_ID=appXXXXXXXXXXXX
Airtable_SystemCredentials_ID=SystemCredentials
Airtable_CredentialUsageLog_ID=CredentialUsageLog
Airtable_CredentialAuditLog_ID=CredentialAuditLog
Airtable_CredentialRequest_ID=CredentialRequest
```

---

이 4개 테이블 시스템으로 완전한 인증 관리, 추적, 감사가 가능합니다!