// src/index.js - Chrome DevTools MCP Server
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import puppeteer from 'puppeteer';
import CDP from 'chrome-remote-interface';

class ChromeDevToolsMCP {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cdpClient = null;
    this.server = new Server(
      { name: 'chrome-devtools-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    
    this.setupToolHandlers();
  }

  async initialize() {
    // Chrome 브라우저 시작 (headless mode)
    this.browser = await puppeteer.launch({
      headless: false, // 디버깅을 위해 GUI 모드
      devtools: true,
      args: [
        '--remote-debugging-port=9222',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // CDP 클라이언트 연결
    this.cdpClient = await CDP({ port: 9222 });
    await this.cdpClient.Runtime.enable();
    await this.cdpClient.Network.enable();
    await this.cdpClient.Performance.enable();
    await this.cdpClient.DOM.enable();
  }

  setupToolHandlers() {
    // JavaScript 실행 도구
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'chrome_execute_js':
          return await this.executeJavaScript(args.code, args.url);
          
        case 'chrome_inspect_dom':
          return await this.inspectDOM(args.url, args.selector);
          
        case 'chrome_network_analysis':
          return await this.analyzeNetwork(args.url);
          
        case 'chrome_performance_audit':
          return await this.performanceAudit(args.url);
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // 사용 가능한 도구 목록
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'chrome_execute_js',
            description: 'Execute JavaScript code in Chrome browser',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'JavaScript code to execute' },
                url: { type: 'string', description: 'URL to navigate to (optional)' }
              },
              required: ['code']
            }
          },
          {
            name: 'chrome_inspect_dom',
            description: 'Inspect and analyze DOM elements',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to navigate to' },
                selector: { type: 'string', description: 'CSS selector to inspect' }
              },
              required: ['url']
            }
          },
          {
            name: 'chrome_network_analysis',
            description: 'Analyze network requests and performance',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to analyze' }
              },
              required: ['url']
            }
          },
          {
            name: 'chrome_performance_audit',
            description: 'Run performance audit and get Core Web Vitals',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to audit' }
              },
              required: ['url']
            }
          }
        ]
      };
    });
  }

  async executeJavaScript(code, url = null) {
    try {
      if (url) {
        await this.page.goto(url, { waitUntil: 'networkidle0' });
      }

      const result = await this.page.evaluate(code);
      return {
        content: [{
          type: 'text',
          text: `JavaScript 실행 완료:
코드: ${code}
결과: ${JSON.stringify(result, null, 2)}
URL: ${url || 'current page'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `JavaScript 실행 오류:
코드: ${code}
에러: ${error.message}
스택: ${error.stack}`
        }]
      };
    }
  }

  async inspectDOM(url, selector = null) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      
      const domInfo = await this.page.evaluate((sel) => {
        const elements = sel ? document.querySelectorAll(sel) : [document.documentElement];
        
        return Array.from(elements).map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          textContent: el.textContent?.substring(0, 100),
          attributes: Array.from(el.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          })),
          computedStyle: sel ? window.getComputedStyle(el) : null,
          boundingRect: el.getBoundingClientRect()
        }));
      }, selector);

      return {
        content: [{
          type: 'text',
          text: `DOM 검사 결과 (${url}):
선택자: ${selector || 'document'}
발견된 요소: ${domInfo.length}개

${domInfo.map((el, i) => `
=== 요소 ${i + 1} ===
태그: ${el.tagName}
ID: ${el.id || 'none'}
클래스: ${el.className || 'none'}
텍스트: ${el.textContent || 'none'}
위치: ${JSON.stringify(el.boundingRect)}
속성: ${el.attributes.map(a => `${a.name}="${a.value}"`).join(', ')}
`).join('')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `DOM 검사 오류: ${error.message}`
        }]
      };
    }
  }

  async analyzeNetwork(url) {
    try {
      const requests = [];
      
      // 네트워크 요청 모니터링 시작
      this.page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          headers: request.headers()
        });
      });

      const responses = [];
      this.page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          timing: response.timing()
        });
      });

      // 페이지 로드
      const startTime = Date.now();
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;

      return {
        content: [{
          type: 'text',
          text: `네트워크 분석 결과 (${url}):

총 로드 시간: ${loadTime}ms
총 요청 수: ${requests.length}
총 응답 수: ${responses.length}

=== 요청 분석 ===
${requests.slice(0, 10).map((req, i) => `
${i + 1}. ${req.method} ${req.url}
   타입: ${req.resourceType}
`).join('')}

=== 응답 분석 ===
${responses.filter(res => res.status >= 400).map(res => `
⚠️  오류: ${res.status} - ${res.url}
`).join('') || '✅ 모든 응답이 정상입니다'}

=== 성능 권장사항 ===
- 총 요청 수가 ${requests.length}개입니다 ${requests.length > 50 ? '(많음 - 최적화 필요)' : '(적정)'}
- 로드 시간이 ${loadTime}ms입니다 ${loadTime > 3000 ? '(느림 - 최적화 필요)' : '(양호)'}
`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `네트워크 분석 오류: ${error.message}`
        }]
      };
    }
  }

  async performanceAudit(url) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      
      // Core Web Vitals 측정
      const metrics = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          if ('web-vital' in window) {
            resolve(window['web-vital']);
          } else {
            // Web Vitals 라이브러리 주입
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
            script.onload = () => {
              const vitals = {};
              webVitals.onCLS(metric => vitals.cls = metric.value);
              webVitals.onFID(metric => vitals.fid = metric.value);
              webVitals.onLCP(metric => vitals.lcp = metric.value);
              
              setTimeout(() => resolve(vitals), 1000);
            };
            document.head.appendChild(script);
          }
        });
      });

      // Performance Observer 데이터
      const perfData = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: entries.domContentLoadedEventEnd - entries.domContentLoadedEventStart,
          loadComplete: entries.loadEventEnd - entries.loadEventStart,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
          largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime
        };
      });

      return {
        content: [{
          type: 'text',
          text: `성능 감사 결과 (${url}):

=== Core Web Vitals ===
CLS (Cumulative Layout Shift): ${metrics.cls?.toFixed(3) || 'N/A'}
FID (First Input Delay): ${metrics.fid?.toFixed(0) || 'N/A'}ms  
LCP (Largest Contentful Paint): ${metrics.lcp?.toFixed(0) || 'N/A'}ms

=== 기본 성능 지표 ===
DOM 콘텐츠 로드: ${perfData.domContentLoaded?.toFixed(0) || 'N/A'}ms
페이지 로드 완료: ${perfData.loadComplete?.toFixed(0) || 'N/A'}ms
첫 콘텐츠 페인트: ${perfData.firstContentfulPaint?.toFixed(0) || 'N/A'}ms
최대 콘텐츠 페인트: ${perfData.largestContentfulPaint?.toFixed(0) || 'N/A'}ms

=== 성능 등급 ===
${this.getPerformanceGrade(metrics, perfData)}

=== 개선 권장사항 ===
${this.getOptimizationSuggestions(metrics, perfData)}
`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `성능 감사 오류: ${error.message}`
        }]
      };
    }
  }

  getPerformanceGrade(vitals, perf) {
    let score = 100;
    if (vitals.lcp > 2500) score -= 30;
    if (vitals.fid > 100) score -= 25;
    if (vitals.cls > 0.1) score -= 25;
    if (perf.firstContentfulPaint > 1800) score -= 20;

    if (score >= 90) return '🟢 우수 (90+점)';
    if (score >= 70) return '🟡 보통 (70-89점)';
    return '🔴 개선 필요 (70점 미만)';
  }

  getOptimizationSuggestions(vitals, perf) {
    const suggestions = [];
    
    if (vitals.lcp > 2500) {
      suggestions.push('• LCP 최적화: 이미지 압축, CDN 사용, 서버 응답 시간 개선');
    }
    if (vitals.fid > 100) {
      suggestions.push('• FID 최적화: JavaScript 번들 크기 줄이기, 코드 스플리팅');
    }
    if (vitals.cls > 0.1) {
      suggestions.push('• CLS 최적화: 이미지/비디오에 크기 속성 지정, 폰트 최적화');
    }
    if (perf.firstContentfulPaint > 1800) {
      suggestions.push('• FCP 최적화: 크리티컬 CSS 인라인화, 리소스 우선순위 조정');
    }
    
    return suggestions.length ? suggestions.join('\n') : '✅ 현재 성능이 우수합니다!';
  }

  async cleanup() {
    if (this.cdpClient) {
      await this.cdpClient.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// 서버 실행
async function main() {
  const mcp = new ChromeDevToolsMCP();
  await mcp.initialize();

  const transport = new StdioServerTransport();
  await mcp.server.connect(transport);

  // 정리 작업
  process.on('SIGINT', async () => {
    await mcp.cleanup();
    process.exit(0);
  });
}

main().catch(console.error);