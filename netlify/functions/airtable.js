// Netlify Function to proxy Airtable API requests
// This function uses environment variables set in Netlify

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
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
  const TABLE_ID = process.env.Airtable_Table_ID;

  if (!API_KEY || !BASE_ID || !TABLE_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server configuration error. Environment variables not set.'
      })
    };
  }

  try {
    // Parse the request
    const { action, recordId, data, params } = JSON.parse(event.body || '{}');

    let url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
    let options = {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    // Handle different actions
    switch (action) {
      case 'list':
        // List records with optional parameters
        if (params) {
          const queryParams = new URLSearchParams(params);
          url += `?${queryParams.toString()}`;
        }
        options.method = 'GET';
        break;

      case 'create':
        // Create new record
        options.method = 'POST';
        options.body = JSON.stringify(data);
        break;

      case 'update':
        // Update existing record
        if (!recordId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Record ID is required for update' })
          };
        }
        url += `/${recordId}`;
        options.method = 'PATCH';
        options.body = JSON.stringify(data);
        break;

      case 'delete':
        // Delete record
        if (!recordId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Record ID is required for delete' })
          };
        }
        url += `/${recordId}`;
        options.method = 'DELETE';
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

    // Make request to Airtable
    const response = await fetch(url, options);
    const responseData = await response.json();

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Error in Airtable function:', error);
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