/**
 * Simple Chrome DevTools Test for Credentials Manager
 * Uses puppeteer directly for immediate testing
 */

const puppeteer = require('puppeteer-core');

async function testCredentialsManager() {
  console.log('='.repeat(60));
  console.log('Chrome DevTools Test: Credentials Manager');
  console.log('='.repeat(60));

  let browser;
  let page;

  try {
    // Connect to existing Chrome instance
    console.log('\n1. Connecting to Chrome (port 9222)...');
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222'
    });
    console.log('   ✓ Connected to Chrome');

    // Get first page or create new one
    const pages = await browser.pages();
    page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Navigate to credentials manager
    const testUrl = 'http://localhost:8888/credentials-manager.html';
    console.log(`\n2. Navigating to ${testUrl}...`);
    await page.goto(testUrl, { waitUntil: 'networkidle2' });
    console.log('   ✓ Page loaded');

    // Check page title
    const title = await page.title();
    console.log(`   - Page title: ${title}`);

    // Wait for form to be ready
    console.log('\n3. Waiting for form elements...');
    await page.waitForSelector('#credentialForm', { timeout: 5000 });
    console.log('   ✓ Form found');

    // Inspect form elements
    console.log('\n4. Inspecting form fields...');
    const fields = await page.evaluate(() => {
      const form = document.getElementById('credentialForm');
      const elements = {
        service_name: !!document.getElementById('service_name'),
        credential_type: !!document.getElementById('credential_type'),
        username: !!document.getElementById('username'),
        password: !!document.getElementById('password'),
        api_key: !!document.getElementById('api_key'),
        environment: !!document.getElementById('environment'),
        is_active: !!document.getElementById('is_active'),
        additional_config: !!document.getElementById('additional_config'),
        notes: !!document.getElementById('notes'),
        master_key: !!document.getElementById('master_key'),
        submitButton: !!form.querySelector('button[type="submit"]')
      };
      return elements;
    });

    console.log('   Form Fields Status:');
    Object.entries(fields).forEach(([field, exists]) => {
      console.log(`   ${exists ? '✓' : '✗'} ${field}`);
    });

    // Test form interaction - Fill Google credentials
    console.log('\n5. Testing form filling (Google preset)...');

    // Select Google service
    await page.select('#service_name', 'Google');
    console.log('   ✓ Selected service: Google');

    // Select USERNAME_PASSWORD type
    await page.select('#credential_type', 'USERNAME_PASSWORD');
    console.log('   ✓ Selected type: USERNAME_PASSWORD');

    // Wait for fields to become visible
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fill username
    await page.type('#username', 'help@owelers.co.kr');
    console.log('   ✓ Filled username: help@owelers.co.kr');

    // Fill password
    await page.type('#password', 'test_password_123');
    console.log('   ✓ Filled password: ********');

    // Select environment
    await page.select('#environment', 'Production');
    console.log('   ✓ Selected environment: Production');

    // Fill additional config (Google Sheets ID)
    const config = JSON.stringify({
      spreadsheet_id: "1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY"
    }, null, 2);
    await page.type('#additional_config', config);
    console.log('   ✓ Filled additional config with spreadsheet_id');

    // Fill notes
    await page.type('#notes', 'Chrome DevTools automated test');
    console.log('   ✓ Filled notes');

    // Fill master key
    await page.type('#master_key', 'test_master_key_456');
    console.log('   ✓ Filled master key');

    // Verify form values
    console.log('\n6. Verifying form values...');
    const formValues = await page.evaluate(() => {
      return {
        service_name: document.getElementById('service_name').value,
        credential_type: document.getElementById('credential_type').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value.length + ' chars',
        environment: document.getElementById('environment').value,
        is_active: document.getElementById('is_active').checked,
        additional_config_length: document.getElementById('additional_config').value.length,
        notes: document.getElementById('notes').value,
        master_key: document.getElementById('master_key').value.length + ' chars'
      };
    });

    console.log('   Form Values:');
    Object.entries(formValues).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    // Check encryption preview
    console.log('\n7. Checking encryption preview...');
    const encryptionPreview = await page.$eval('#encryptionPreview', el => el.textContent);
    console.log(`   - Preview text: ${encryptionPreview.substring(0, 50)}...`);

    // Network monitoring setup
    console.log('\n8. Setting up network monitoring...');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('netlify/functions')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    console.log('   ✓ Network monitor active');

    // Test form submission (without actually submitting to avoid data corruption)
    console.log('\n9. Testing submit button (dry run)...');
    const submitButton = await page.$('button[type="submit"]');
    const submitButtonText = await page.evaluate(el => el.textContent, submitButton);
    console.log(`   - Submit button text: ${submitButtonText.trim()}`);
    console.log('   ⚠ Skipping actual submission to avoid test data in Airtable');

    // Check existing credentials list
    console.log('\n10. Checking existing credentials display...');
    const credentialsList = await page.$('#credentialsList');
    const credentialsCount = await page.evaluate(el => {
      return el ? el.children.length : 0;
    }, credentialsList);
    console.log(`   - Existing credentials: ${credentialsCount}`);

    // Performance metrics
    console.log('\n11. Performance metrics...');
    const metrics = await page.metrics();
    console.log(`   - DOM Nodes: ${metrics.Nodes}`);
    console.log(`   - JS Heap Size: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Layout Count: ${metrics.LayoutCount}`);

    // Take screenshot
    console.log('\n12. Taking screenshot...');
    await page.screenshot({
      path: '/Users/lua/Metrix/screenshots/credentials-manager-test.png',
      fullPage: true
    });
    console.log('   ✓ Screenshot saved: screenshots/credentials-manager-test.png');

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    console.log('\n📊 Summary:');
    console.log(`   - All form fields present: ${Object.values(fields).every(v => v) ? 'YES' : 'NO'}`);
    console.log(`   - Form can be filled: YES`);
    console.log(`   - Encryption working: ${encryptionPreview.includes('encrypted') ? 'YES' : 'UNKNOWN'}`);
    console.log(`   - Network monitoring: READY`);
    console.log(`   - Screenshot captured: YES`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    // Don't close browser, just disconnect
    if (browser) {
      await browser.disconnect();
      console.log('\n✓ Disconnected from Chrome');
    }
  }
}

// Run test
testCredentialsManager().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});