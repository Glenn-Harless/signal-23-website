# Payment Rails - Decisions Log

Append-only log of architectural decisions.

---

## 2026-01-01 - Claude Opus 4.5

### Decision: Use Supabase Storage over Dropbox for file hosting

**Context:** Need secure file hosting with signed URL support for time-limited downloads.

**Options Considered:**
1. Dropbox - Already in use for audio streaming
2. Supabase Storage - S3-compatible with built-in signed URLs
3. Cloudflare R2 - Free egress, S3-compatible
4. AWS S3 - Industry standard

**Decision:** Supabase Storage

**Rationale:**
- Native signed URL support with configurable expiry
- Generous free tier (1GB storage, 2GB bandwidth)
- Simple SDK integration
- Dropbox lacks true time-expiring signed URLs
- Lower complexity than R2 or S3 for this use case

---

## 2026-01-01 - Claude Opus 4.5

### Decision: Use Stripe Checkout (hosted) over custom payment form

**Context:** Need to accept pay-what-you-want payments with $0 minimum.

**Options Considered:**
1. Stripe Checkout (hosted page)
2. Stripe Elements (embedded form)
3. Gumroad integration
4. PayPal

**Decision:** Stripe Checkout (hosted)

**Rationale:**
- PCI compliance handled by Stripe
- No custom payment UI to build/maintain
- Supports dynamic pricing via API
- Lower development effort than Elements
- Keeps payment flow on trusted Stripe domain
- 2.9% + $0.30 fees (lower than Gumroad's 10%)

---

## 2026-01-01 - Claude Opus 4.5

### Decision: Bypass Stripe entirely for $0 purchases

**Context:** Stripe cannot process $0 charges.

**Decision:** When amount = $0, skip Stripe and generate signed download URL directly.

**Rationale:**
- Stripe API rejects $0 amounts
- No point collecting payment info for free downloads
- Reduces friction for free tier users
- Separate endpoint (`free-download`) keeps logic clean

---

## 2026-01-01 - Claude Opus 4.5

### Decision: Use Netlify Functions for serverless backend

**Context:** Need server-side code for Stripe API and signed URL generation.

**Options Considered:**
1. Netlify Functions
2. Vercel Serverless Functions
3. AWS Lambda
4. Self-hosted backend

**Decision:** Netlify Functions

**Rationale:**
- Site already hosted on Netlify
- Zero additional infrastructure
- Built-in environment variable management
- Automatic HTTPS
- Sufficient for expected traffic volume

---

## 2026-08-27 09:17 PDT - Codex GPT-5

### Decision: Use Cloudflare R2 as the active private download store

**Context:** The deployed payment rail now signs private rack archives from Cloudflare R2 through its S3-compatible API. The earlier Supabase decision no longer describes the implementation, environment variables, pack IDs, or object mapping.

**Options Considered:**

1. Restore the documented Supabase Storage integration.
2. Keep the implemented Cloudflare R2 storage layer and update the living documentation.
3. Place rack archives on a public static host.

**Decision:** Cloudflare R2 supersedes Supabase Storage for rack delivery. Netlify Functions use the AWS S3 client and presigner with `R2_ENDPOINT`, R2 credentials, and a private `signal23-racks` bucket by default.

**Rationale:** R2 is already the working server-side integration, preserves time-limited private delivery, uses a standard S3-compatible signing path, and avoids exposing rack archives as public site assets. Recording this as a superseding decision preserves the historical log while making the current architecture unambiguous.
