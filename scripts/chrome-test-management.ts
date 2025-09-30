/**
 * Chrome DevTools Test for Management Dashboard
 * Tests the management.html data loading and interaction
 */

import { ChromeDevToolsServer } from '@lazycoder/mcp-chrome-devtools/src/chrome-devtools-server';

async function testManagementDashboard() {
  console.log('='.repeat(60));
  console.log('Chrome DevTools Test: Management Dashboard');
  console.log('='.repeat(60));

  const server = new ChromeDevToolsServer('http://localhost:9222');

  try {
    // Connect to Chrome
    console.log('\n1. Connecting to Chrome...');
    await server['ensureConnected']();
    console.log('   ✓ Connected');

    // Navigate to management dashboard
    const testUrl = 'http://localhost:8888/management.html';
    console.log(`\n2. Navigating to ${testUrl}...`);
    await server['handleNavigate']({ url: testUrl });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page load
    console.log('   ✓ Page loaded');

    // Start network monitoring
    console.log('\n3. Starting network monitoring...');
    await server['handleNetworkMonitor']({ action: 'start' });
    console.log('   ✓ Network monitoring active');

    // Check page title
    console.log('\n4. Checking page title...');
    const title = await server['jsExecutor']!.getPageTitle();
    console.log(`   Title: ${title}`);

    // Inspect key elements
    console.log('\n5. Inspecting dashboard elements...');
    const dashboardSelectors = [
      '#statusIndicator',
      '#dataTable',
      '.refresh-button',
      '.filter-section'
    ];

    for (const selector of dashboardSelectors) {
      try {
        const result = await server['handleInspectDOM']({ selector });
        console.log(`   ✓ Found: ${selector}`);
      } catch (error) {
        console.log(`   ✗ Missing: ${selector}`);
      }
    }

    // Check for data loading
    console.log('\n6. Checking data loading...');
    const hasData = await server['jsExecutor']!.evaluate(`
      document.querySelector('#dataTable tbody tr') !== null
    `);
    console.log(`   Data loaded: ${hasData.result}`);

    // Count table rows
    const rowCount = await server['jsExecutor']!.evaluate(`
      document.querySelectorAll('#dataTable tbody tr').length
    `);
    console.log(`   Table rows: ${rowCount.result}`);

    // Analyze API calls
    console.log('\n7. Analyzing API calls...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const apiCalls = await server['jsExecutor']!.evaluate(`
      performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('/.netlify/functions/'))
        .map(entry => ({
          url: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize
        }))
    `);
    console.log('   API Calls:', JSON.stringify(apiCalls.result, null, 2));

    // Check network requests
    console.log('\n8. Analyzing network requests...');
    const networkSummary = await server['handleNetworkMonitor']({ action: 'summary' });
    console.log('   Network Summary:', JSON.stringify(networkSummary, null, 2));

    // Check for failed requests
    const failedRequests = await server['handleNetworkMonitor']({ action: 'failed' });
    if (failedRequests.content[0].text !== '[]') {
      console.log('   ⚠️  Failed Requests:', failedRequests.content[0].text);
    } else {
      console.log('   ✓ No failed requests');
    }

    // Test filter functionality
    console.log('\n9. Testing filter functionality...');
    const filterInput = '#filterInput';
    try {
      await server['handleType']({ selector: filterInput, text: 'test' });
      console.log('   ✓ Filter input working');
    } catch (error) {
      console.log('   ℹ️  No filter input found');
    }

    // Test refresh button
    console.log('\n10. Testing refresh button...');
    try {
      await server['handleClick']({ selector: '.refresh-button' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('   ✓ Refresh button clicked');
    } catch (error) {
      console.log('   ℹ️  No refresh button found');
    }

    // Performance audit
    console.log('\n11. Running performance audit...');
    const perfAudit = await server['handlePerformanceAudit']({ detailed: true });
    const score = JSON.parse(perfAudit.content[0].text).score;
    console.log(`   Performance Score: ${score}/100`);

    if (score < 80) {
      console.log('   ⚠️  Performance issues detected');
    } else {
      console.log('   ✓ Performance is good');
    }

    // Check memory usage
    console.log('\n12. Checking memory usage...');
    const memory = await server['performanceAuditor']!.measureMemoryUsage();
    const memoryUsageMB = (memory.usedHeapSize / 1024 / 1024).toFixed(2);
    console.log(`   Memory usage: ${memoryUsageMB} MB`);

    // Take screenshot
    console.log('\n13. Taking screenshot...');
    await server['handleScreenshot']({});
    console.log('    ✓ Screenshot captured');

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await server.stop();
  }
}

// Run test if executed directly
if (require.main === module) {
  testManagementDashboard().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testManagementDashboard };