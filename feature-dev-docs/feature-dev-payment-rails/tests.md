# Payment Rails - Test Specifications

## Acceptance Criteria

### Free Download Flow

- [ ] User can enter $0 and click download
- [ ] System generates signed URL without Stripe interaction
- [ ] Signed URL works for download
- [ ] Signed URL expires after configured time
- [ ] Expired URL returns 403/404

### Paid Download Flow

- [ ] User can enter custom amount ($1+)
- [ ] System redirects to Stripe Checkout
- [ ] Stripe Checkout shows correct amount and product name
- [ ] Successful payment redirects to success page
- [ ] Success page displays download link
- [ ] Download link works
- [ ] Download link expires after configured time

### Stripe Webhook

- [ ] Webhook receives checkout.session.completed event
- [ ] Webhook verifies Stripe signature
- [ ] Invalid signature returns 400
- [ ] Valid signature triggers download URL generation

### Error Handling

- [ ] Invalid packId returns 400
- [ ] Missing required fields return 400
- [ ] Invalid session_id on success page shows error
- [ ] Network errors show user-friendly message

## Unit Test Expectations

### `create-checkout` Function

```typescript
describe('create-checkout', () => {
  it('creates Stripe session for valid $5 purchase', async () => {
    const response = await handler({
      body: JSON.stringify({ packId: 'S23-01', packTitle: 'Test', amount: 5 })
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).checkoutUrl).toMatch(/checkout\.stripe\.com/);
  });

  it('returns 400 for missing packId', async () => {
    const response = await handler({
      body: JSON.stringify({ amount: 5 })
    });
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 for $0 amount', async () => {
    const response = await handler({
      body: JSON.stringify({ packId: 'S23-01', amount: 0 })
    });
    expect(response.statusCode).toBe(400);
    // $0 should use free-download endpoint instead
  });
});
```

### `free-download` Function

```typescript
describe('free-download', () => {
  it('generates signed URL for valid packId', async () => {
    const response = await handler({
      body: JSON.stringify({ packId: 'S23-01' })
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.downloadUrl).toContain('supabase');
    expect(body.expiresAt).toBeDefined();
  });

  it('returns 404 for non-existent pack', async () => {
    const response = await handler({
      body: JSON.stringify({ packId: 'INVALID' })
    });
    expect(response.statusCode).toBe(404);
  });
});
```

### `stripe-webhook` Function

```typescript
describe('stripe-webhook', () => {
  it('returns 400 for invalid signature', async () => {
    const response = await handler({
      headers: { 'stripe-signature': 'invalid' },
      body: '{}'
    });
    expect(response.statusCode).toBe(400);
  });

  it('processes valid checkout.session.completed event', async () => {
    // Mock valid Stripe event with proper signature
    const response = await handler(validWebhookEvent);
    expect(response.statusCode).toBe(200);
  });
});
```

## Integration Test Paths

### Path 1: Complete Free Download

1. POST `/api/free-download` with `{ packId: 'S23-01' }`
2. Receive signed URL
3. GET signed URL
4. Verify file downloads correctly
5. Wait for expiry
6. GET signed URL again
7. Verify 403/404 response

### Path 2: Complete Paid Download

1. POST `/api/create-checkout` with `{ packId: 'S23-01', amount: 5 }`
2. Receive Stripe checkout URL
3. Complete Stripe test payment
4. Verify redirect to success page with session_id
5. POST `/api/verify-payment` with session_id
6. Receive signed download URL
7. Verify file downloads correctly

### Path 3: Webhook Flow (E2E)

1. Trigger Stripe test webhook for checkout.session.completed
2. Verify webhook handler processes event
3. Verify download URL can be retrieved for that session

## Edge Case Tests

| Scenario | Expected Behavior |
|----------|-------------------|
| $0.30 payment (below Stripe min) | Treat as free OR return error |
| Malformed JSON body | Return 400 |
| Missing Stripe signature header | Return 400 |
| Expired Stripe session | Return 400 with message |
| Rate limiting (100+ requests/min) | Return 429 |
| Pack file missing from Supabase | Return 500 with logging |
