// Netlify Function for bulk CSV import to Airtable

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get environment variables
  const API_KEY = process.env.Airtable_API_Key;
  const BASE_ID = process.env.Airtable_Base_ID;
  const TABLE_ID = process.env.Airtable_MetrixTable_ID || 'tbldYyFJUCL6O73eA';

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
    const { records } = JSON.parse(event.body || '{}');

    if (!records || !Array.isArray(records)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Records array is required' })
      };
    }

    // Process records in batches of 10 (Airtable's limit)
    const batchSize = 10;
    const results = [];
    const errors = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      // Prepare batch for Airtable
      const airtableRecords = batch.map(record => {
        const { id, ...fields } = record;
        return { fields };
      });

      // Send batch to Airtable
      const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: airtableRecords,
          typecast: true
        })
      };

      try {
        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
          results.push(...(data.records || []));
        } else {
          errors.push({
            batch: i / batchSize + 1,
            error: data.error || 'Unknown error'
          });
        }
      } catch (error) {
        errors.push({
          batch: i / batchSize + 1,
          error: error.message
        });
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: errors.length === 0,
        created: results.length,
        errors: errors,
        message: `Successfully imported ${results.length} records${errors.length > 0 ? ` with ${errors.length} batch errors` : ''}`
      })
    };

  } catch (error) {
    console.error('Error in bulk import:', error);
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