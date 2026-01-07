import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { generateSignedUrl, PACK_FILES } from './utils/storage';

interface FreeDownloadRequest {
  packId: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const { packId } = JSON.parse(event.body) as FreeDownloadRequest;

    // Validate packId
    if (!packId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing packId' }),
      };
    }

    // Check if pack exists in our mapping
    if (!PACK_FILES[packId]) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Pack not found: ${packId}` }),
      };
    }

    // Generate signed URL (30 minute expiry)
    const result = await generateSignedUrl(packId, 1800);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Free download error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};

export { handler };
