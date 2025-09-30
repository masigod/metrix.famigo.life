/**
 * Chrome DevTools Test for Credentials Manager
 * Tests the credentials-manager.html form functionality
 */

import { ChromeDevToolsServer } from '@lazycoder/mcp-chrome-devtools/src/chrome-devtools-server';

async function testCredentialsManager() {
  console.log('='.repeat(60));
  console.log('Chrome DevTools Test: Credentials Manager');
  console.log('='.repeat(60));

  const server = new ChromeDevToolsServer('http://localhost:9222');

  try {
    // Connect to Chrome
    console.log('\n1. Connecting to Chrome...');
    await server['ensureConnected']();
    console.log('   ✓ Connected');

    // Navigate to credentials manager
    const testUrl = 'http://localhost:8888/credentials-manager.html';
    console.log(`\n2. Navigating to ${testUrl}...`);
    await server['handleNavigate']({ url: testUrl });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page load
    console.log('   ✓ Page loaded');

    // Start network monitoring
    console.log('\n3. Starting network monitoring...');
    await server['handleNetworkMonitor']({ action: 'start' });
    console.log('   ✓ Network monitoring active');

    // Inspect form elements
    console.log('\n4. Inspecting form elements...');
    const formSelectors = [
      '#airtableApiKey',
      '#airtableBaseId',
      '#googleSheetsId',
      '#credentialForm button[type="submit"]'
    ];

    for (const selector of formSelectors) {
      try {
        const result = await server['handleInspectDOM']({ selector });
        console.log(`   ✓ Found: ${selector}`);
      } catch (error) {
        console.log(`   ✗ Missing: ${selector}`);
      }
    }

    // Test form filling
    console.log('\n5. Filling out form...');
    await server['handleType']({
      selector: '#airtableApiKey',
      text: 'test_airtable_key_123'
    });
    console.log('   ✓ Filled Airtable API Key');

    await server['handleType']({
      selector: '#airtableBaseId',
      text: 'appTestBase123'
    });
    console.log('   ✓ Filled Airtable Base ID');

    await server['handleType']({
      selector: '#googleSheetsId',
      text: '1ABC123_test_sheet_id'
    });
    console.log('   ✓ Filled Google Sheets ID');

    // Verify values
    console.log('\n6. Verifying form values...');
    const apiKeyValue = await server['jsExecutor']!.getValue('#airtableApiKey');
    const baseIdValue = await server['jsExecutor']!.getValue('#airtableBaseId');
    const sheetsIdValue = await server['jsExecutor']!.getValue('#googleSheetsId');

    console.log(`   - Airtable API Key: ${apiKeyValue}`);
    console.log(`   - Airtable Base ID: ${baseIdValue}`);
    console.log(`   - Google Sheets ID: ${sheetsIdValue}`);

    // Test form submission
    console.log('\n7. Submitting form...');
    await server['handleClick']({ selector: 'button[type="submit"]' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for API call

    // Check network requests
    console.log('\n8. Analyzing network requests...');
    const networkSummary = await server['handleNetworkMonitor']({ action: 'summary' });
    console.log('   Network Summary:', JSON.stringify(networkSummary, null, 2));

    const failedRequests = await server['handleNetworkMonitor']({ action: 'failed' });
    console.log('   Failed Requests:', JSON.stringify(failedRequests, null, 2));

    // Performance audit
    console.log('\n9. Running performance audit...');
    const perfAudit = await server['handlePerformanceAudit']({ detailed: true });
    console.log('   Performance Score:', JSON.stringify(perfAudit, null, 2));

    // Take screenshot
    console.log('\n10. Taking screenshot...');
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
  testCredentialsManager().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testCredentialsManager };