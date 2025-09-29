# 🚀 LazyCode  Integration for Google Sheets → Airtable Sync

## LazyCode  활용 완료!

LazyCode  MCP 서버를 활용하여 Google Sheets와 Airtable 동기화 시스템을 구성했습니다.

## 📦 생성된 컴포넌트

### 1. MCP Server Tool
**위치**: `/Users/lua/.lazycoder/packages/mcp-server/src/tools/google-sheets-sync.ts`

- Google Sheets 데이터 가져오기
- Airtable로 자동 동기화
- 인증 정보 안전한 관리
- 캐시 시스템 구현

### 2. LazyCode  Sync Integration
**위치**: `/Users/lua/Metrix/scripts/lazycoder_sync.py`

- LazyCode  MCP 서버와 통신
- 전체 동기화 파이프라인 관리
- 명령줄 인터페이스 제공

## 🔧 설치 및 설정

### 1단계: LazyCode  MCP 서버 준비

```bash
# LazyCode  디렉토리로 이동
cd ~/.lazycoder/packages/mcp-server

# 의존성 설치 (필요시)
npm install

# TypeScript 컴파일
npm run build
```

### 2단계: MCP 서버 시작

```bash
# MCP 서버 시작
cd ~/.lazycoder/packages/mcp-server
npm run dev

# 또는 백그라운드에서 실행
npm run dev &
```

### 3단계: 환경 변수 설정

```bash
# .env 파일에 추가
export AIRTABLE_API_KEY="your_api_key_here"
export AIRTABLE_BASE_ID="your_base_id_here"
```

## 🚀 사용 방법

### 기본 동기화 실행

```bash
cd /Users/lua/Metrix/scripts

# 전체 동기화 실행
python3 lazycoder_sync.py sync
```

### 개별 명령어

```bash
# 설정 구성
python3 lazycoder_sync.py configure

# Google Sheets 데이터만 가져오기
python3 lazycoder_sync.py fetch

# 상태 확인
python3 lazycoder_sync.py status

# MCP 서버 시작
python3 lazycoder_sync.py start-server
```

## 🔄 자동화 설정

### Cron을 사용한 자동 동기화

```bash
# crontab 편집
crontab -e

# 30분마다 실행
*/30 * * * * cd /Users/lua/Metrix/scripts && python3 lazycoder_sync.py sync >> /Users/lua/.lazycoder/logs/sync.log 2>&1
```

### LazyCode  Agent 사용

LazyCode  Agent를 생성하여 더 지능적인 동기화 관리:

```typescript
// ~/.lazycoder/packages/agents/src/sync-agent.ts
import { Agent } from '@lazycoder/core';

export class SyncAgent extends Agent {
  async run() {
    // 1. Google Sheets 상태 확인
    // 2. 변경사항 감지
    // 3. Airtable 동기화
    // 4. 결과 보고
  }
}
```

## 📊 MCP Server API

### Endpoints

- `POST http://localhost:3000/tools/google-sheets-sync`

### Actions

1. **configure**: 설정 구성
   ```json
   {
     "action": "configure",
     "spreadsheetId": "...",
     "airtableConfig": {
       "apiKey": "...",
       "baseId": "...",
       "tableName": "..."
     }
   }
   ```

2. **fetch**: Google Sheets 데이터 가져오기
   ```json
   {
     "action": "fetch",
     "sheetGid": "448929090"
   }
   ```

3. **sync**: Airtable로 동기화
   ```json
   {
     "action": "sync"
   }
   ```

4. **status**: 상태 확인
   ```json
   {
     "action": "status"
   }
   ```

## 🎯 LazyCode  통합의 장점

1. **모듈화**: MCP 서버 도구로 재사용 가능
2. **확장성**: 다른 LazyCode  컴포넌트와 통합 가능
3. **모니터링**: LazyCode  모니터링 대시보드에서 확인 가능
4. **자동화**: LazyCode  Agent로 지능적인 자동화 구현
5. **보안**: 인증 정보 암호화 저장

## 📈 모니터링

### LazyCode  Dashboard에서 확인

```bash
# 모니터링 대시보드 실행
cd ~/.lazycoder/packages/monitoring-dashboard
npm run dev
```

브라우저에서 http://localhost:3001 접속

## 🔍 문제 해결

### MCP 서버 연결 실패
```bash
# 서버 상태 확인
ps aux | grep mcp-server

# 서버 재시작
pkill -f mcp-server
cd ~/.lazycoder/packages/mcp-server && npm run dev
```

### TypeScript 컴파일 오류
```bash
cd ~/.lazycoder/packages/mcp-server
npm run build
```

### 권한 오류
```bash
chmod +x /Users/lua/Metrix/scripts/lazycoder_sync.py
```

## 📝 다음 단계

1. **Google OAuth2 설정**: Service Account 또는 OAuth2 인증 구현
2. **실시간 동기화**: WebSocket으로 실시간 업데이트
3. **충돌 해결**: 중복 데이터 자동 병합 로직
4. **백업 시스템**: 동기화 전 자동 백업

## 🌟 LazyCode  생태계 활용

- **mcp-server**: API 서버 및 도구 호스팅
- **agents**: 자동화된 작업 수행
- **monitoring**: 실시간 모니터링
- **cli**: 명령줄 도구
- **shared**: 공통 유틸리티

## 💡 팁

- LazyCode  MCP 서버는 여러 도구를 동시에 실행 가능
- Agent를 사용하면 더 복잡한 로직 구현 가능
- 모니터링 대시보드에서 실시간 상태 확인

---

**LazyCode **를 활용하여 더 강력하고 확장 가능한 동기화 시스템을 구축했습니다! 🎉