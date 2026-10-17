import { travelLinkConfig } from './bookingLinks.js';

// Affiliate IDs are public build-time settings (see docs/TRAVEL-AFFILIATE-LINKS.md).
export const LINK_CONFIG = travelLinkConfig(import.meta.env);
