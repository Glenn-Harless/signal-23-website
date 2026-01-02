# Payment Rails - Requirements

## Summary

Pay-what-you-want payment system for Signal-23 instrument racks with secure file delivery via time-limited signed URLs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                            │
│  InstrumentsPage.tsx → calls Netlify Functions                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NETLIFY FUNCTIONS                              │
├─────────────────────────────────────────────────────────────────┤
│  free-download.ts      → $0 purchases, generates signed URL     │
│  create-checkout.ts    → $1+ purchases, creates Stripe session  │
│  verify-payment.ts     → Validates session, generates signed URL│
│  stripe-webhook.ts     → Receives Stripe events (logging)       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│     STRIPE API          │     │      SUPABASE STORAGE           │
│  Payment processing     │     │  Private bucket with .zip files │
│  Checkout sessions      │     │  Signed URL generation          │
└─────────────────────────┘     └─────────────────────────────────┘
```

## Endpoints

### POST `/.netlify/functions/free-download`

For $0 purchases. Skips Stripe entirely.

**Request:**
```json
{ "packId": "S23-01" }
```

**Response:**
```json
{
  "downloadUrl": "https://xxx.supabase.co/storage/v1/...",
  "expiresAt": "2026-01-01T18:00:00.000Z",
  "packTitle": "S23-01"
}
```

### POST `/.netlify/functions/create-checkout`

For $0.50+ purchases. Creates Stripe Checkout session.

**Request:**
```json
{
  "packId": "S23-01",
  "packTitle": "VINTAGE SYNTHESIZER ARRAY",
  "amount": 5.00
}
```

**Response:**
```json
{ "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_xxx" }
```

### POST `/.netlify/functions/verify-payment`

Called on success page to validate payment and get download URL.

**Request:**
```json
{ "sessionId": "cs_xxx" }
```

**Response:**
```json
{
  "downloadUrl": "https://xxx.supabase.co/storage/v1/...",
  "expiresAt": "2026-01-01T18:00:00.000Z",
  "packTitle": "VINTAGE SYNTHESIZER ARRAY",
  "amount": 5.00,
  "customerEmail": "user@example.com"
}
```

### POST `/.netlify/functions/stripe-webhook`

Receives Stripe webhook events. Currently logs `checkout.session.completed`.

## User Flows

### $0 (Free) Flow
1. User enters $0 → clicks "INITIATE ACQUISITION"
2. Frontend calls `free-download` with packId
3. Function generates 30-min signed URL
4. User sees download link immediately

### $1+ (Paid) Flow
1. User enters amount → clicks "INITIATE ACQUISITION"
2. Frontend calls `create-checkout`
3. User redirected to Stripe Checkout
4. After payment → redirected to `/instruments/success?session_id=xxx`
5. Success page calls `verify-payment`
6. User sees download link

## Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard | API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhooks | Signing secret |
| `SUPABASE_URL` | Supabase Settings | Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase Settings | Service role key |
| `SUPABASE_BUCKET` | Configured | Bucket name (default: instrument-racks) |
| `URL` | Netlify (auto) | Site URL for redirects |

## File Mapping

Defined in `netlify/functions/utils/supabase.ts`:

```typescript
const PACK_FILES = {
  'S23-01': 'S23-01-vintage-synth.zip',
  'D90-05': 'D90-05-modular-drums.zip',
  'E45-02': 'E45-02-textures.zip',
};
```

Update this mapping when adding new packs.

## Constraints

- Stripe minimum charge: $0.50
- Signed URLs expire in 30 minutes (configurable)
- Files must be in private Supabase bucket
- Webhook signature must be verified
