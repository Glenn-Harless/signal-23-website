import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createCheckoutSession, STRIPE_MINIMUM_AMOUNT } from './utils/stripe';
import { PACK_FILES } from './utils/storage';

interface CreateCheckoutRequest {
  packId: string;
  packTitle: string;
  amount: number;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const { packId, packTitle, amount } = JSON.parse(event.body) as CreateCheckoutRequest;

    // Validate required fields
    if (!packId || !packTitle) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing packId or packTitle' }),
      };
    }

    // Validate amount
    if (typeof amount !== 'number' || amount < STRIPE_MINIMUM_AMOUNT) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Amount must be at least $${STRIPE_MINIMUM_AMOUNT}. Use free-download endpoint for $0 purchases.`,
        }),
      };
    }

    // Check if pack exists
    if (!PACK_FILES[packId]) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Pack not found: ${packId}` }),
      };
    }

    // Get the site URL for redirects
    // Use headers to determine the origin, which works for branch deploys, local dev, and production
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers.host;
    const siteUrl = `${protocol}://${host}`;
    const successUrl = `${siteUrl}/instruments/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/instruments`;

    // Create Stripe checkout session
    const checkoutUrl = await createCheckoutSession(
      packId,
      packTitle,
      amount,
      successUrl,
      cancelUrl
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ checkoutUrl }),
    };
  } catch (error) {
    console.error('Create checkout error:', error);

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
