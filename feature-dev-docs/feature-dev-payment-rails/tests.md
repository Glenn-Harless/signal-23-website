# Payment Rails - Test Specifications

## Acceptance Criteria

### Free Download Flow

- Entering `$0` for each mapped pack calls `/.netlify/functions/free-download` without creating a Stripe session.
- A successful response displays a download link on `/instruments`.
- The signed URL retrieves the mapped private R2 object before expiry and is rejected after its 30-minute lifetime.
- The response identifies the selected pack ID in `packTitle`.

### Paid Download Flow

- Entering an amount of at least `$0.50` calls `/.netlify/functions/create-checkout` and redirects to hosted Stripe Checkout.
- Checkout displays the caller-provided pack title and exact amount in USD.
- Successful payment redirects to `/instruments/success` with a `session_id` query parameter.
- The success page verifies that session before displaying a signed R2 link, amount, title, and customer email returned by Stripe.
- Canceling checkout returns to `/instruments` without exposing a download link.

### Webhook Flow

- A valid `checkout.session.completed` event is acknowledged and logs the session, pack, amount, and customer metadata.
- A valid `checkout.session.expired` event is acknowledged and logs the session ID.
- A missing or invalid Stripe signature returns `400`.
- A missing `STRIPE_WEBHOOK_SECRET` returns `500`.
- Webhook processing does not generate a download URL or become a prerequisite for browser delivery.

### Error Handling

- Missing request bodies and required fields return `400` where explicitly validated.
- Unknown pack IDs return `404` from both free-download and create-checkout.
- Paid amounts below `$0.50`, including negative values, return `400`.
- An unpaid Stripe session returns `402` and no download URL.
- A missing session ID returns `400`, an unknown session ID returns `404`, and an existing unpaid or expired session returns `402`.
- Unsupported HTTP methods return `405`.
- Network and provider failures produce a visible error state in the instrument or success page.

## Unit Test Expectations

### Storage Utility

- `generateSignedUrl` rejects IDs absent from `PACK_FILES`.
- Each allowed ID maps to the exact expected R2 object key.
- The returned expiry is approximately 1,800 seconds after signing.
- The R2 client uses region `auto`, the configured endpoint and credentials, and the configured/default bucket.

### Checkout Utility and Function

- Dollar amounts are rounded to integer cents before Stripe session creation.
- Checkout uses USD, card payment, payment mode, quantity one, and stores `packId` and `packTitle` in metadata.
- A valid `$5` request returns a Stripe-hosted checkout URL.
- `$0` is rejected with guidance to use `free-download`.
- Redirect origins are derived from `x-forwarded-proto` and `host`.

### Verification Function

- A paid session with a mapped pack ID returns an R2 signed URL and Stripe metadata.
- An unpaid session returns `402`.
- A session without pack metadata returns `400`.
- Stripe's missing-session error maps to `404`.

### Webhook Function

- Signature verification uses the raw event body, `stripe-signature`, and `STRIPE_WEBHOOK_SECRET`.
- Invalid signatures return `400` and valid events return `200`.
- Completed and expired sessions follow their respective logging branches.

## Integration Paths

### Path 1: Complete Free Acquisition

1. Open `/instruments` and select each of `arps`, `audio-fx`, `bass`, and `keys` in turn.
2. Enter `$0` and initiate acquisition.
3. Confirm the page receives and displays a signed R2 URL without navigating to Stripe.
4. Fetch the URL before expiry and verify the correct archive downloads.
5. Fetch the same URL after expiry and verify R2 rejects it.

### Path 2: Complete Paid Acquisition

1. Submit a mapped pack at `$0.50`, then repeat at another custom amount.
2. Confirm Stripe Checkout shows the matching pack title and amount.
3. Complete payment with Stripe test credentials.
4. Confirm the return URL contains `session_id` and the success page verifies it.
5. Confirm the returned signed URL downloads the mapped R2 archive.

### Path 3: Checkout Cancellation

1. Begin a paid checkout from `/instruments`.
2. Cancel on Stripe's hosted page.
3. Confirm the browser returns to `/instruments` and no download link is shown.

### Path 4: Webhook Validation

1. Send a Stripe-signed `checkout.session.completed` test event to `/.netlify/functions/stripe-webhook`.
2. Confirm the handler acknowledges it and logs the expected session metadata.
3. Repeat with an invalid signature and confirm a `400` response.

## Edge Case Tests

| Scenario | Expected behavior |
| --- | --- |
| Positive amount below `$0.50` | `create-checkout` returns `400` |
| Unknown pack ID | Free or paid endpoint returns `404` |
| Missing request body or required field | Endpoint returns `400` |
| Malformed JSON | Current endpoint error boundary returns `500` |
| Unpaid Checkout Session | `verify-payment` returns `402` |
| Missing Checkout Session ID | `verify-payment` returns `400` |
| Unknown Checkout Session ID | `verify-payment` returns `404` |
| Existing unpaid or expired session | `verify-payment` returns `402` |
| R2 object missing despite a mapped ID | Signing may succeed; object fetch fails |
| Expired signed URL | R2 rejects the object request |
| Missing webhook signature | Webhook returns `400` |
| Missing webhook secret | Webhook returns `500` |
