import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Minimum amount Stripe can process (in dollars)
export const STRIPE_MINIMUM_AMOUNT = 0.50;

/**
 * Create a Stripe Checkout session for a pack purchase
 */
export async function createCheckoutSession(
  packId: string,
  packTitle: string,
  amount: number,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  // Convert dollars to cents
  const amountInCents = Math.round(amount * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: packTitle,
            description: `Signal-23 Instrument Rack: ${packId}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      packId,
      packTitle,
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session.url;
}

/**
 * Retrieve and verify a completed checkout session
 */
export async function verifyCheckoutSession(sessionId: string): Promise<{
  paid: boolean;
  packId: string | null;
  packTitle: string | null;
  amount: number | null;
  customerEmail: string | null;
}> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    paid: session.payment_status === 'paid',
    packId: (session.metadata?.packId as string) || null,
    packTitle: (session.metadata?.packTitle as string) || null,
    amount: session.amount_total ? session.amount_total / 100 : null,
    customerEmail: session.customer_details?.email || null,
  };
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
