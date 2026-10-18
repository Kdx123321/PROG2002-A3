/**
 * @file home.component.ts
 * @description Public landing page: hero banner plus a card grid of every
 *              active charity event (upcoming first, past events last).
 */
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../api.service';
import { EventItem } from '../models';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  /** All active events, upcoming first (ordering done by the API). */
  events = signal<EventItem[]>([]);
  /** True while the first API request is still in flight. */
  loading = signal(true);
  /** User-facing message if the API cannot be reached. */
  error = signal('');

  /**
   * @param api service that wraps the /api/events endpoint
   */
  constructor(private api: ApiService) {}

  /** Loads the event list when the page opens. */
  ngOnInit(): void {
    this.api.getEvents().subscribe({
      next: (data) => { this.events.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load events. Is the API running on port 3000?'); this.loading.set(false); }
    });
  }

  /**
   * Converts the price string to a number for display.
   * @param e - event whose ticket_price should be parsed
   * @returns price as a number (MySQL DECIMAL arrives as a string)
   */
  priceNum(e: EventItem): number { return parseFloat(e.ticket_price); }

  /**
   * Past/upcoming flag derived by the API from event_date.
   * @param e - event to classify
   * @returns true if the event date has passed
   */
  isPast(e: EventItem): boolean { return e.event_status === 'past'; }
}
