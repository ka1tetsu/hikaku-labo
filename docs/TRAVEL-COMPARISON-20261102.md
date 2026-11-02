# Travel search and recommendation changes — 2026-11-02

The main travel workflow is search → retrieved hotels → selected hotel's cross-site search → entered total-price comparison. Itinerary, world/flight search and budget tools open on demand. Existing hash links open their containing disclosure. Existing routes and supplied A8 creative HTML are retained.

## Two distinct scores

1. Retrieved Rakuten hotel plans: 100 × [0.6 × minimum first-night price / plan first-night price + 0.4 × rating/5 × reviewCount/(reviewCount+20)]. Missing ratings earn no review points; missing prices are unranked at the end. This is an explicit heuristic over the retrieved page, not a learned prediction or global optimum. Twenty is a disclosed design constant, not measured hotel quality. The first-night price is never multiplied into a fabricated full-stay price.
2. Cross-site offers: only entered, confirmed-equivalent quotes from at least two distinct providers qualify. Cash payable = base + additional taxes + extras − immediate discount. Price score = minimum cash / cash; flexibility score = 1 − cancellation fee / cash at the user-selected common cancellation date/time. Balanced weights 80/20; flexible 50/50; price 100/0. Zero-cost quotes receive a price score of 1. If any cancellation fee is absent/invalid or the common date is invalid, the entire pool uses explicitly labelled price-only ranking. Fees cannot exceed the payable amount. Later points and affiliate commissions do not affect order.

Changing lodging/date/party resets quotes. Changing the cancellation date resets fees and confirmation. Filters reset when a new hotel query starts. Editing check-in advances check-out when needed. Entered rates and trip conditions are not included in analytics.

## Actual data limitations

The supplied page reports `site_registration_rejected` from Rakuten. UI changes cannot repair the app's allowed-website registration. The server already sends the production Origin and Referer; no alternate origin or identity is substituted. Live automatic hotel results remain blocked until the operator's matching app ID/access key/allowed website/API permissions work. External searches and entered comparisons remain available after an API failure. Other providers do not yet supply licensed live rate feeds here; they must not be presented as automatically fetched quotes.

Google is used through explicit external search/map links containing the selected hotel and supported query terms. No scraping, snippet-to-price extraction, or search-position quality score. Google Custom Search JSON API is closed to new customers, and existing users must migrate by 2027-01-01: https://developers.google.com/custom-search/v1/overview . Official current Rakuten endpoints checked: https://webservice.rakuten.co.jp/documentation/keyword-hotel-search and https://webservice.rakuten.co.jp/documentation/vacant-hotel-search .

## Verification

Unit tests cover score arithmetic, review sample confidence, absent data, invalid fees/dates, zero totals, provider diversity, confirmed conditions, and commission/points independence. Browser QA exercises mobile recommendation, provider comparison, chosen-hotel Google search, trip reset, optional tools and the upstream error fallback with controlled fixtures. Mocked hotel names/prices are test-only, never production fallbacks.

## Integrated quote workspace

The selected hotel, dates and party are shared with one hotel-only quote workspace. Provider search actions and entered amounts appear together per provider, rather than repeating a separate provider-link directory and a flight/hotel category selector. Additional charges/discounts/points open on demand, and one common equivalent-conditions confirmation applies to the listed quotes. The compact flow initially sorts by payable price; choosing a cancellation-aware preference reveals its date and fees. Changing a provider clears that row's previous provider's amounts and confirmation. Incomplete rows remain excluded and their count is displayed. Google discovery and score details remain expandable, with no new live pricing claims.
