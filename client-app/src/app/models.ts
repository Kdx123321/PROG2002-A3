/**
 * @file models.ts
 * @description Data models shared by all client-app components.
 *              Shapes match exactly what the Express API returns.
 */

/** One event category (lookup table). */
export interface Category {
  category_id: number;
  name: string;
}

/**
 * A registration as shown on the PUBLIC event detail page.
 * Contact details (email/phone) are admin-only and never exposed here.
 */
export interface Registration {
  registration_id: number;
  full_name: string;
  registration_date: string;
  tickets: number;
}

/**
 * An event row as returned by the API (e.* plus joined aliases).
 * DECIMAL columns come back as strings, so prices use string.
 */
export interface EventItem {
  event_id: number;
  organisation_id: number;
  category_id: number;
  name: string;
  short_description: string;
  full_description: string;
  purpose: string;
  event_date: string;
  location: string;
  city: string;
  ticket_price: string;
  ticket_info: string;
  fundraising_goal: string;
  funds_raised: string;
  image_url: string;          // e.g. "images/fun-run.jpg"
  latitude: string;
  longitude: string;
  status: 'active' | 'suspended';
  category: string;           // joined from the category table
  organisation: string;       // joined from the organisation table
  event_status: 'past' | 'upcoming';  // derived by the API from event_date
}

/** Full event detail: the event row plus its registrations. */
export interface EventDetail extends EventItem {
  registrations: Registration[];
}
