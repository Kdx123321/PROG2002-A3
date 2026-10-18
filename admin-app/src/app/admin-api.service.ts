/**
 * @file admin-api.service.ts
 * @description Injectable service wrapping the admin CRUD endpoints of the
 *              charity-events REST API (plus the public categories lookup).
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminEvent, Category, EventPayload } from './models';

/** Base URL of the Express API (same API the client site uses). */
const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AdminApiService {

  /**
   * @param http Angular HttpClient, provided in app.config.ts
   */
  constructor(private http: HttpClient) {}

  /**
   * Fetches ALL events regardless of status (active, past, suspended).
   * @returns Observable of every event row
   */
  getEvents(): Observable<AdminEvent[]> {
    return this.http.get<AdminEvent[]>(API_URL + '/admin/events');
  }

  /**
   * Fetches one event including its full registration records.
   * @param id - event_id from the route
   * @returns Observable of the event with registrations attached
   */
  getEvent(id: number): Observable<AdminEvent> {
    return this.http.get<AdminEvent>(API_URL + '/admin/events/' + id);
  }

  /**
   * Inserts a new event (fields are whitelisted server-side).
   * @param payload - event data from the form
   * @returns Observable of the created event (400 if required fields missing)
   */
  createEvent(payload: EventPayload): Observable<any> {
    return this.http.post(API_URL + '/admin/events', payload);
  }

  /**
   * Updates an existing event.
   * @param id - event_id to update
   * @param payload - new event data from the form
   * @returns Observable of the update result
   */
  updateEvent(id: number, payload: EventPayload): Observable<any> {
    return this.http.put(API_URL + '/admin/events/' + id, payload);
  }

  /**
   * Deletes an event. The database refuses (409) when registrations exist.
   * @param id - event_id to delete
   * @returns Observable of the delete result
   */
  deleteEvent(id: number): Observable<any> {
    return this.http.delete(API_URL + '/admin/events/' + id);
  }

  /**
   * Fetches categories for the form drop-down.
   * @returns Observable of category rows
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(API_URL + '/categories');
  }
}
