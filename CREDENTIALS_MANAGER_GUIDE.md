# 🔐 System Credentials Manager 사용 가이드

## 개요

웹 기반 SystemCredentials 관리 시스템을 구축했습니다.
Google 계정 등 외부 시스템의 인증 정보를 **암호화**하여 안전하게 저장합니다.

## 🌟 주요 기능

### 1. **클라이언트 측 암호화**
- CryptoJS를 사용한 AES 암호화
- 마스터 키로 민감한 데이터 암호화
- 암호화된 상태로 Airtable 저장

### 2. **이중 보안**
- 클라이언트: AES 암호화
- 서버: SHA256 해시 추가

### 3. **안전한 저장**
- Airtable에 암호화된 형태로 저장
- 복호화는 마스터 키를 아는 사용자만 가능

## 📁 생성된 파일

### 1. `credentials-manager.html`
- 웹 기반 관리 인터페이스
- 암호화/복호화 기능 내장
- 실시간 암호화 미리보기

### 2. `netlify/functions/credentials-api.js`
- Airtable 연동 API
- CRUD 작업 처리
- 추가 보안 레이어

## 🚀 사용 방법

### 1단계: 페이지 접속

```bash
# 로컬에서 실행
open /Users/lua/Metrix/credentials-manager.html

# 또는 배포된 URL로 접속
https://your-site.netlify.app/credentials-manager.html
```

### 2단계: Google 계정 정보 입력

페이지 접속 후 자동 입력을 위해 URL에 파라미터 추가:
```
credentials-manager.html?preset=google
```

또는 수동으로 입력:

| 필드 | 값 |
|------|-----|
| Service Name | Google |
| Credential Type | Username/Password |
| Username | help@owelers.co.kr |
| Password | fam1go@nobenefit24& |
| Environment | Production |
| Master Key | **강력한 암호 설정** (예: MyStr0ng!K3y@2024) |

### 3단계: 추가 설정 (JSON)

```json
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
```

### 4단계: 저장

"Save Credentials" 버튼 클릭

## 🔑 암호화 프로세스

### 암호화 과정:
```javascript
원본: fam1go@nobenefit24&
마스터키: MyStr0ng!K3y@2024
암호화됨: U2FsdGVkX1+abc123...
```

### 복호화 과정:
```javascript
암호화됨: U2FsdGVkX1+abc123...
마스터키: MyStr0ng!K3y@2024
복호화됨: fam1go@nobenefit24&
```

## 🛡️ 보안 특징

### 1. **마스터 키 관리**
- 마스터 키는 **절대 저장되지 않음**
- 사용자가 기억해야 함
- 복호화 시마다 입력 필요

### 2. **로컬 스토리지 백업**
- Airtable 연결 실패 시 로컬 저장
- 브라우저에 암호화된 상태로 저장

### 3. **서버 측 보안**
- Netlify Function에서 추가 해싱
- API 응답에서 민감한 데이터 제거

## 📊 Airtable 테이블 구조

SystemCredentials 테이블:

| 필드 | 타입 | 설명 |
|------|------|------|
| credential_id | Autonumber | 자동 ID |
| service_name | Single Select | Google/Airtable/Netlify |
| credential_type | Single Select | USERNAME_PASSWORD/API_KEY |
| username | Text | 사용자명 |
| password | Text | **암호화된** 비밀번호 |
| api_key | Text | **암호화된** API 키 |
| environment | Single Select | Production/Development |
| is_active | Checkbox | 활성 상태 |
| additional_config | Long Text | JSON 설정 |

## 🔄 데이터 흐름

```
1. 사용자 입력
   ↓
2. 클라이언트 암호화 (CryptoJS)
   ↓
3. Netlify Function API 호출
   ↓
4. 서버 측 추가 처리
   ↓
5. Airtable 저장
```

## 🚨 중요 주의사항

### ⚠️ 마스터 키 관리
- **마스터 키를 잊으면 데이터 복구 불가**
- 안전한 곳에 별도 보관
- 정기적으로 변경 권장

### ⚠️ 브라우저 보안
- HTTPS 환경에서만 사용
- 공용 컴퓨터에서 사용 금지
- 사용 후 로그아웃/캐시 삭제

### ⚠️ 백업
- 중요한 인증 정보는 별도 백업
- 정기적인 데이터 내보내기

## 🔧 환경 설정

### Netlify 환경 변수:
```bash
Airtable_API_Key=your_api_key
Airtable_Base_ID=your_base_id
```

### 로컬 테스트:
```bash
# Netlify Dev 실행
netlify dev

# 브라우저에서 접속
http://localhost:8888/credentials-manager.html
```

## 📝 사용 예시

### 1. Google 계정 저장:
```
1. credentials-manager.html 접속
2. Service: Google 선택
3. Type: Username/Password 선택
4. Username: help@owelers.co.kr 입력
5. Password: 비밀번호 입력
6. Master Key: 강력한 마스터 키 설정
7. Save 클릭
```

### 2. 저장된 정보 확인:
```
1. Existing Credentials 섹션 확인
2. "View" 버튼 클릭
3. 마스터 키 입력
4. 복호화된 정보 확인
```

### 3. API 키 저장:
```
1. Service: Airtable 선택
2. Type: API_KEY 선택
3. API Key 입력
4. Master Key 설정
5. Save 클릭
```

## 🎯 활용 방법

### Google Sheets 동기화에 사용:
1. SystemCredentials에 Google 계정 저장
2. 동기화 스크립트에서 credentials 조회
3. 마스터 키로 복호화
4. Google Sheets API 인증에 사용

### 보안 API 접근:
1. 각 서비스별 API 키 저장
2. 필요시 복호화하여 사용
3. 사용 후 메모리에서 제거

## 🆘 문제 해결

### "Decryption Failed" 오류:
- 마스터 키가 올바른지 확인
- 암호화할 때와 같은 키 사용

### Airtable 저장 실패:
- 환경 변수 설정 확인
- Airtable API 키/Base ID 확인
- 로컬 스토리지에 백업됨

### 암호화 미리보기 안 보임:
- 마스터 키 입력 확인
- 민감한 데이터 필드 입력 확인

## ✅ 완료!

이제 Google 계정 정보를 안전하게 저장하고 관리할 수 있습니다.
마스터 키만 안전하게 보관하면 언제든지 복호화 가능합니다!

---

**보안 팁**: 마스터 키는 최소 12자 이상, 대소문자/숫자/특수문자 조합 사용을 권장합니다.