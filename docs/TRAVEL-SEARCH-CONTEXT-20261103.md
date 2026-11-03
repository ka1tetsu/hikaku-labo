# Reusable stay search conditions

Domestic itinerary links such as `/travel/?destination=tokyo&nights=3` now prefill the main domestic stay form. Overseas itinerary destinations are not silently used as domestic hotel queries. A submitted, valid stay search replaces the address with a whitelist of `stay_place`, `stay_checkin`, `stay_checkout`, `stay_adults`, `stay_breakfast`, and `stay_onsen`. Reopening that address restores those conditions without automatically calling the provider API. A copy-link action uses the same whitelist; it never copies prices, quote notes, arbitrary tracking parameters, or provider credentials. Form edits must be submitted before they become the shareable conditions.

Expired, impossible, duplicate, or out-of-range shared conditions clear dates/party and show re-entry guidance, instead of silently substituting another trip. Existing booking-provider links use the restored form through the existing comparison criteria. Privacy-safe analytics remain path/enum-only. This does not supply live inventory or guarantee affiliate revenue.

Verification covers exact condition round trips, domestic/overseas scope, invalid/expired links, URL field whitelist, and a mobile browser journey from itinerary link through submit, reload, and expired-link guidance. API calls are mocked, and the shared QA network isolation blocks ad/analytics traffic.
