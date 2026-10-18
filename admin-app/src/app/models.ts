/**
 * @file models.ts
 * @description Data models for the admin site. Event shapes match what the
 *              /api/admin endpoints return; EventPayload is what the
 *              create/update forms send back.
 */

/** One event category (lookup table). */
export interface Category {
  category_id: number;
  name: string;
}

/** Full registration record - unlike the public site, admin sees contacts. */
export interface AdminRegistration {
  registration_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  registration_date: string;
  tickets: number;
}

/**
 * An event row as returned by the /api/admin endpoints (e.* plus joined
 * aliases). DECIMAL columns come back as strings, so money fields are string.
 */
export interface AdminEvent {
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
  image_url: string;
  latitude: string;
  longitude: string;
  status: 'active' | 'suspended';
  category: string;
  organisation: string;
  event_status: 'past' | 'upcoming';
  registrations?: AdminRegistration[];
}

/** Shape sent to POST/PUT /api/admin/events (numbers for money fields). */
export interface EventPayload {
  organisation_id: number;
  category_id: number;
  name: string;
  short_description?: string;
  full_description?: string;
  purpose?: string;
  event_date: string;
  location: string;
  city: string;
  ticket_price: number;
  ticket_info?: string;
  fundraising_goal?: number;
  funds_raised?: number;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  status?: 'active' | 'suspended';
}
