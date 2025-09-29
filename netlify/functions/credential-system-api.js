// Complete Credential System API - Netlify Function
// Manages all credential-related tables with full audit trail

const crypto = require('crypto');

// Table names from environment variables
const TABLES = {
  CREDENTIALS: process.env.Airtable_SystemCredentials_ID || 'SystemCredentials',
  USAGE_LOG: process.env.Airtable_CredentialUsageLog_ID || 'CredentialUsageLog',
  AUDIT_LOG: process.env.Airtable_CredentialAuditLog_ID || 'CredentialAuditLog',
  REQUEST: process.env.Airtable_CredentialRequest_ID || 'CredentialRequest'
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Get Airtable config
  const API_KEY = process.env.Airtable_API_Key;
  const BASE_ID = process.env.Airtable_Base_ID;

  if (!API_KEY || !BASE_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server configuration error. Missing Airtable credentials.'
      })
    };
  }

  try {
    // Parse request
    const { resource, action, data, params } = event.httpMethod === 'GET'
      ? {
          resource: event.queryStringParameters?.resource || 'credentials',
          action: event.queryStringParameters?.action || 'list',
          params: event.queryStringParameters
        }
      : JSON.parse(event.body || '{}');

    // Get user info from headers or context
    const userInfo = {
      email: event.headers['x-user-email'] || 'anonymous',
      ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown',
      userAgent: event.headers['user-agent'] || 'unknown'
    };

    // Route to appropriate handler
    switch (resource) {
      case 'credentials':
        return await handleCredentials(API_KEY, BASE_ID, action, data, userInfo, headers);

      case 'usage':
        return await handleUsageLog(API_KEY, BASE_ID, action, data, userInfo, headers);

      case 'audit':
        return await handleAuditLog(API_KEY, BASE_ID, action, data, userInfo, headers);

      case 'request':
        return await handleRequest(API_KEY, BASE_ID, action, data, userInfo, headers);

      case 'workflow':
        return await handleWorkflow(API_KEY, BASE_ID, action, data, userInfo, headers);

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid resource type' })
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

// ==================== CREDENTIALS HANDLERS ====================

async function handleCredentials(apiKey, baseId, action, data, userInfo, headers) {
  const url = `https://api.airtable.com/v0/${baseId}/${TABLES.CREDENTIALS}`;

  switch (action) {
    case 'create':
      // Create audit log entry
      await createAuditLog(apiKey, baseId, {
        action_type: 'CREATE',
        changed_by: userInfo.email,
        ip_address: userInfo.ip,
        user_agent: userInfo.userAgent,
        risk_level: 'MEDIUM',
        notes: 'New credential created'
      });

      // Create the credential
      const createResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            ...data,
            created_by: userInfo.email,
            created_at: new Date().toISOString(),
            usage_count: 0
          }
        })
      });

      const created = await createResponse.json();

      return {
        statusCode: createResponse.ok ? 200 : 400,
        headers,
        body: JSON.stringify(created)
      };

    case 'use':
      // Record usage and get credential
      const credentialId = data.credentialId;

      // Get credential
      const getResponse = await fetch(`${url}/${credentialId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!getResponse.ok) {
        // Log failed attempt
        await createUsageLog(apiKey, baseId, {
          credential_id: [credentialId],
          action: 'ACCESS',
          status: 'FAILED',
          ip_address: userInfo.ip,
          user_agent: userInfo.userAgent,
          user_email: userInfo.email,
          error_message: 'Credential not found'
        });

        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Credential not found' })
        };
      }

      const credential = await getResponse.json();

      // Log successful usage
      await createUsageLog(apiKey, baseId, {
        credential_id: [credentialId],
        service_name: credential.fields.service_name,
        action: data.action || 'ACCESS',
        status: 'SUCCESS',
        ip_address: userInfo.ip,
        user_agent: userInfo.userAgent,
        user_email: userInfo.email,
        endpoint: data.endpoint || '',
        execution_time: 0
      });

      // Update usage count and last_used
      await fetch(`${url}/${credentialId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            usage_count: (credential.fields.usage_count || 0) + 1,
            last_used: new Date().toISOString()
          }
        })
      });

      // Return credential (with sensitive data masked)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          credential: maskSensitiveData(credential.fields)
        })
      };

    case 'list':
      const listResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const list = await listResponse.json();

      // Mask sensitive data in list
      if (list.records) {
        list.records = list.records.map(r => ({
          ...r,
          fields: maskSensitiveData(r.fields)
        }));
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(list)
      };

    default:
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' })
      };
  }
}

// ==================== USAGE LOG HANDLERS ====================

async function handleUsageLog(apiKey, baseId, action, data, userInfo, headers) {
  const url = `https://api.airtable.com/v0/${baseId}/${TABLES.USAGE_LOG}`;

  switch (action) {
    case 'list':
      // Get usage logs with optional filtering
      let filterFormula = '';
      if (data?.credentialId) {
        filterFormula = `?filterByFormula={credential_id}='${data.credentialId}'`;
      } else if (data?.date) {
        filterFormula = `?filterByFormula=IS_SAME({timestamp},'${data.date}','day')`;
      }

      const response = await fetch(`${url}${filterFormula}&sort[0][field]=timestamp&sort[0][direction]=desc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const logs = await response.json();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(logs)
      };

    case 'stats':
      // Get usage statistics
      const statsResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const allLogs = await statsResponse.json();

      // Calculate statistics
      const stats = calculateUsageStats(allLogs.records || []);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats)
      };

    default:
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' })
      };
  }
}

// ==================== AUDIT LOG HANDLERS ====================

async function handleAuditLog(apiKey, baseId, action, data, userInfo, headers) {
  const url = `https://api.airtable.com/v0/${baseId}/${TABLES.AUDIT_LOG}`;

  switch (action) {
    case 'list':
      const filterFormula = data?.riskLevel
        ? `?filterByFormula={risk_level}='${data.riskLevel}'`
        : '';

      const response = await fetch(`${url}${filterFormula}&sort[0][field]=timestamp&sort[0][direction]=desc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const logs = await response.json();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(logs)
      };

    case 'create':
      // Create audit log entry
      const auditResponse = await createAuditLog(apiKey, baseId, {
        ...data,
        changed_by: userInfo.email,
        ip_address: userInfo.ip,
        user_agent: userInfo.userAgent
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(auditResponse)
      };

    default:
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' })
      };
  }
}

// ==================== REQUEST HANDLERS ====================

async function handleRequest(apiKey, baseId, action, data, userInfo, headers) {
  const url = `https://api.airtable.com/v0/${baseId}/${TABLES.REQUEST}`;

  switch (action) {
    case 'create':
      // Create new request
      const createResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            ...data,
            requested_by: userInfo.email,
            status: 'PENDING',
            request_date: new Date().toISOString()
          }
        })
      });

      const created = await createResponse.json();

      return {
        statusCode: createResponse.ok ? 200 : 400,
        headers,
        body: JSON.stringify(created)
      };

    case 'approve':
      // Approve request
      const requestId = data.requestId;

      // Update request status
      const approveResponse = await fetch(`${url}/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            status: 'APPROVED',
            approved_by: userInfo.email,
            approval_date: new Date().toISOString()
          }
        })
      });

      if (approveResponse.ok) {
        // Create the credential if approved
        const request = await approveResponse.json();

        // Create credential based on request
        await handleCredentials(apiKey, baseId, 'create', {
          service_name: request.fields.service_name,
          credential_type: request.fields.credential_type,
          environment: 'Production',
          is_active: true,
          notes: `Created from request #${requestId}`
        }, userInfo, headers);

        // Create audit log
        await createAuditLog(apiKey, baseId, {
          action_type: 'APPROVE_REQUEST',
          changed_by: userInfo.email,
          ip_address: userInfo.ip,
          risk_level: 'LOW',
          notes: `Request #${requestId} approved`
        });
      }

      return {
        statusCode: approveResponse.ok ? 200 : 400,
        headers,
        body: JSON.stringify({ success: approveResponse.ok })
      };

    case 'reject':
      // Reject request
      const rejectId = data.requestId;

      const rejectResponse = await fetch(`${url}/${rejectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            status: 'REJECTED',
            approved_by: userInfo.email,
            approval_date: new Date().toISOString(),
            rejection_reason: data.reason || 'No reason provided'
          }
        })
      });

      return {
        statusCode: rejectResponse.ok ? 200 : 400,
        headers,
        body: JSON.stringify({ success: rejectResponse.ok })
      };

    case 'list':
      // List requests with optional filtering
      const filterFormula = data?.status
        ? `?filterByFormula={status}='${data.status}'`
        : '';

      const listResponse = await fetch(`${url}${filterFormula}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const requests = await listResponse.json();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(requests)
      };

    default:
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' })
      };
  }
}

// ==================== WORKFLOW HANDLERS ====================

async function handleWorkflow(apiKey, baseId, action, data, userInfo, headers) {
  switch (action) {
    case 'rotate-password':
      // Complex workflow: rotate password for a credential
      const credentialId = data.credentialId;
      const newPassword = data.newPassword; // Should be encrypted

      // Create audit log
      await createAuditLog(apiKey, baseId, {
        credential_id: [credentialId],
        action_type: 'UPDATE',
        field_changed: 'password',
        old_value: '****',
        new_value: '****',
        changed_by: userInfo.email,
        ip_address: userInfo.ip,
        risk_level: 'HIGH',
        change_reason: data.reason || 'Password rotation'
      });

      // Update credential
      const updateUrl = `https://api.airtable.com/v0/${baseId}/${TABLES.CREDENTIALS}/${credentialId}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            password: newPassword,
            updated_at: new Date().toISOString()
          }
        })
      });

      // Log usage
      await createUsageLog(apiKey, baseId, {
        credential_id: [credentialId],
        action: 'PASSWORD_ROTATION',
        status: updateResponse.ok ? 'SUCCESS' : 'FAILED',
        ip_address: userInfo.ip,
        user_email: userInfo.email
      });

      return {
        statusCode: updateResponse.ok ? 200 : 400,
        headers,
        body: JSON.stringify({
          success: updateResponse.ok,
          message: 'Password rotated successfully'
        })
      };

    case 'check-expiry':
      // Check for expiring credentials
      const credUrl = `https://api.airtable.com/v0/${baseId}/${TABLES.CREDENTIALS}`;
      const response = await fetch(credUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const credentials = await response.json();
      const expiringCreds = [];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      for (const record of credentials.records || []) {
        if (record.fields.token_expiry) {
          const expiryDate = new Date(record.fields.token_expiry);
          if (expiryDate < thirtyDaysFromNow) {
            expiringCreds.push({
              id: record.id,
              service_name: record.fields.service_name,
              expires_in_days: Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
            });
          }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          expiring_soon: expiringCreds,
          total: expiringCreds.length
        })
      };

    default:
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid workflow action' })
      };
  }
}

// ==================== HELPER FUNCTIONS ====================

async function createUsageLog(apiKey, baseId, data) {
  const url = `https://api.airtable.com/v0/${baseId}/${TABLES.USAGE_LOG}`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        ...data,
        timestamp: new Date().toISOString()
      }
    })
  });
}

async function createAuditLog(apiKey, baseId, data) {
  const url = `https://api.airtable.com/v0/${baseId}/${TABLES.AUDIT_LOG}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        ...data,
        timestamp: new Date().toISOString()
      }
    })
  });

  return await response.json();
}

function maskSensitiveData(fields) {
  const masked = { ...fields };

  // Mask sensitive fields
  if (masked.password) masked.password = '[ENCRYPTED]';
  if (masked.api_key) masked.api_key = masked.api_key ? `${masked.api_key.substring(0, 4)}****` : null;
  if (masked.access_token) masked.access_token = '[ENCRYPTED]';
  if (masked.refresh_token) masked.refresh_token = '[ENCRYPTED]';

  return masked;
}

function calculateUsageStats(records) {
  const stats = {
    total_usage: records.length,
    success_rate: 0,
    failed_attempts: 0,
    by_service: {},
    by_action: {},
    by_user: {},
    recent_24h: 0
  };

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const record of records) {
    const fields = record.fields;

    // Count by status
    if (fields.status === 'SUCCESS') {
      stats.success_rate++;
    } else if (fields.status === 'FAILED') {
      stats.failed_attempts++;
    }

    // Count by service
    const service = fields.service_name || 'Unknown';
    stats.by_service[service] = (stats.by_service[service] || 0) + 1;

    // Count by action
    const action = fields.action || 'Unknown';
    stats.by_action[action] = (stats.by_action[action] || 0) + 1;

    // Count by user
    const user = fields.user_email || 'Anonymous';
    stats.by_user[user] = (stats.by_user[user] || 0) + 1;

    // Count recent usage
    if (new Date(fields.timestamp) > yesterday) {
      stats.recent_24h++;
    }
  }

  // Calculate success rate percentage
  if (stats.total_usage > 0) {
    stats.success_rate = Math.round((stats.success_rate / stats.total_usage) * 100);
  }

  return stats;
}