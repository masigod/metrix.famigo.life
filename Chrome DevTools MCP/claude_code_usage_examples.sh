# Claude Code + Chrome DevTools MCP 활용 가이드
# Dylan님의 철학적 깊이와 실용적 효율성을 모두 만족하는 통합 워크플로우

# ========================================
# 1. 기본 설정 및 초기화
# ========================================

# Chrome DevTools MCP 서버 시작
claude-code mcp start chrome-devtools

# LazyCoder와 Chrome DevTools 동시 활성화
claude-code mcp start --all

# 프로젝트 초기 상태 확인
claude-code exec "
프로젝트의 철학적 배경을 먼저 이해하고 싶습니다.
1. 현재 프로젝트 상태를 LazyCoder로 분석해주세요
2. 브라우저 환경에서의 사용자 경험을 평가해주세요
3. 기술-비즈니스-창작의 융합 관점에서 개선점을 제시해주세요
"

# ========================================
# 2. 컴포넌트 개발 + 실시간 테스트 워크플로우
# ========================================

# React 컴포넌트 개발과 브라우저 테스트를 한 번에
claude-code exec "
새로운 사용자 프로필 컴포넌트를 만들어야 합니다.

철학적 접근:
- 왜: 사용자의 정체성을 시각적으로 표현하는 중요한 인터페이스
- 무엇: 개인화된, 접근성이 뛰어난, 성능 최적화된 컴포넌트
- 어떻게: 

1. LazyCoder agent_execute claude-code로 컴포넌트 생성
2. Chrome DevTools chrome_execute_js로 실시간 DOM 렌더링 테스트  
3. Chrome DevTools chrome_performance_audit로 성능 측정
4. LazyCoder agent_execute performance-optimizer로 최적화
"

# 단계별 실행
claude-code tool lazycoder agent_execute \
  --agentName="claude-code" \
  --command="generate React profile component with accessibility" \
  --params='{"styling": "tailwind", "a11y": true}'

# 생성된 컴포넌트를 브라우저에서 즉시 테스트
claude-code tool chrome-devtools chrome_execute_js \
  --code="
  // 생성된 컴포넌트를 테스트 환경에 마운트
  const ProfileComponent = /* 생성된 컴포넌트 코드 */;
  const root = document.getElementById('test-root');
  ReactDOM.render(React.createElement(ProfileComponent, {
    name: 'Dylan Kim',
    role: 'Full-stack Developer & Philosopher',
    avatar: 'https://example.com/avatar.jpg'
  }), root);
  
  // 렌더링 결과 확인
  return {
    rendered: root.innerHTML,
    accessibility: root.querySelectorAll('[aria-label]').length,
    performance: performance.now()
  };
  " \
  --url="http://localhost:3000/test"

# 성능 감사 실행
claude-code tool chrome-devtools chrome_performance_audit \
  --url="http://localhost:3000/test"

# ========================================
# 3. 디버깅 워크플로우
# ========================================

# 복잡한 버그 상황 분석
claude-code exec "
프로덕션에서 이상한 버그가 발생했습니다. 
사용자가 프로필 페이지에서 데이터가 간헐적으로 로드되지 않는다고 합니다.

융합적 디버깅 접근:
1. 기술적 분석: 코드와 네트워크 레벨에서 원인 파악
2. 비즈니스 영향: 사용자 경험과 비즈니스 메트릭에 미치는 영향
3. 창작적 해결: 혁신적이고 근본적인 해결책

디버깅 프로세스:
1. DOM 구조 검사로 렌더링 상태 확인
2. 네트워크 분석으로 API 호출 패턴 파악  
3. LazyCoder bug-hunter로 코드 레벨 분석
4. 통합적 해결책 제시
"

# DOM 검사 실행
claude-code tool chrome-devtools chrome_inspect_dom \
  --url="https://myapp.com/profile/user123" \
  --selector=".profile-container"

# 네트워크 분석 실행  
claude-code tool chrome-devtools chrome_network_analysis \
  --url="https://myapp.com/profile/user123"

# LazyCoder 버그 헌터 실행
claude-code tool lazycoder agent_execute \
  --agentName="bug-hunter" \
  --command="analyze profile loading issue" \
  --params='{"context": "intermittent data loading failure"}'

# ========================================
# 4. 성능 최적화 워크플로우  
# ========================================

# 웹사이트 종합 성능 분석 및 최적화
claude-code exec "
우리 제품의 성능을 글로벌 수준으로 끌어올려야 합니다.

철학적 관점:
'성능은 단순한 기술 지표가 아니라, 사용자에 대한 존중의 표현이다'

성능 최적화 프로세스:
1. 현재 성능 상태를 정확히 측정
2. 병목 지점을 과학적으로 분석  
3. 글로벌 베스트 프랙티스 적용
4. 지속 가능한 최적화 전략 수립
"

# Core Web Vitals 측정
claude-code tool chrome-devtools chrome_performance_audit \
  --url="https://myapp.com"

# 성능 데이터를 LazyCoder로 분석
claude-code tool lazycoder agent_execute \
  --agentName="performance-optimizer" \
  --command="analyze web vitals and suggest optimizations"

# 네트워크 최적화 분석
claude-code tool chrome-devtools chrome_network_analysis \
  --url="https://myapp.com"

# 최적화 구현
claude-code tool lazycoder agent_execute \
  --agentName="claude-code" \
  --command="implement performance optimizations" \
  --params='{"focus": ["bundle-size", "lazy-loading", "caching"]}'

# ========================================
# 5. A/B 테스트 자동화 워크플로우
# ========================================

# A/B 테스트를 통한 창작적 실험
claude-code exec "
새로운 랜딩 페이지 디자인에 대한 A/B 테스트를 설계하고 싶습니다.

실험 정신 구현:
1. 가설: 새로운 헤더 디자인이 더 높은 전환율을 가져올 것
2. 구현: 두 가지 버전을 자동 생성
3. 측정: 실제 사용자 행동 데이터 수집
4. 학습: 결과를 바탕으로 최적화된 버전 도출
"

# 버전 A 생성 및 테스트
claude-code tool lazycoder agent_execute \
  --agentName="claude-code" \
  --command="create landing page variant A" \
  --params='{"style": "minimalist", "cta": "primary"}'

claude-code tool chrome-devtools chrome_execute_js \
  --code="
  // 버전 A 성능 측정
  const startTime = performance.now();
  // 페이지 로드 및 인터랙션 시뮬레이션
  document.querySelector('.cta-button').click();
  const clickTime = performance.now();
  
  return {
    version: 'A',
    loadTime: startTime,
    ctaResponseTime: clickTime - startTime,
    userFlow: 'completed'
  };
  " \
  --url="http://localhost:3000/landing-a"

# 버전 B 생성 및 테스트
claude-code tool lazycoder agent_execute \
  --agentName="claude-code" \
  --command="create landing page variant B" \
  --params='{"style": "bold", "cta": "secondary"}'

claude-code tool chrome-devtools chrome_execute_js \
  --code="/* 버전 B 테스트 코드 */;" \
  --url="http://localhost:3000/landing-b"

# 결과 비교 분석
claude-code tool lazycoder agent_execute \
  --agentName="data-analyst" \
  --command="compare A/B test results and recommend winner"

# ========================================
# 6. 고급 자동화: 지속적 모니터링
# ========================================

# 프로덕션 모니터링 자동화
claude-code exec "
프로덕션 환경을 24/7 모니터링하여 
성능 저하나 사용자 경험 문제를 사전에 감지하고 싶습니다.

지속 가능한 품질 관리 철학:
'완벽한 제품은 완성되는 것이 아니라, 지속적으로 진화하는 것'
"

# 모니터링 스크립트 생성
claude-code tool lazycoder agent_execute \
  --agentName="monitoring-setup" \
  --command="create continuous performance monitoring"

# 정기적 성능 체크 (cron job 스타일)
claude-code schedule --every="1h" --command="
  claude-code tool chrome-devtools chrome_performance_audit --url='https://myapp.com'
  if [[ $(echo $output | grep 'score' | cut -d: -f2) < 85 ]]; then
    claude-code tool lazycoder agent_execute --agentName='alert-manager' --command='send performance alert'
  fi
"

# ========================================
# 7. Dylan님을 위한 특별 명령어
# ========================================

# 철학적 코드 리뷰
alias claude-philosophical-review="claude-code exec '
이 코드를 철학적 관점에서 분석해주세요:
1. 코드의 존재 이유(Why)는 명확한가?
2. 구조적 아름다움(What)을 갖추었는가?  
3. 실행의 우아함(How)이 있는가?
4. 글로벌 수준의 품질인가?
5. 사용자에게 진정한 가치를 전달하는가?
'"

# 융합적 솔루션 생성
alias claude-fusion-solution="claude-code exec '
기술-비즈니스-창작의 융합 관점에서 이 문제를 해결해주세요:
- 기술적 우수성을 확보하면서도
- 비즈니스 가치를 창출하고  
- 창작적 혁신을 달성하는 솔루션을 제시해주세요
'"

# 글로벌 품질 검증
alias claude-global-quality="claude-code exec '
이 프로젝트를 글로벌 수준으로 끌어올리기 위한 체크리스트:
1. 국제 표준 준수 여부 확인
2. 다국어/다문화 대응 상태  
3. 전 세계 사용자 접근성
4. 클라우드 인프라 최적화
5. 글로벌 베스트 프랙티스 적용도
'"

# ========================================
# 8. 통합 워크플로우 예시
# ========================================

# 완전한 기능 개발부터 배포까지의 파이프라인
claude-code workflow create "full-feature-pipeline" --steps="
1. 철학적 요구사항 분석
   - claude-code exec '이 기능이 사용자에게 어떤 가치를 전달하는지 깊이 분석해주세요'

2. 아키텍처 설계  
   - lazycoder agent_execute --agentName='superclaude' --command='design architecture'

3. 코드 구현
   - lazycoder agent_execute --agentName='claude-code' --command='implement feature'

4. 브라우저 테스트
   - chrome-devtools chrome_execute_js --code='/* 통합 테스트 */'
   
5. 성능 검증
   - chrome-devtools chrome_performance_audit
   
6. 품질 보증
   - lazycoder agent_execute --agentName='code-reviewer'
   
7. 배포 준비
   - lazycoder agent_execute --agentName='ci-cd-builder'
   
8. 모니터링 설정
   - lazycoder agent_execute --agentName='monitoring-setup'
"