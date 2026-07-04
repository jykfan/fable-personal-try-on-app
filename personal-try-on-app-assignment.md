# Assignment: Personal Try-On App

## Concept
A standalone web app where a user uploads photos of themselves, then browses a "new arrivals" catalog pulled from real fashion retailers and generates images of themselves wearing selected items.

## Core Flow
1. User uploads two photos: a clear headshot (required) and an optional full-body shot.
2. User is shown a "new arrivals" collection sourced from the retailer list below.
3. User selects an item and generates an image of themselves wearing it.
4. User can view, save, or compare multiple generated looks.
5. User can click "Shop this look" (or similar) on a generated image — this doesn't need to complete a real purchase, but should fire a tracked event capturing which item, from which brand, and which generated look prompted it.

## Retailers to Support
Women's new arrivals is the primary focus:

- Madewell — https://www.madewell.com/womens/new/new-arrivals/
- Sézane — https://www.sezane.com/us-en/new-in
- Everlane — https://www.everlane.com/collections/womens-new-arrivals
- Anthropologie — https://www.anthropologie.com/new-clothes
- Aritzia — https://www.aritzia.com/us/en/new
- Net-a-Porter — https://www.net-a-porter.com/en-us/shop/new-in
- Lanvin — https://us.lanvin.com/collections/women-new-in

Fable may supplement with other new-arrivals sources if useful, and should add menswear support if it doesn't meaningfully increase scope.

## Open to Fable's Judgment
- **Image generation approach:** Justify the tradeoff between realism, complexity, and latency/cost, given the "minimal setup, no paid keys" constraint.
- **Catalog sourcing mechanism:** Live scrape vs. curated snapshot vs. user-provided URL/buttons, and fallback behavior when a source can't be fetched. Reason through the fragility tradeoff; simple form-button selection from the list above is an acceptable fallback if scraping proves too fragile.
- **Menswear support:** whether/how to extend.
- **Purchase-click event capture:** how events are stored (in-memory/logged is fine for the demo), but the data shape should resemble what a real affiliate/commission program would need.

## Constraints
- Must be deployable with minimal setup and reachable via a public URL without the grader providing any credentials.
- If a free-tier API key is used, document it clearly; the system should degrade gracefully if a rate limit is hit.
- **Future-proofing:** The image-generation layer should be architected so a paid API key (e.g., supplied later by a brand partner such as Madewell) can be swapped in via config, with documentation of what quality/volume improvement it would unlock.
- Single-user session is fine — no auth/accounts required unless Fable thinks it's warranted.
- No real payment processing — "purchase" is a tracked click event, not a real transaction.
- Privacy: uploaded photos shouldn't persist beyond the session unless clearly disclosed.

## Deliverables
- Working, deployable demo (public URL).
- Short writeup covering:
  - Technical approach taken and why.
  - What was descoped.
  - Sourcing mechanism chosen.
  - How the paid-API upgrade path works.
  - How the purchase-tracking data could feed a future commission model.
