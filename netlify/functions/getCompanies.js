// Netlify serverless function to fetch company records from Airtable.
//
// This function expects the following environment variables to be set in
// Netlify:
// - AIRTABLE_API_KEY: your Airtable personal access token with read
//   permissions on the Red White & Built base.
// - AIRTABLE_BASE_ID: the ID of your Airtable base (e.g. "appXXXXXXXX").
// - AIRTABLE_TABLE_NAME: the name of the table to query (e.g. "Companies").
//
// It returns a JSON array of records with the fields provided by the
// Airtable table. If an error occurs, a 500 response is returned with
// the error message.

exports.handler = async function(event, context) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Companies';

  if (!apiKey || !baseId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Airtable configuration.' })
    };
  }

  const encodedTableName = encodeURIComponent(tableName);
  const url = `https://api.airtable.com/v0/${baseId}/${encodedTableName}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Airtable API responded with status ${response.status}`);
    }
    const data = await response.json();
    // Return only the list of records to keep the payload small.
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data.records || [])
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
