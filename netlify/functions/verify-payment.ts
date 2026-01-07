import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { verifyCheckoutSession } from './utils/stripe';
import { generateSignedUrl } from './utils/storage';

interface VerifyPaymentRequest {
  sessionId: string;
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

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
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

    const { sessionId } = JSON.parse(event.body) as VerifyPaymentRequest;

    // Validate sessionId
    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing sessionId' }),
      };
    }

    // Verify the checkout session with Stripe
    const session = await verifyCheckoutSession(sessionId);

    // Check if payment was successful
    if (!session.paid) {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ error: 'Payment not completed' }),
      };
    }

    // Check if we have the pack info
    if (!session.packId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing pack information in session' }),
      };
    }

    // Generate signed download URL (30 minute expiry)
    const downloadResult = await generateSignedUrl(session.packId, 1800);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...downloadResult,
        packTitle: session.packTitle,
        amount: session.amount,
        customerEmail: session.customerEmail,
      }),
    };
  } catch (error) {
    console.error('Verify payment error:', error);

    // Handle Stripe-specific errors
    if (error instanceof Error && error.message.includes('No such checkout.session')) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Session not found or expired' }),
      };
    }

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
