// Netlify Function to provide configuration without exposing API keys

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Return configuration (without sensitive API key)
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      baseId: process.env.Airtable_Base_ID,
      tableId: process.env.Airtable_MetrixTable_ID || 'tbldYyFJUCL6O73eA',
      // Never expose the API key
      configured: !!(process.env.Airtable_API_Key && process.env.Airtable_Base_ID)
    })
  };
};