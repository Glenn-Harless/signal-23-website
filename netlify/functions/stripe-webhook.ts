import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { constructWebhookEvent } from './utils/stripe';
import Stripe from 'stripe';

/**
 * Stripe Webhook Handler
 *
 * This endpoint receives webhook events from Stripe.
 * Currently handles: checkout.session.completed
 *
 * To set up:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Add endpoint: https://your-site.netlify.app/.netlify/functions/stripe-webhook
 * 3. Select events: checkout.session.completed
 * 4. Copy the signing secret to STRIPE_WEBHOOK_SECRET env var
 */

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook not configured' }),
    };
  }

  // Get the signature from headers
  const signature = event.headers['stripe-signature'];

  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing stripe-signature header' }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing request body' }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    // Verify the webhook signature
    stripeEvent = constructWebhookEvent(event.body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }),
    };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;

      console.log('Payment successful:', {
        sessionId: session.id,
        packId: session.metadata?.packId,
        packTitle: session.metadata?.packTitle,
        amount: session.amount_total ? session.amount_total / 100 : null,
        customerEmail: session.customer_details?.email,
      });

      // In a production system, you might:
      // - Send a confirmation email
      // - Log to analytics
      // - Update a database
      // - Trigger other automations

      break;
    }

    case 'checkout.session.expired': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      console.log('Checkout session expired:', session.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  // Return 200 to acknowledge receipt
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};

export { handler };
