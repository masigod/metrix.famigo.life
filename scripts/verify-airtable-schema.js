#!/usr/bin/env node

/**
 * Airtable SystemCredentials Schema Verification Script
 *
 * 이 스크립트는 Airtable SystemCredentials 테이블의 스키마를 검증합니다.
 *
 * 사용법:
 *   node scripts/verify-airtable-schema.js
 *
 * 환경 변수 필요:
 *   - Airtable_API_Key
 *   - Airtable_Base_ID
 *   - Airtable_SystemCredentials_ID
 */

require('dotenv').config();

const API_KEY = process.env.Airtable_API_Key;
const BASE_ID = process.env.Airtable_Base_ID;
const TABLE_NAME = process.env.Airtable_SystemCredentials_ID || 'SystemCredentials';

// Expected schema
const EXPECTED_SCHEMA = {
  fields: [
    { name: 'credential_id', type: 'autoNumber', required: true },
    { name: 'service_name', type: 'singleSelect', required: true, options: ['Google', 'Airtable', 'Netlify', 'Other'] },
    { name: 'credential_type', type: 'singleSelect', required: true, options: ['USERNAME_PASSWORD', 'API_KEY', 'OAuth2'] },
    { name: 'username', type: 'singleLineText', required: false },
    { name: 'password', type: 'multilineText', required: false },
    { name: 'api_key', type: 'multilineText', required: false },
    { name: 'refresh_token', type: 'multilineText', required: false },
    { name: 'access_token', type: 'multilineText', required: false },
    { name: 'token_expiry', type: 'dateTime', required: false },
    { name: 'additional_config', type: 'multilineText', required: false },
    { name: 'is_active', type: 'checkbox', required: false },
    { name: 'environment', type: 'singleSelect', required: false, options: ['Production', 'Development', 'Test'] },
    { name: 'last_used', type: 'dateTime', required: false },
    { name: 'usage_count', type: 'number', required: false },
    { name: 'created_at', type: 'createdTime', required: true },
    { name: 'updated_at', type: 'lastModifiedTime', required: false },
    { name: 'created_by', type: 'singleLineText', required: false },
    { name: 'notes', type: 'multilineText', required: false },
    { name: 'password_hash', type: 'singleLineText', required: false },
    { name: 'api_key_hash', type: 'singleLineText', required: false }
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function verifyEnvironment() {
  logSection('🔧 환경 변수 확인');

  const checks = [
    { name: 'Airtable_API_Key', value: API_KEY, sensitive: true },
    { name: 'Airtable_Base_ID', value: BASE_ID, sensitive: false },
    { name: 'Airtable_SystemCredentials_ID', value: TABLE_NAME, sensitive: false }
  ];

  let allValid = true;

  for (const check of checks) {
    if (check.value) {
      const displayValue = check.sensitive
        ? check.value.substring(0, 8) + '...'
        : check.value;
      log(`✓ ${check.name}: ${displayValue}`, 'green');
    } else {
      log(`✗ ${check.name}: 누락`, 'red');
      allValid = false;
    }
  }

  if (!allValid) {
    log('\n환경 변수를 설정해주세요:', 'yellow');
    log('  export Airtable_API_Key=pat.xxxxx', 'yellow');
    log('  export Airtable_Base_ID=appXXXXX', 'yellow');
    log('  export Airtable_SystemCredentials_ID=SystemCredentials', 'yellow');
    process.exit(1);
  }

  return true;
}

async function fetchTableSchema() {
  logSection('📡 Airtable 테이블 스키마 가져오기');

  const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;

  log(`요청 URL: ${url}`, 'blue');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      log(`✗ API 요청 실패 (${response.status}): ${error.error?.message || 'Unknown error'}`, 'red');
      return null;
    }

    const data = await response.json();
    const table = data.tables.find(t => t.name === TABLE_NAME);

    if (!table) {
      log(`✗ 테이블 "${TABLE_NAME}"을 찾을 수 없습니다`, 'red');
      log(`\n사용 가능한 테이블:`, 'yellow');
      data.tables.forEach(t => log(`  - ${t.name}`, 'yellow'));
      return null;
    }

    log(`✓ 테이블 발견: ${table.name} (ID: ${table.id})`, 'green');
    return table;

  } catch (error) {
    log(`✗ 네트워크 오류: ${error.message}`, 'red');
    return null;
  }
}

function verifyField(field, expectedField) {
  const issues = [];

  // Check type
  if (field.type !== expectedField.type) {
    issues.push(`타입 불일치: ${field.type} (예상: ${expectedField.type})`);
  }

  // Check single select options
  if (expectedField.type === 'singleSelect' && expectedField.options) {
    const actualOptions = field.options?.choices?.map(c => c.name) || [];
    const missingOptions = expectedField.options.filter(o => !actualOptions.includes(o));
    const extraOptions = actualOptions.filter(o => !expectedField.options.includes(o));

    if (missingOptions.length > 0) {
      issues.push(`누락된 옵션: ${missingOptions.join(', ')}`);
    }
    if (extraOptions.length > 0) {
      issues.push(`추가된 옵션: ${extraOptions.join(', ')}`);
    }
  }

  return issues;
}

function verifySchema(actualSchema) {
  logSection('✅ 스키마 검증');

  const actualFields = actualSchema.fields;
  const actualFieldNames = actualFields.map(f => f.name);

  let hasErrors = false;
  let warningCount = 0;

  // Check required fields
  log('\n1️⃣  필수 필드 확인:', 'bright');
  for (const expectedField of EXPECTED_SCHEMA.fields) {
    const actualField = actualFields.find(f => f.name === expectedField.name);

    if (!actualField) {
      if (expectedField.required) {
        log(`  ✗ ${expectedField.name}: 누락 (필수)`, 'red');
        hasErrors = true;
      } else {
        log(`  ⚠ ${expectedField.name}: 누락 (선택)`, 'yellow');
        warningCount++;
      }
      continue;
    }

    const issues = verifyField(actualField, expectedField);

    if (issues.length > 0) {
      log(`  ✗ ${expectedField.name}:`, 'red');
      issues.forEach(issue => log(`      - ${issue}`, 'red'));
      hasErrors = true;
    } else {
      log(`  ✓ ${expectedField.name} (${actualField.type})`, 'green');
    }
  }

  // Check for unexpected fields
  log('\n2️⃣  추가 필드 확인:', 'bright');
  const expectedFieldNames = EXPECTED_SCHEMA.fields.map(f => f.name);
  const extraFields = actualFieldNames.filter(name => !expectedFieldNames.includes(name));

  if (extraFields.length > 0) {
    log(`  ⚠ 예상하지 못한 필드 발견:`, 'yellow');
    extraFields.forEach(name => {
      const field = actualFields.find(f => f.name === name);
      log(`    - ${name} (${field.type})`, 'yellow');
    });
    warningCount += extraFields.length;
  } else {
    log(`  ✓ 추가 필드 없음`, 'green');
  }

  // Summary
  logSection('📊 검증 결과');

  const totalExpected = EXPECTED_SCHEMA.fields.length;
  const totalActual = actualFields.length;
  const matchingFields = expectedFieldNames.filter(name => actualFieldNames.includes(name)).length;

  log(`총 필드 수: ${totalActual} (예상: ${totalExpected})`, 'blue');
  log(`일치하는 필드: ${matchingFields}`, 'blue');
  log(`경고: ${warningCount}`, warningCount > 0 ? 'yellow' : 'green');
  log(`오류: ${hasErrors ? '있음' : '없음'}`, hasErrors ? 'red' : 'green');

  return !hasErrors;
}

async function testConnection() {
  logSection('🧪 연결 테스트');

  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

  try {
    const response = await fetch(url + '?maxRecords=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      log(`✗ 데이터 가져오기 실패: ${error.error?.message || 'Unknown error'}`, 'red');
      return false;
    }

    const data = await response.json();
    log(`✓ 테이블 접근 성공`, 'green');
    log(`  레코드 수: ${data.records.length} (최대 1개 요청)`, 'blue');

    if (data.records.length > 0) {
      const record = data.records[0];
      log(`  샘플 레코드 ID: ${record.id}`, 'blue');
      log(`  필드 수: ${Object.keys(record.fields).length}`, 'blue');
    }

    return true;

  } catch (error) {
    log(`✗ 연결 테스트 실패: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  console.clear();
  log('\n🔍 Airtable SystemCredentials 스키마 검증 도구\n', 'bright');

  try {
    // Step 1: Verify environment
    await verifyEnvironment();

    // Step 2: Fetch schema
    const tableSchema = await fetchTableSchema();
    if (!tableSchema) {
      process.exit(1);
    }

    // Step 3: Verify schema
    const isValid = verifySchema(tableSchema);

    // Step 4: Test connection
    const canConnect = await testConnection();

    // Final result
    logSection('🎯 최종 결과');

    if (isValid && canConnect) {
      log('✅ 모든 검증 통과! 테이블이 올바르게 구성되었습니다.', 'green');
      log('\n다음 단계:', 'bright');
      log('  1. credentials-manager.html 페이지를 열어 테스트하세요', 'blue');
      log('  2. CREDENTIALS_TESTING_GUIDE.md 문서를 참고하세요', 'blue');
      process.exit(0);
    } else {
      log('❌ 검증 실패. 위의 오류를 수정해주세요.', 'red');
      log('\n도움말:', 'bright');
      log('  - AIRTABLE_CREDENTIAL_SYSTEM_SCHEMA.md 문서를 참고하세요', 'yellow');
      log('  - Airtable에서 테이블 구조를 수정한 후 다시 실행하세요', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    log(`\n💥 치명적 오류: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { verifyEnvironment, fetchTableSchema, verifySchema, testConnection };