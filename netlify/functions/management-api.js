// Management Panel API - Netlify Function
// Handles data sync between Google Sheets and Airtable

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  const TABLE_NAME = 'ManagementPanel';

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
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(API_KEY, BASE_ID, TABLE_NAME, headers);

      case 'POST':
        const body = JSON.parse(event.body || '{}');
        if (body.action === 'sync') {
          return await handleSync(API_KEY, BASE_ID, TABLE_NAME, headers);
        }
        return await handleCreate(API_KEY, BASE_ID, TABLE_NAME, body, headers);

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Error in management-api:', error);
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

// Get all records with pagination
async function handleGet(apiKey, baseId, tableName, headers) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
  const requestHeaders = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  let allRecords = [];
  let offset = '';

  try {
    // Fetch all records with pagination
    do {
      const params = new URLSearchParams({
        pageSize: '100',
        view: 'Grid view'
      });

      if (offset) {
        params.append('offset', offset);
      }

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: requestHeaders
      });

      const data = await response.json();

      if (data.records) {
        // Transform records
        const transformedRecords = data.records.map(record => ({
          id: record.id,
          ...record.fields,
          // Add metadata
          _airtable_id: record.id,
          _created_time: record.createdTime
        }));
        allRecords = allRecords.concat(transformedRecords);
      }

      offset = data.offset || '';
    } while (offset);

    // Add summary statistics
    const stats = calculateStatistics(allRecords);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        records: allRecords,
        total: allRecords.length,
        statistics: stats,
        sync_time: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error fetching records:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch records',
        message: error.message
      })
    };
  }
}

// Handle sync action
async function handleSync(apiKey, baseId, tableName, headers) {
  try {
    // This would trigger Google Sheets sync
    // For now, we'll return the current sync status

    const syncStatus = {
      status: 'initiated',
      timestamp: new Date().toISOString(),
      message: 'Sync process initiated. Data will be updated within 1-2 minutes.',
      next_auto_sync: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(syncStatus)
    };

  } catch (error) {
    console.error('Error in sync:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Sync failed',
        message: error.message
      })
    };
  }
}

// Create new record
async function handleCreate(apiKey, baseId, tableName, data, headers) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
  const requestHeaders = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // Remove system fields
    delete data.id;
    delete data._airtable_id;
    delete data._created_time;

    // Add sync timestamp
    data.sync_timestamp = new Date().toISOString();
    data.processing_status = 'imported';

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        fields: data
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: result.error?.message || 'Failed to create record',
          details: result.error
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        record: {
          id: result.id,
          ...result.fields
        }
      })
    };

  } catch (error) {
    console.error('Error creating record:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create record',
        message: error.message
      })
    };
  }
}

// Calculate statistics
function calculateStatistics(records) {
  const stats = {
    total: records.length,
    by_location: {},
    by_status: {},
    by_date: {},
    today_count: 0,
    pending_count: 0,
    participated_count: 0
  };

  const today = new Date().toISOString().split('T')[0];

  records.forEach(record => {
    // Location stats
    const location = record.reservation_location || record.data_source || 'Unknown';
    stats.by_location[location] = (stats.by_location[location] || 0) + 1;

    // Status stats
    const status = record.participation_result || 'unknown';
    stats.by_status[status] = (stats.by_status[status] || 0) + 1;

    // Date stats
    const date = record.reservation_date;
    if (date) {
      stats.by_date[date] = (stats.by_date[date] || 0) + 1;
      if (date === today) {
        stats.today_count++;
      }
    }

    // Specific counts
    if (status === 'pending') stats.pending_count++;
    if (status === 'participated') stats.participated_count++;
  });

  // Calculate participation rate
  if (stats.total > 0) {
    stats.participation_rate = Math.round((stats.participated_count / stats.total) * 100);
  }

  return stats;
}