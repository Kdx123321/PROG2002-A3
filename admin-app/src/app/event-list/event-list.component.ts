/**
 * @file event-list.component.ts
 * @description Admin page (Body): table of ALL events with status badges,
 *              edit links and delete buttons. Deletes are confirmed first,
 *              and a 409 response (event has registrations) is shown to the
 *              user instead of silently failing.
 */
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { AdminApiService } from '../admin-api.service';
import { AdminEvent } from '../models';

@Component({
  selector: 'app-event-list',
  imports: [RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css'
})
export class EventListComponent implements OnInit {

  /** Every event in the database, past events sorted last. */
  events = signal<AdminEvent[]>([]);
  /** True while the list is being (re)loaded. */
  loading = signal(true);
  /** Error message, e.g. API unreachable or a blocked delete. */
  error = signal('');
  /** Confirmation message after a successful delete. */
  notice = signal('');

  /**
   * @param api service wrapping the admin CRUD endpoints
   */
  constructor(private api: AdminApiService) {}

  /** Loads the event list when the page opens. */
  ngOnInit(): void { this.load(); }

  /** (Re)loads all events from the API into the events signal. */
  load(): void {
    this.loading.set(true);
    this.api.getEvents().subscribe({
      next: (data) => { this.events.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load events. Is the API running on port 3000?'); this.loading.set(false); }
    });
  }

  /**
   * Deletes an event after a browser confirm. When the database refuses
   * because registrations exist (HTTP 409), the server message is shown.
   * @param e - the event row the user clicked Delete on
   */
  onDelete(e: AdminEvent): void {
    if (!confirm('Delete "' + e.name + '"? This cannot be undone.')) { return; }
    this.notice.set('');
    this.error.set('');
    this.api.deleteEvent(e.event_id).subscribe({
      next: () => { this.notice.set('Event deleted.'); this.load(); },
      error: (err) => {
        this.error.set(err.status === 409
          ? (err.error?.error ?? 'Cannot delete: this event has registrations.')
          : 'Delete failed. Please try again.');
      }
    });
  }
}
