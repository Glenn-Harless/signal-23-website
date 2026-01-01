# Instrument Racks Page - Functional Specification

## Overview

A new page for Signal-23 that offers custom Ableton Live instrument racks for free download or "name your price" purchase. This document outlines all functional requirements, user flows, and technical considerations—separate from visual design.

---

## Table of Contents

1. [Goals & Objectives](#goals--objectives)
2. [User Personas](#user-personas)
3. [Core Features](#core-features)
4. [User Flows](#user-flows)
5. [Content Structure](#content-structure)
6. [Payment & Download System](#payment--download-system)
7. [Technical Requirements](#technical-requirements)
8. [Audio Preview System](#audio-preview-system)
9. [Analytics & Tracking](#analytics--tracking)
10. [Email Collection](#email-collection)
11. [Mobile Considerations](#mobile-considerations)
12. [Future Expansion](#future-expansion)
13. [Integration with Existing Site](#integration-with-existing-site)
14. [Open Questions](#open-questions)

---

## Goals & Objectives

### Primary Goals
- Offer Ableton instrument racks to the music production community
- Build an email list of engaged producers/musicians
- Establish Signal-23 as a creator of useful production tools
- Drive traffic and engagement to the main artist site

### Secondary Goals
- Generate optional revenue through "name your price" model
- Collect feedback on instruments for future development
- Create shareable content that spreads organically in producer communities

### Success Metrics
- Number of downloads
- Email signup conversion rate
- Optional payment rate and average amount
- Return visitors
- Social shares/referrals

---

## User Personas

### Persona 1: Hobbyist Producer
- **Experience:** Beginner to intermediate
- **Motivation:** Looking for free, interesting sounds to experiment with
- **Behavior:** Browses quickly, downloads anything free, may not read descriptions
- **Needs:** Easy downloads, clear compatibility info, quick previews

### Persona 2: Professional/Semi-Pro Producer
- **Experience:** Intermediate to advanced
- **Motivation:** Seeking unique sounds that stand out, willing to pay for quality
- **Behavior:** Reads descriptions, listens to all previews, checks technical specs
- **Needs:** Detailed info about what's included, high-quality previews, professional presentation

### Persona 3: Signal-23 Fan
- **Experience:** Any level
- **Motivation:** Wants to make music like Signal-23, supports the artist
- **Behavior:** Likely to pay even if free, wants connection to the artist
- **Needs:** Context about how Signal-23 uses these sounds, artist narrative

---

## Core Features

### 3.1 Instrument Rack Catalog

**Display Information per Rack:**
- Title/Name
- Short description (1-2 sentences)
- Long description (expandable or on detail view)
- Category/Type tags (e.g., "Synth", "Drums", "Ambient", "Bass", "Experimental")
- Audio preview(s)
- Compatibility information (Ableton version, any required plugins)
- File size
- Date added
- Download count (social proof)
- "Name your price" minimum (can be $0)

**Catalog Organization:**
- Filter by category/type
- Sort by: Newest, Most Popular, Alphabetical
- Search functionality (if catalog grows large)
- Grid or list view toggle (optional)

### 3.2 Audio Preview System

**Requirements:**
- Inline audio player (no page navigation required)
- Multiple preview clips per rack (if applicable)
- Waveform visualization (matches site aesthetic)
- Play/pause, scrub functionality
- Volume control
- Preview should demonstrate the rack's capabilities
- Mobile-friendly touch controls

**Preview Content Guidelines:**
- 30-60 second clips
- Show range of sounds possible with the rack
- Include both dry and processed examples where relevant
- Consider before/after comparisons

### 3.3 Download/Purchase Flow

**Free Download Option:**
1. User clicks "Download" or "Get it Free"
2. Optional: Email gate (enter email to download)
3. Download initiates automatically
4. Thank you message with suggestions for other racks

**Name Your Price Option:**
1. User clicks "Name Your Price" or similar
2. Price input appears (minimum $0, suggested amounts shown)
3. If $0: Same as free flow
4. If $X+: Redirect to payment processor OR embedded checkout
5. After payment: Download link provided + emailed
6. Thank you message

**Download Delivery:**
- Direct .zip download containing:
  - .adg file (Ableton rack)
  - README.txt with installation instructions
  - License information
  - Link back to Signal-23 site
- Optional: Hosted on CDN for fast delivery
- Track download counts

### 3.4 Email Collection

**Collection Points:**
- Pre-download gate (optional, can be skipped)
- Post-download signup prompt
- Newsletter signup in page footer/sidebar
- "Notify me of new releases" checkbox

**Email Value Proposition:**
- First access to new instrument racks
- Exclusive racks for subscribers only
- Production tips and behind-the-scenes content
- New music releases from Signal-23

**Integration Options:**
- Mailchimp
- ConvertKit
- Buttondown
- Substack

### 3.5 Individual Rack Detail View

**When user clicks on a rack, show:**
- Full description
- All audio previews
- Technical specifications
- Installation instructions
- Usage tips/suggestions
- Related racks
- Comments/feedback section (optional)
- Social share buttons

---

## User Flows

### Flow 1: Browse and Free Download

```
Landing on /instruments
    ↓
Browse catalog (filter/sort optional)
    ↓
Click on rack of interest
    ↓
Listen to preview(s)
    ↓
Click "Download Free"
    ↓
[Optional] Enter email -or- Skip
    ↓
Download starts
    ↓
See thank you + related racks
```

### Flow 2: Name Your Price Purchase

```
Landing on /instruments
    ↓
Browse catalog
    ↓
Click on rack
    ↓
Listen to preview(s)
    ↓
Click "Name Your Price"
    ↓
Enter amount ($0-$X)
    ↓
[If $0] → Free download flow
[If $X+] → Payment form (email + card)
    ↓
Process payment
    ↓
Download link displayed + emailed
    ↓
Thank you + receipt
```

### Flow 3: Discovery from External Link

```
Arrive via direct link to specific rack
    ↓
See rack detail view
    ↓
Listen to preview
    ↓
Download or purchase
    ↓
Prompted to explore more racks
    ↓
Optional: Navigate to main Signal-23 site
```

### Flow 4: Email Subscriber

```
Landing on /instruments
    ↓
See "Get notified of new releases"
    ↓
Enter email
    ↓
Confirmation message
    ↓
Continue browsing
```

---

## Content Structure

### Page Hierarchy

```
/instruments (or /racks, /tools, /downloads)
    │
    ├── Catalog view (default)
    │   ├── Featured/Hero rack
    │   ├── Filter controls
    │   ├── Rack grid/list
    │   └── Pagination (if needed)
    │
    └── /instruments/[rack-slug]
        ├── Full rack details
        ├── Previews
        ├── Download/purchase
        └── Related racks
```

### Content Blocks

**Page Header:**
- Page title
- Brief intro explaining what's offered
- Call-to-action (browse, download, support)

**Catalog Section:**
- Filter/sort controls
- Rack cards in grid or list
- Load more / pagination

**Individual Rack Card:**
- Thumbnail/visual representation
- Title
- Short description
- Category tags
- Mini audio player (play button)
- Price indicator ("Free" or "Name Your Price")
- Download count

**Rack Detail View:**
- Hero section with title and key info
- Audio preview player(s)
- Full description
- Technical specs table
- Download/purchase CTA
- Installation instructions (collapsible)
- Related racks section

**Footer/Sidebar Elements:**
- Email signup
- Link to main Signal-23 site
- Social links
- Support/tip jar link

---

## Payment & Download System

### Option A: Gumroad Integration (Recommended for Starting)

**Pros:**
- Handles payments, delivery, and receipts
- Built-in "name your price" support
- Email collection included
- Analytics dashboard
- No backend code needed

**Cons:**
- 10% fee + payment processing
- Users leave your site (or use overlay)
- Less control over experience

**Implementation:**
- Create products on Gumroad
- Embed Gumroad overlay OR link to Gumroad pages
- Can style overlay to match site somewhat
- Gumroad handles all downloads

### Option B: Stripe + Netlify Functions (More Control)

**Pros:**
- Lower fees (2.9% + $0.30 only)
- Full control over UX
- Stays on your site entirely
- Custom email sequences

**Cons:**
- Requires backend code (Netlify Functions)
- Must handle download delivery
- More complex to build and maintain
- Must handle edge cases (failed payments, etc.)

**Implementation:**
- Netlify Function for Stripe checkout session
- Webhook handler for successful payments
- Generate signed download URLs
- Email integration for receipts

### Option C: Ko-fi or Buy Me a Coffee

**Pros:**
- Simple tip jar model
- Good for "support if you want" approach
- No fees on free tier (Ko-fi)

**Cons:**
- Less professional for product sales
- Limited customization
- Separate from your site

### Option D: Hybrid Approach

- Free downloads: Direct from your site (no payment processor)
- Paid/tip: Link to Gumroad or Ko-fi
- Best of both: Low friction for free, established platform for payments

**Recommendation:** Start with **Option D (Hybrid)** or **Option A (Gumroad)** to validate demand before building custom payment infrastructure.

---

## Technical Requirements

### File Hosting

**Options:**
1. **Netlify (included):** Up to 100GB bandwidth/month on free tier
2. **Cloudflare R2:** Cheap, fast, no egress fees
3. **AWS S3 + CloudFront:** Scalable but more complex
4. **Dropbox/Google Drive:** Simple but less professional

**Recommendation:** Start with Netlify for small catalog. Move to R2/S3 if bandwidth becomes issue.

### File Specifications

**Instrument Rack Package (.zip):**
```
signal23-rack-name.zip
├── Signal23_RackName.adg          # Ableton rack file
├── Samples/                        # If rack includes samples
│   ├── sample1.wav
│   └── sample2.wav
├── README.txt                      # Installation + usage
├── LICENSE.txt                     # Usage rights
└── signal23-info.txt              # Link back to site
```

**Estimated Sizes:**
- Simple rack (no samples): 10-100 KB
- Rack with samples: 1-50 MB
- Complex multi-rack pack: 50-500 MB

### Database/Content Management

**Option A: Static JSON/Markdown (Simplest)**
- Rack data in JSON file or markdown files
- Rebuild site when adding new racks
- No backend needed

```json
// racks.json
[
  {
    "id": "dark-ambient-pad",
    "title": "Dark Ambient Pad",
    "slug": "dark-ambient-pad",
    "description": "Atmospheric pad with built-in modulation...",
    "category": ["synth", "ambient"],
    "abletonVersion": "11+",
    "requiresPlugins": false,
    "fileSize": "45 KB",
    "downloadUrl": "/downloads/dark-ambient-pad.zip",
    "previewUrls": ["/previews/dark-ambient-pad-demo.mp3"],
    "price": { "minimum": 0, "suggested": 5 },
    "dateAdded": "2024-01-15",
    "downloads": 0
  }
]
```

**Option B: Headless CMS (More Flexible)**
- Sanity, Contentful, or Strapi
- Edit content without code deploys
- Better for frequent updates
- API-based, works with static sites

**Option C: Notion as CMS**
- Use Notion database + API
- Very easy to update
- Free tier available

**Recommendation:** Start with **static JSON** for simplicity. Migrate to headless CMS if catalog grows beyond 20-30 items or you want non-technical editing.

### Download Tracking

**Simple Approach:**
- Netlify Analytics (paid) or
- Plausible/Fathom for privacy-friendly analytics
- Track download button clicks as events

**Advanced Approach:**
- Netlify Function that logs download and redirects to file
- Enables accurate download counting
- Can gate downloads (email required, etc.)

---

## Audio Preview System

### Requirements

- [ ] Play/pause functionality
- [ ] Progress bar with scrubbing
- [ ] Time display (current / total)
- [ ] Volume control (optional, can use system)
- [ ] Waveform visualization (matches Signal-23 aesthetic)
- [ ] Multiple tracks per rack (if applicable)
- [ ] Mobile touch-friendly
- [ ] Keyboard accessible
- [ ] Doesn't conflict with existing site audio

### Technical Options

**Option A: Native HTML5 Audio + Custom UI**
- Full control over appearance
- Lightweight
- Build waveform with canvas or SVG

**Option B: Wavesurfer.js**
- Popular waveform library
- Customizable appearance
- ~50KB additional bundle size
- Good accessibility

**Option C: Howler.js**
- Robust audio library
- Good for complex audio needs
- No built-in waveform

**Option D: Extend Existing AudioPlayer**
- Your site already has audio infrastructure
- Could adapt `AudioStreamer` and `useAudio` hook
- Maintains consistency

**Recommendation:** Extend existing audio system or use **Wavesurfer.js** for waveform visualization that matches the glitchy aesthetic.

### Preview File Specs

- Format: MP3 (broad compatibility) or AAC
- Bitrate: 192-256 kbps (good quality, reasonable size)
- Length: 30-90 seconds per preview
- Loudness: Normalized to -14 LUFS (streaming standard)

---

## Analytics & Tracking

### Key Metrics to Track

**Acquisition:**
- Page views (total, unique)
- Traffic sources (referrers, social, direct)
- Search terms (if organic traffic)

**Engagement:**
- Time on page
- Scroll depth
- Preview plays (which racks, how long)
- Filter/sort usage

**Conversion:**
- Download clicks
- Download completions
- Email signups
- Payment conversions
- Average payment amount

**Retention:**
- Return visitors
- Multiple downloads per visitor

### Implementation Options

**Privacy-Friendly:**
- Plausible Analytics
- Fathom Analytics
- Netlify Analytics

**Full-Featured:**
- Google Analytics 4
- Mixpanel
- Amplitude

**Recommendation:** Start with **Plausible** or **Netlify Analytics** for simplicity and privacy. Add event tracking for downloads and preview plays.

### Event Tracking Examples

```javascript
// Track preview play
trackEvent('preview_play', { rack_id: 'dark-ambient-pad', duration: 30 })

// Track download start
trackEvent('download_start', { rack_id: 'dark-ambient-pad', price: 0 })

// Track payment
trackEvent('payment', { rack_id: 'dark-ambient-pad', amount: 5.00 })

// Track email signup
trackEvent('email_signup', { source: 'download_gate' })
```

---

## Email Collection

### Collection Strategy

**Soft Gate (Recommended):**
- Email field shown before download
- "Skip" option clearly available
- Incentive: "Get notified of new releases"
- Non-intrusive, respects user choice

**Hard Gate:**
- Email required for download
- Higher conversion, but may frustrate users
- Consider for premium/exclusive racks only

**No Gate:**
- Email signup separate from download
- Lowest friction downloads
- Rely on quality to drive signups

**Recommendation:** **Soft gate** for free downloads, **required email** for $0 "purchases" through Gumroad (they handle this).

### Email Service Integration

**Options:**
- **Mailchimp:** Free up to 500 contacts, easy setup
- **ConvertKit:** Better for creators, free up to 1000
- **Buttondown:** Simple, indie, good for newsletters
- **Substack:** If you want to write content too

### Automation Sequences

**Welcome Sequence:**
1. Immediate: Download link + thank you
2. Day 2: "How to install" + tips
3. Day 5: Related racks suggestion
4. Day 14: New release or music update

**New Release Notification:**
- Announce new racks to list
- Include preview audio if possible
- Direct link to download page

---

## Mobile Considerations

### Critical Mobile Functions

- [ ] Rack cards readable and tappable
- [ ] Audio preview works on mobile (touch play/pause)
- [ ] Download works on mobile (may save to Files app)
- [ ] Payment flow works on mobile
- [ ] Email input accessible
- [ ] Filters usable on small screens

### iOS-Specific Issues

- **Audio autoplay blocked:** Require user interaction to play
- **Download behavior:** May open in browser or save to Files
- **Touch targets:** Minimum 44x44px for tap areas

### Android-Specific

- **Downloads:** Usually go to Downloads folder
- **Chrome audio:** Generally fewer restrictions than iOS

### Responsive Breakpoints

```
Mobile:    < 640px   - Single column, stacked layout
Tablet:    640-1024px - 2-column grid
Desktop:   > 1024px  - 3-4 column grid
```

---

## Future Expansion

### Phase 2 Features (After Launch)

- **User accounts:** Track downloads, favorites, purchase history
- **Ratings/reviews:** Community feedback on racks
- **Bundles:** Purchase multiple racks at discount
- **Preset packs:** Beyond racks, include Ableton presets
- **Sample packs:** Expand to audio samples
- **Video tutorials:** How to use each rack
- **Live Twitch/YouTube integration:** Demo new racks live

### Phase 3 Features (Long-term)

- **User uploads:** Community-contributed racks
- **Affiliate program:** Share links, earn percentage
- **Subscription tier:** Monthly new racks for supporters
- **Max for Live devices:** Expand beyond instrument racks
- **DAW expansion:** Logic, FL Studio versions
- **API for other sites:** Let blogs embed your racks

### Content Expansion

- Production tutorials using the racks
- Behind-the-scenes of rack creation
- Collaboration with other artists
- Genre-specific rack collections

---

## Integration with Existing Site

### Navigation

**Option A: Top Nav Addition**
- Add "Instruments" or "Downloads" to existing nav
- Consistent with current site structure

**Option B: Separate Section**
- Sub-domain: instruments.signal-23.com
- Distinct but linked experience

**Option C: Terminal Command**
- Add `instruments` command to terminal
- Lists available racks in terminal style
- Links out to download page

**Recommendation:** **Option A + C** - Add to main nav AND make it accessible via terminal for immersion.

### Visual Consistency

The instruments page should:
- Use same color palette (dark, neon accents)
- Incorporate glitch/distortion effects
- Use existing typography (Neo Brutalist fonts)
- Match the dystopian/number station aesthetic
- Consider: Racks presented as "intercepted transmissions" or "decoded signals"

### Audio System Integration

- Reuse existing `useAudio` hook patterns
- Preview audio should work alongside main site audio
- Consider: Stop main audio when previewing racks

### Routing

```javascript
// In App.tsx, add route:
<Route path="/instruments" element={<InstrumentsPage />} />
<Route path="/instruments/:slug" element={<InstrumentDetail />} />
```

---

## Open Questions

### Business/Strategy

1. **Pricing strategy:** All free? Suggested prices? Some premium?
2. **Exclusivity:** Any racks exclusive to email subscribers?
3. **Release cadence:** How often will new racks be added?
4. **Licensing:** Can users use racks in commercial releases?
5. **Branding:** Should racks be branded "Signal-23" or separate identity?

### Technical

1. **Email service:** Which provider to use?
2. **Payment processor:** Gumroad vs Stripe vs other?
3. **Analytics:** Privacy-friendly or full-featured?
4. **Hosting:** Keep on Netlify or separate CDN for files?
5. **CMS:** Static JSON vs headless CMS?

### Content

1. **Launch catalog size:** How many racks for initial launch?
2. **Preview production:** Who creates the audio demos?
3. **Documentation:** How detailed should installation guides be?
4. **Support:** How to handle user questions/issues?

### Design (For Your Design AI)

1. How should racks be visually represented? (Thumbnails? Abstract art? Screenshots?)
2. Should the page feel like browsing a store, a gallery, or something else?
3. How prominent should the "name your price" element be?
4. Should there be a "featured" or "new" section?
5. How to balance the artistic aesthetic with usability?

---

## Summary

### MVP (Minimum Viable Product)

For initial launch, implement:

- [ ] Catalog page with 3-5 instrument racks
- [ ] Basic filtering by category
- [ ] Audio preview for each rack
- [ ] Free download option (soft email gate)
- [ ] Gumroad integration for "name your price"
- [ ] Mobile-responsive design
- [ ] Basic analytics tracking
- [ ] Navigation link from main site

### Nice-to-Have for V1

- [ ] Waveform visualization in previews
- [ ] Download counter display
- [ ] Related racks suggestions
- [ ] Terminal command integration
- [ ] Social share buttons

### Post-Launch Priorities

- [ ] Email automation sequences
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Additional rack releases
- [ ] Community building

---

## Appendix

### Example Rack Categories

- **Synths:** Pads, leads, bass, keys
- **Drums:** Kits, percussion, processed
- **Ambient:** Textures, atmospheres, drones
- **FX:** Risers, impacts, transitions
- **Experimental:** Glitch, noise, unconventional
- **Vocal:** Processing chains, vocoder setups

### Competitor/Inspiration Research

Consider researching these for UX inspiration:
- Splice (sample marketplace)
- Output (Arcade, instruments)
- Native Instruments (Komplete)
- Bandcamp (name your price model)
- Gumroad creator pages
- itch.io (indie game/asset sales)

### Ableton Rack File Types

- `.adg` - Instrument or audio effect rack
- `.adv` - Drum rack
- `.als` - Full Live set (could include for context)
- `.alp` - Live pack (for bundled content)

---

*Document Version: 1.0*
*Created: January 2025*
*For: Signal-23 Instrument Racks Page*
