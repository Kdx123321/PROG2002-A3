/**
 * @file api.service.ts
 * @description Injectable service wrapping every HTTP call the client site
 *              needs: the charity-events REST API plus the Open-Meteo
 *              weather forecast API.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, EventDetail, EventItem, Registration } from './models';

/** Base URL of the Express API. Change this if the API runs elsewhere. */
const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {

  /**
   * @param http Angular HttpClient, provided in app.config.ts
   */
  constructor(private http: HttpClient) {}

  /**
   * Fetches every active event (public listing).
   * @returns Observable of events, past events sorted last
   */
  getEvents(): Observable<EventItem[]> {
    return this.http.get<EventItem[]>(API_URL + '/events');
  }

  /**
   * Searches active events by date, location and/or category (AND logic).
   * @param criteria - empty/undefined criteria are simply skipped
   * @returns Observable of matching events
   */
  searchEvents(criteria: { date?: string; location?: string; category_id?: number | '' }): Observable<EventItem[]> {
    let params = new HttpParams();
    if (criteria.date)        { params = params.set('date', criteria.date); }
    if (criteria.location)    { params = params.set('location', criteria.location); }
    if (criteria.category_id) { params = params.set('category_id', String(criteria.category_id)); }
    return this.http.get<EventItem[]>(API_URL + '/events/search', { params });
  }

  /**
   * Fetches all event categories for the search drop-down.
   * @returns Observable of category rows
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(API_URL + '/categories');
  }

  /**
   * Fetches one active event with its registrations.
   * @param id - event_id from the route
   * @returns Observable of the event detail (404 if missing/suspended)
   */
  getEvent(id: number): Observable<EventDetail> {
    return this.http.get<EventDetail>(API_URL + '/events/' + id);
  }

  /**
   * Submits a new registration (ticket purchase) for an event.
   * @param payload - event_id, full_name, email required; phone optional; tickets 1-10
   * @returns Observable of the created registration (409 on duplicate email)
   */
  register(payload: { event_id: number; full_name: string; email: string; phone?: string; tickets: number }): Observable<any> {
    return this.http.post(API_URL + '/registrations', payload);
  }

  /**
   * Fetches a 7-day forecast from Open-Meteo (free, no API key).
   * @param lat - venue latitude
   * @param lng - venue longitude
   * @returns Observable of the Open-Meteo daily forecast payload
   */
  getWeather(lat: number, lng: number): Observable<any> {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto';
    return this.http.get(url);
  }
}
