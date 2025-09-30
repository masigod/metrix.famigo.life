# Chrome DevTools Integration for Metrix

This document describes how the Chrome DevTools MCP integration enhances the Metrix development workflow.

## Overview

The Chrome DevTools MCP integration provides automated browser testing and debugging capabilities for the Metrix project, enabling:

- Automated testing of credentials-manager.html
- Automated testing of management.html
- Real-time network monitoring of Netlify Functions
- Performance auditing
- Visual regression testing via screenshots

## Setup

### 1. Install Dependencies

The Chrome DevTools MCP package is already set up in the LazyCoder monorepo:

```bash
cd /Users/lua/.lazycoder/packages/mcp-chrome-devtools
pnpm install
pnpm build
```

### 2. Start Netlify Dev

```bash
cd /Users/lua/Metrix
netlify dev
```

This starts the local development server on http://localhost:8888

### 3. Start Chrome with Remote Debugging

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check \
  http://localhost:8888
```

Or use the automated script:

```bash
/Users/lua/.lazycoder/scripts/start-chrome-devtools-mcp.sh
```

## Test Suites

### Credentials Manager Test

**Location**: `/Users/lua/Metrix/scripts/chrome-test-credentials.ts`

**What it tests**:
1. Form elements presence (API key, Base ID, Sheets ID fields)
2. Form filling functionality
3. Form submission
4. Network requests to credential-system-api
5. Response validation
6. Performance metrics

**Run**:
```bash
cd /Users/lua/Metrix
tsx scripts/chrome-test-credentials.ts
```

**Expected output**:
```
==========================================
Chrome DevTools Test: Credentials Manager
==========================================

1. Connecting to Chrome...
   ✓ Connected

2. Navigating to http://localhost:8888/credentials-manager.html...
   ✓ Page loaded

3. Starting network monitoring...
   ✓ Network monitoring active

4. Inspecting form elements...
   ✓ Found: #airtableApiKey
   ✓ Found: #airtableBaseId
   ✓ Found: #googleSheetsId
   ✓ Found: #credentialForm button[type="submit"]

5. Filling out form...
   ✓ Filled Airtable API Key
   ✓ Filled Airtable Base ID
   ✓ Filled Google Sheets ID

6. Verifying form values...
   - Airtable API Key: test_airtable_key_123
   - Airtable Base ID: appTestBase123
   - Google Sheets ID: 1ABC123_test_sheet_id

7. Submitting form...

8. Analyzing network requests...
   Network Summary: {
     "totalRequests": 3,
     "successfulRequests": 3,
     "failedRequests": 0,
     "requestsByType": {
       "text": 2,
       "application": 1
     }
   }

9. Running performance audit...
   Performance Score: 95/100

10. Taking screenshot...
    ✓ Screenshot captured

==========================================
TEST COMPLETED SUCCESSFULLY
==========================================
```

### Management Dashboard Test

**Location**: `/Users/lua/Metrix/scripts/chrome-test-management.ts`

**What it tests**:
1. Page loading and rendering
2. Data table population from Airtable
3. API calls to management-api.js
4. Filter functionality
5. Refresh button
6. Performance metrics
7. Memory usage

**Run**:
```bash
cd /Users/lua/Metrix
tsx scripts/chrome-test-management.ts
```

**Expected output**:
```
==========================================
Chrome DevTools Test: Management Dashboard
==========================================

1. Connecting to Chrome...
   ✓ Connected

2. Navigating to http://localhost:8888/management.html...
   ✓ Page loaded

3. Starting network monitoring...
   ✓ Network monitoring active

4. Checking page title...
   Title: Metrix Management Dashboard

5. Inspecting dashboard elements...
   ✓ Found: #statusIndicator
   ✓ Found: #dataTable
   ✓ Found: .refresh-button
   ✓ Found: .filter-section

6. Checking data loading...
   Data loaded: true
   Table rows: 42

7. Analyzing API calls...
   API Calls: [
     {
       "url": "http://localhost:8888/.netlify/functions/management-api",
       "duration": 234.5,
       "transferSize": 15678
     }
   ]

8. Analyzing network requests...
   Network Summary: {
     "totalRequests": 5,
     "successfulRequests": 5,
     "failedRequests": 0
   }
   ✓ No failed requests

9. Testing filter functionality...
   ✓ Filter input working

10. Testing refresh button...
    ✓ Refresh button clicked

11. Running performance audit...
    Performance Score: 87/100
    ✓ Performance is good

12. Checking memory usage...
    Memory usage: 23.45 MB

13. Taking screenshot...
    ✓ Screenshot captured

==========================================
TEST COMPLETED SUCCESSFULLY
==========================================
```

### Run All Tests

Use the convenience script to run all tests:

```bash
cd /Users/lua/Metrix
./scripts/run-chrome-tests.sh
```

This script:
1. Starts Netlify Dev if not running
2. Launches Chrome with remote debugging if not running
3. Runs both test suites
4. Cleans up processes on exit

## Integration with Development Workflow

### Phase 1: Development
1. Write HTML/CSS/JavaScript
2. Test manually in browser
3. Use Chrome DevTools for debugging

### Phase 2: Automated Testing
1. Run `./scripts/run-chrome-tests.sh`
2. Get automated validation of:
   - Form functionality
   - API integration
   - Data rendering
   - Performance
   - Error handling

### Phase 3: Continuous Validation
1. Run tests after each change
2. Catch regressions early
3. Get performance feedback
4. Validate network requests

## Key Benefits

### 1. Automated Form Testing
No more manual form filling to test credentials-manager.html. The automated test:
- Fills all fields
- Submits the form
- Validates the response
- Checks network requests

### 2. API Call Monitoring
Real-time monitoring of Netlify Functions:
- Track all API calls
- Measure response times
- Detect failed requests
- Validate payloads

### 3. Performance Optimization
Continuous performance monitoring:
- Page load times
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Memory usage
- Network efficiency

### 4. Visual Regression Testing
Automated screenshots:
- Capture page state
- Compare before/after
- Detect layout issues
- Validate rendering

### 5. Error Detection
Automated error detection:
- Console errors
- Network failures
- JavaScript exceptions
- Performance issues

## Debugging Failed Tests

### Network Request Failures

If a test shows failed network requests:

```typescript
const failed = await chrome_network_monitor({ action: 'failed' });
console.log('Failed requests:', failed);
```

Check:
1. Netlify Functions are running
2. API endpoints are correct
3. Credentials are configured
4. CORS is properly set up

### Element Not Found

If the test can't find an element:

```typescript
const element = await chrome_inspect_dom({ selector: '#myElement' });
```

Check:
1. Element ID/class is correct
2. Page has fully loaded
3. Element is not dynamically created
4. Use `chrome_wait_for` if element loads asynchronously

### Performance Issues

If performance score is low:

```typescript
const audit = await chrome_performance_audit({ detailed: true });
console.log('Recommendations:', audit.recommendations);
```

Common fixes:
1. Optimize images
2. Minify JavaScript/CSS
3. Reduce network requests
4. Use caching
5. Lazy load content

## Advanced Usage

### Custom Test Scenarios

Create custom test files in `/Users/lua/Metrix/scripts/`:

```typescript
import { ChromeDevToolsServer } from '@lazycoder/mcp-chrome-devtools/src/chrome-devtools-server';

async function customTest() {
  const server = new ChromeDevToolsServer('http://localhost:9222');

  try {
    await server['ensureConnected']();

    // Your custom test logic here
    await server['handleNavigate']({ url: 'http://localhost:8888/your-page.html' });

    // ... more test steps

  } finally {
    await server.stop();
  }
}

customTest();
```

### Network Request Filtering

Monitor specific API endpoints:

```typescript
// Start monitoring
await chrome_network_monitor({ action: 'start' });

// Trigger action
await chrome_click({ selector: '.load-data' });

// Get specific requests
const allRequests = networkAnalyzer.getRequests();
const apiRequests = allRequests.filter(r => r.url.includes('/.netlify/functions/'));

console.log('API Requests:', apiRequests);
```

### Performance Profiling

Detailed performance analysis:

```typescript
// Start profiling
await performanceAuditor.startProfiling();

// Perform actions
await chrome_click({ selector: '.heavy-operation' });

// Stop profiling
const profile = await performanceAuditor.stopProfiling();
console.log('CPU Profile:', profile);
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Metrix Browser Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm install -g pnpm netlify-cli
          pnpm install

      - name: Start Netlify Dev
        run: netlify dev &
        working-directory: /Users/lua/Metrix

      - name: Install Chrome
        run: |
          wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
          sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
          sudo apt-get update
          sudo apt-get install google-chrome-stable

      - name: Run browser tests
        run: ./scripts/run-chrome-tests.sh
        working-directory: /Users/lua/Metrix
```

## Troubleshooting

### Chrome Connection Issues

```bash
# Check if Chrome is accessible
curl http://localhost:9222/json/version

# If not, restart Chrome
pkill -9 "Google Chrome"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check
```

### Netlify Dev Not Running

```bash
# Check if port 8888 is in use
lsof -i :8888

# Restart Netlify Dev
cd /Users/lua/Metrix
netlify dev
```

### Test Timeouts

Increase timeout values:

```typescript
await chrome_wait_for({
  selector: '.slow-element',
  timeout: 10000  // Increase from 5000 to 10000
});
```

## Future Enhancements

1. **Visual Regression Testing**: Compare screenshots automatically
2. **Accessibility Testing**: Check WCAG compliance
3. **Mobile Testing**: Test responsive layouts
4. **Cross-browser Testing**: Test in Firefox, Safari
5. **Load Testing**: Simulate multiple users
6. **API Mocking**: Mock external API responses

## Resources

- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
- Model Context Protocol: https://modelcontextprotocol.io/
- LazyCoder MCP Server: `/Users/lua/.lazycoder/packages/mcp-chrome-devtools/`
- Test Scripts: `/Users/lua/Metrix/scripts/`

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test output for specific errors
3. Check Chrome DevTools console
4. Review Netlify Functions logs