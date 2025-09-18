# Netlify 배포 가이드

## 배포 방법

### 1. GitHub 연결 방식 (권장)

1. [Netlify](https://app.netlify.com) 로그인
2. "Add new site" → "Import an existing project" 클릭
3. GitHub 연결 후 `metrix.famigo.life` 저장소 선택
4. 배포 설정:
   - Build command: (비워두기)
   - Publish directory: `.`
5. "Deploy site" 클릭

### 2. 직접 업로드 방식

1. 프로젝트 폴더를 ZIP으로 압축
2. Netlify 대시보드에서 "Sites" 탭
3. ZIP 파일을 드래그 앤 드롭

## 환경 설정

### Airtable API 키 보안 설정

**주의:** API 키를 코드에 직접 넣지 마세요!

#### 방법 1: 사용자가 직접 입력 (현재 구현)
- 웹사이트 접속 후 설정 패널에서 API 키 입력
- 브라우저 LocalStorage에 저장됨
- 가장 안전한 방법

#### 방법 2: 환경 변수 사용 (서버리스 함수 필요)
1. Netlify 대시보드 → Site settings → Environment variables
2. 다음 변수 추가:
   - `AIRTABLE_API_KEY`: 실제 API 키
   - `AIRTABLE_BASE_ID`: app65OYiByuNDaUZg
   - `AIRTABLE_TABLE_ID`: tblyCqebagr8XkLeT

**참고:** 환경 변수는 빌드 시에만 사용 가능하며, 클라이언트 사이드 JavaScript에서는 직접 접근 불가

## 커스텀 도메인 설정

1. Netlify 대시보드 → Domain settings
2. "Add custom domain" 클릭
3. `metrix.famigo.life` 입력
4. DNS 설정:
   - CNAME 레코드: `metrix.famigo.life` → `[your-site].netlify.app`
   - 또는 Netlify DNS 사용

## 필수 파일 체크리스트

✅ 포함된 파일:
- `index.html` - 메인 진입점
- `reservation-tracker-airtable.html` - 메인 애플리케이션
- `airtable-config.js` - Airtable 설정
- `airtable-service.js` - Airtable 서비스
- `netlify.toml` - Netlify 설정
- `.gitignore` - Git 제외 파일

❌ 제외된 파일 (보안):
- `airtable-config-local.js` - 로컬 API 키
- 테스트 HTML 파일들
- API 키가 포함된 파일

## 배포 후 확인사항

1. **API 연결 테스트**
   - 사이트 접속
   - Airtable 설정 패널에서 API 키 입력
   - "Airtable 연결" 버튼 클릭
   - 데이터 로드 확인

2. **CORS 에러 확인**
   - 브라우저 콘솔에서 에러 확인
   - 필요시 Airtable CORS 설정 확인

3. **성능 최적화**
   - Netlify CDN 자동 적용됨
   - 추가 최적화 필요시 netlify.toml 수정

## 문제 해결

### CORS 에러 발생 시
- Airtable API는 브라우저에서 직접 호출 가능
- 별도 CORS 설정 불필요

### API 키 노출 방지
- 절대 GitHub에 API 키 커밋하지 않기
- 사용자가 직접 입력하는 방식 유지
- 또는 Netlify Functions 사용 (서버리스)

### 404 에러
- netlify.toml의 redirect 규칙 확인
- index.html 파일 존재 확인

## 업데이트 방법

GitHub 연결된 경우:
```bash
git add .
git commit -m "Update message"
git push
```
→ Netlify 자동 배포

직접 업로드의 경우:
1. 수정된 파일 ZIP 압축
2. Netlify 대시보드에서 재업로드

## 보안 권장사항

1. **API 키 관리**
   - 절대 코드에 하드코딩하지 않기
   - 정기적으로 키 재생성
   - 최소 권한 원칙 적용

2. **Airtable 권한**
   - 필요한 Base만 접근 허용
   - Read/Write 권한 구분
   - IP 제한 고려 (가능한 경우)

3. **HTTPS 강제**
   - Netlify는 자동으로 HTTPS 제공
   - HTTP → HTTPS 리디렉션 자동 설정

## 지원 및 문의

- Netlify 문서: https://docs.netlify.com
- Airtable API 문서: https://airtable.com/developers/web/api
- 프로젝트 저장소: https://github.com/masigod/metrix.famigo.life