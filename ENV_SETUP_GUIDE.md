# 🔧 로컬 환경 설정 가이드

## 📋 필수 설정

### 1. Netlify에서 환경변수 값 확인

1. https://app.netlify.com 로그인
2. 사이트 선택
3. **Site settings** → **Environment variables**
4. 다음 값들을 확인:
   - `Airtable_API_Key`
   - `Airtable_Base_ID`

### 2. .env 파일 수정

`.env` 파일을 열고 실제 값으로 변경:

```bash
# .env 파일 열기
nano .env
# 또는
code .env
```

변경할 부분:
```env
# 이 값들을 Netlify에 설정한 실제 값으로 변경
Airtable_API_Key=pat.xxxxxxxxxxxxx  # 실제 API Key로 변경
Airtable_Base_ID=appXXXXXXXXXXXX    # 실제 Base ID로 변경
```

### 3. 로컬 테스트 실행

```bash
# Netlify Dev 실행 (환경변수 자동 로드)
netlify dev
```

브라우저에서 접속:
- http://localhost:8888/test-airtable-direct.html
- http://localhost:8888/test-credentials-api.html
- http://localhost:8888/credentials-manager.html

## 🔍 문제 해결

### 환경변수가 로드되지 않는 경우

1. **netlify dev 사용**:
```bash
netlify dev  # .env 파일 자동 로드
```

2. **직접 환경변수 설정**:
```bash
export Airtable_API_Key=pat.xxxxx
export Airtable_Base_ID=appXXXXX
netlify dev
```

3. **Netlify CLI로 환경변수 확인**:
```bash
netlify env:list
```

### Airtable 연결 오류

1. **API Key 확인**:
   - `pat.`로 시작하는지 확인
   - Netlify와 동일한 키인지 확인

2. **Base ID 확인**:
   - `app`로 시작하는지 확인
   - 올바른 Base인지 확인

3. **테이블 이름 확인**:
   - `SystemCredentials` (대소문자 정확히)
   - Airtable에서 테이블 존재 여부 확인

## 📝 테스트 순서

### 1단계: Direct API Test
```
1. http://localhost:8888/test-airtable-direct.html 접속
2. API Key와 Base ID 입력 (Netlify 값과 동일)
3. "Test Direct Connection" 클릭
4. 성공하면 "Create Record Directly" 테스트
```

### 2단계: Netlify Function Test
```
1. http://localhost:8888/test-credentials-api.html 접속
2. "Test API Connection" 클릭
3. 성공하면 "Create Credential" 테스트
```

### 3단계: Credentials Manager 사용
```
1. http://localhost:8888/credentials-manager.html 접속
2. Google 계정 정보 입력
3. Master Key 설정
4. Save 클릭
```

## ⚠️ 중요 사항

- `.env` 파일은 **절대 Git에 커밋하지 마세요**
- API Key는 안전하게 보관하세요
- 프로덕션과 개발 환경 분리 관리

## 🚀 배포된 사이트에서 테스트

배포된 사이트는 Netlify 환경변수를 자동으로 사용합니다:

```
https://your-site.netlify.app/test-airtable-direct.html
https://your-site.netlify.app/test-credentials-api.html
https://your-site.netlify.app/credentials-manager.html
```

배포된 사이트에서는 별도 설정 없이 바로 테스트 가능합니다.