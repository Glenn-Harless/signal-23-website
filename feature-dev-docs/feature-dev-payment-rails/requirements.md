# Payment Rails - Requirements

## Summary

The instrument-rack storefront supports pay-what-you-want acquisition. Exact `$0` acquisitions bypass Stripe, while paid acquisitions of at least `$0.50` use hosted Stripe Checkout. Both successful paths deliver a private Cloudflare R2 object through a signed URL that expires after 30 minutes.

## Architecture

```text
InstrumentsPage.tsx
        |
        v
Netlify Functions
  free-download.ts -------> Cloudflare R2 signed URL
  create-checkout.ts -----> Stripe Checkout
  verify-payment.ts ------> Stripe verification + R2 signed URL
  stripe-webhook.ts ------> Stripe signature verification and event logging
```

`netlify/functions/utils/storage.ts` uses the AWS SDK against Cloudflare R2's S3-compatible endpoint. `netlify/functions/utils/stripe.ts` owns Stripe session creation, retrieval, and webhook signature validation.

## Rack Catalog and Object Mapping

The frontend and server use the following stable pack IDs:

| Pack ID | Frontend title | R2 object key |
| --- | --- | --- |
| `arps` | ARPEGGIATOR COLLECTION | `Arps.zip` |
| `audio-fx` | AUDIO EFFECT RACKS | `Audio Effect Rack.zip` |
| `bass` | BASS INSTRUMENT RACKS | `Bass.zip` |
| `keys` | KEYS INSTRUMENT RACKS | `Keys.zip` |

Only IDs in `PACK_FILES` are eligible for checkout or signing. Adding or renaming a pack requires updating the frontend catalog and the server mapping together, and the corresponding object must exist in the configured private R2 bucket.

## Endpoints

### `POST /.netlify/functions/free-download`

This endpoint handles exact `$0` acquisitions and does not call Stripe.

Request:

```json
{ "packId": "arps" }
```

Successful response:

```json
{
  "downloadUrl": "https://<account>.r2.cloudflarestorage.com/...",
  "expiresAt": "2026-08-27T17:30:00.000Z",
  "packTitle": "arps"
}
```

The endpoint returns `400` when the body or `packId` is missing, `404` when the ID is not mapped, and `405` for non-POST methods. Signing or parsing failures return `500` with an error body.

### `POST /.netlify/functions/create-checkout`

This endpoint handles paid acquisitions and creates a hosted Stripe Checkout session.

Request:

```json
{
  "packId": "arps",
  "packTitle": "ARPEGGIATOR COLLECTION",
  "amount": 5
}
```

Successful response:

```json
{ "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_..." }
```

The function requires a mapped `packId`, a non-empty `packTitle`, and a numeric amount of at least `$0.50`. It derives the site origin from the forwarded protocol and request host so success and cancellation URLs work on local, preview, branch, and production hosts.

Stripe receives the pack ID and title as Checkout Session metadata. Successful checkout returns to `/instruments/success?session_id={CHECKOUT_SESSION_ID}`; cancellation returns to `/instruments`.

### `POST /.netlify/functions/verify-payment`

The success page calls this endpoint with the Stripe Checkout Session ID.

Request:

```json
{ "sessionId": "cs_..." }
```

Successful response:

```json
{
  "downloadUrl": "https://<account>.r2.cloudflarestorage.com/...",
  "expiresAt": "2026-08-27T17:30:00.000Z",
  "packTitle": "ARPEGGIATOR COLLECTION",
  "amount": 5,
  "customerEmail": "listener@example.com"
}
```

The function retrieves the session from Stripe, requires `payment_status` to be `paid`, requires a pack ID in session metadata, and then signs the mapped R2 object for 30 minutes. An existing unpaid or expired session returns `402`; an unknown session ID returns `404`; a missing request, session ID, or required session metadata returns `400`; other failures return `500`.

### `POST /.netlify/functions/stripe-webhook`

The webhook validates the `stripe-signature` header using `STRIPE_WEBHOOK_SECRET`. It logs metadata for `checkout.session.completed`, logs the session ID for `checkout.session.expired`, acknowledges valid events with `200`, and logs other valid event types as unhandled.

The webhook does not create download URLs, persist entitlements, send email, or deliver files. File delivery is initiated by `verify-payment` after the browser returns from Stripe.

## User Flows

### Free Acquisition

1. The user selects a rack, enters `$0`, and initiates acquisition.
2. The frontend calls `free-download` with the selected pack ID.
3. The function validates the ID and signs its mapped R2 object for 30 minutes.
4. The storefront displays the download link without leaving the page.

### Paid Acquisition

1. The user enters at least `$0.50` and initiates acquisition.
2. The frontend calls `create-checkout` with the selected ID, title, and amount.
3. The browser redirects to hosted Stripe Checkout.
4. Stripe redirects a successful payment to `/instruments/success?session_id=...`.
5. The success page calls `verify-payment`.
6. The verified session produces a 30-minute R2 signed URL and the page displays the download link.

## Environment Variables

| Variable | Description |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe API key used for Checkout Session creation and retrieval |
| `STRIPE_WEBHOOK_SECRET` | Signing secret used to validate webhook requests |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible account endpoint |
| `R2_ACCESS_KEY_ID` | R2 API credential |
| `R2_SECRET_ACCESS_KEY` | R2 API credential |
| `R2_BUCKET` | Private object bucket; defaults to `signal23-racks` |

`.env.example` contains placeholders. Secrets must remain server-side and must not be committed or included in browser bundles.

## Constraints

- Stripe's configured minimum paid amount is `$0.50` USD.
- Only an exact numeric zero uses the free path in the frontend; a positive amount below `$0.50` is rejected by `create-checkout`.
- Signed download URLs expire 1,800 seconds after generation.
- R2 remains private; browser access occurs through signed `GetObject` URLs.
- Checkout and signing are limited to the server-side `PACK_FILES` allowlist.
- Webhook signatures must be verified before an event is accepted.
- The current implementation has no entitlement database, download counter, rate limiter, or email-delivery workflow.

## Edge Cases

- An unknown pack ID returns `404` before Stripe session creation or R2 signing.
- A missing pack object can still produce a presigned URL because the active signing path does not issue a `HeadObject` check; the failure appears when the URL is fetched.
- An expired signed URL is rejected by R2 and requires a new successful acquisition or payment verification to generate another URL.
- A valid Stripe session that is not paid does not receive a download URL.
- A valid payment session without mapped pack metadata cannot be fulfilled.
- Malformed JSON and unexpected provider errors are handled by the endpoint error boundary and currently return `500`.
