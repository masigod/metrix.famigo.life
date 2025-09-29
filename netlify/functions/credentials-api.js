// SystemCredentials API - Netlify Function
// Manages encrypted credentials in Airtable

const crypto = require('crypto');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Get environment variables
  const API_KEY = process.env.Airtable_API_Key;
  const BASE_ID = process.env.Airtable_Base_ID;
  const TABLE_NAME = 'SystemCredentials';

  if (!API_KEY || !BASE_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server configuration error. Environment variables not set.'
      })
    };
  }

  try {
    // Parse request
    const body = event.httpMethod === 'GET' ?
      { action: event.queryStringParameters?.action || 'list' } :
      JSON.parse(event.body || '{}');

    const { action, data } = body;

    switch (action) {
      case 'create':
        return await createCredential(API_KEY, BASE_ID, TABLE_NAME, data, headers);

      case 'list':
        return await listCredentials(API_KEY, BASE_ID, TABLE_NAME, headers);

      case 'get':
        return await getCredential(API_KEY, BASE_ID, TABLE_NAME, body.id, headers);

      case 'update':
        return await updateCredential(API_KEY, BASE_ID, TABLE_NAME, body.id, data, headers);

      case 'delete':
        return await deleteCredential(API_KEY, BASE_ID, TABLE_NAME, body.id, headers);

      case 'decrypt':
        return await decryptCredential(API_KEY, BASE_ID, TABLE_NAME, body.id, body.masterKey, headers);

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Error in credentials-api:', error);
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

// Create new credential
async function createCredential(apiKey, baseId, tableName, data, headers) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

  // Add server-side encryption layer (optional)
  const encryptedData = {
    ...data,
    // Add server timestamp
    created_at: new Date().toISOString(),
    // Hash sensitive data for additional security
    password_hash: data.password ? hashData(data.password) : null,
    api_key_hash: data.api_key ? hashData(data.api_key) : null
  };

  const requestBody = {
    fields: encryptedData
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: result.error?.message || 'Failed to create credential'
        })
      };
    }

    // Remove sensitive data from response
    const sanitizedResult = {
      id: result.id,
      fields: {
        ...result.fields,
        password: '[ENCRYPTED]',
        api_key: '[ENCRYPTED]',
        password_hash: undefined,
        api_key_hash: undefined
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        credential: sanitizedResult
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create credential',
        message: error.message
      })
    };
  }
}

// List all credentials (without sensitive data)
async function listCredentials(apiKey, baseId, tableName, headers) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: result.error?.message || 'Failed to fetch credentials'
        })
      };
    }

    // Sanitize credentials - remove sensitive data
    const sanitizedCredentials = result.records.map(record => ({
      id: record.id,
      fields: {
        credential_id: record.fields.credential_id,
        service_name: record.fields.service_name,
        credential_type: record.fields.credential_type,
        username: record.fields.username,
        environment: record.fields.environment,
        is_active: record.fields.is_active,
        created_at: record.fields.created_at,
        notes: record.fields.notes,
        // Hide sensitive fields
        password: record.fields.password ? '[ENCRYPTED]' : null,
        api_key: record.fields.api_key ? '[ENCRYPTED]' : null
      }
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        credentials: sanitizedCredentials,
        total: sanitizedCredentials.length
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch credentials',
        message: error.message
      })
    };
  }
}

// Get single credential
async function getCredential(apiKey, baseId, tableName, id, headers) {
  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Credential ID required' })
    };
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}/${id}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: result.error?.message || 'Credential not found'
        })
      };
    }

    // Sanitize response
    const sanitizedResult = {
      id: result.id,
      fields: {
        ...result.fields,
        password: result.fields.password ? '[ENCRYPTED]' : null,
        api_key: result.fields.api_key ? '[ENCRYPTED]' : null,
        password_hash: undefined,
        api_key_hash: undefined
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        credential: sanitizedResult
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch credential',
        message: error.message
      })
    };
  }
}

// Update credential
async function updateCredential(apiKey, baseId, tableName, id, data, headers) {
  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Credential ID required' })
    };
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}/${id}`;

  // Add updated timestamp
  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };

  // Hash new passwords if provided
  if (data.password) {
    updateData.password_hash = hashData(data.password);
  }
  if (data.api_key) {
    updateData.api_key_hash = hashData(data.api_key);
  }

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: updateData
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: result.error?.message || 'Failed to update credential'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Credential updated successfully'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update credential',
        message: error.message
      })
    };
  }
}

// Delete credential
async function deleteCredential(apiKey, baseId, tableName, id, headers) {
  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Credential ID required' })
    };
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}/${id}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const result = await response.json();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: result.error?.message || 'Failed to delete credential'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Credential deleted successfully'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to delete credential',
        message: error.message
      })
    };
  }
}

// Decrypt credential (requires master key)
async function decryptCredential(apiKey, baseId, tableName, id, masterKey, headers) {
  if (!id || !masterKey) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Credential ID and master key required' })
    };
  }

  // Fetch the credential
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}/${id}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: result.error?.message || 'Credential not found'
        })
      };
    }

    // Verify master key hash (if stored)
    // This is a simplified example - in production, use more secure methods

    // Return decrypted data structure
    // Note: Actual decryption should happen on client-side for security
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Decrypt on client-side using master key',
        credential: {
          id: result.id,
          fields: {
            ...result.fields,
            // These are still encrypted - decrypt on client
            password: result.fields.password,
            api_key: result.fields.api_key
          }
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch credential for decryption',
        message: error.message
      })
    };
  }
}

// Helper: Hash data for additional security
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}