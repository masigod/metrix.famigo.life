// Netlify Function to proxy Airtable API requests
// This function uses environment variables set in Netlify

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
    // Handle different HTTP methods directly
    let url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
    let options = {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    switch (event.httpMethod) {
      case 'GET':
        // List all records with pagination
        options.method = 'GET';
        let allRecords = [];
        let offset = '';

        // Airtable returns max 100 records per request, need to paginate
        do {
          const paginatedUrl = offset
            ? `${url}?pageSize=100&offset=${offset}&view=Grid%20view`
            : `${url}?pageSize=100&view=Grid%20view`;

          const getResponse = await fetch(paginatedUrl, options);
          const getData = await getResponse.json();

          if (getData.records) {
            allRecords = allRecords.concat(getData.records.map(record => ({
              id: record.id,
              ...record.fields
            })));
          }

          // Airtable provides offset for next page if there are more records
          offset = getData.offset || '';

        } while (offset);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            records: allRecords,
            total: allRecords.length
          })
        };

      case 'POST':
        // Create new record
        const postData = JSON.parse(event.body || '{}');
        delete postData.id; // Remove id for new records

        options.method = 'POST';
        options.body = JSON.stringify({
          fields: postData
        });

        const postResponse = await fetch(url, options);
        const postResult = await postResponse.json();

        if (!postResponse.ok) {
          console.error('Airtable API error:', postResult);
          return {
            statusCode: postResponse.status,
            headers,
            body: JSON.stringify({
              error: postResult.error?.message || 'Failed to create record',
              details: postResult.error
            })
          };
        }

        return {
          statusCode: postResponse.status,
          headers,
          body: JSON.stringify({
            success: true,
            record: {
              id: postResult.id,
              ...postResult.fields
            }
          })
        };

      case 'PUT':
        // Update existing record
        const putData = JSON.parse(event.body || '{}');
        const { id, ...updateFields } = putData;

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Record ID is required for update' })
          };
        }

        url += `/${id}`;
        options.method = 'PATCH';
        options.body = JSON.stringify({
          fields: updateFields
        });

        const putResponse = await fetch(url, options);
        const putResult = await putResponse.json();

        if (!putResponse.ok) {
          console.error('Airtable API error:', putResult);
          return {
            statusCode: putResponse.status,
            headers,
            body: JSON.stringify({
              error: putResult.error?.message || 'Failed to update record',
              details: putResult.error
            })
          };
        }

        return {
          statusCode: putResponse.status,
          headers,
          body: JSON.stringify({
            success: true,
            record: {
              id: putResult.id,
              ...putResult.fields
            }
          })
        };

      case 'DELETE':
        // Delete record
        const deleteData = JSON.parse(event.body || '{}');

        if (!deleteData.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Record ID is required for delete' })
          };
        }

        url += `/${deleteData.id}`;
        options.method = 'DELETE';

        const deleteResponse = await fetch(url, options);

        return {
          statusCode: deleteResponse.status,
          headers,
          body: JSON.stringify({
            success: deleteResponse.ok,
            message: 'Record deleted successfully'
          })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

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