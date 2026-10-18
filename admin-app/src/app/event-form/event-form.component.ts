/**
 * @file event-form.component.ts
 * @description Admin page (Body): create/edit form for one event, reused by
 *              the /new and /edit/:id routes. Edit mode also lists the
 *              event's registrations (read-only) below the form.
 */
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../admin-api.service';
import { AdminRegistration, Category, EventPayload } from '../models';

@Component({
  selector: 'app-event-form',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.css'
})
export class EventFormComponent implements OnInit {

  /** event_id when editing; null on the /new route. */
  editId: number | null = null;
  /** True while the existing event is being loaded for editing. */
  loading = signal(false);
  /** True while a create/update request is in flight. */
  saving = signal(false);
  /** Load/save error message shown above the form. */
  error = signal('');
  /** Success message after the save completes. */
  successMsg = signal('');
  /** Categories for the drop-down, loaded once on open. */
  categories = signal<Category[]>([]);

  /** Form model bound with ngModel (plain object, not a signal). */
  form = {
    organisation_id: 1,
    category_id: 1,
    name: '',
    short_description: '',
    full_description: '',
    purpose: '',
    event_date: '',
    location: '',
    city: 'Liuzhou',
    ticket_price: 0,
    ticket_info: '',
    fundraising_goal: 0,
    funds_raised: 0,
    image_url: 'images/fun-run.jpg',
    latitude: 24.3156,
    longitude: 109.4086,
    status: 'active' as 'active' | 'suspended'
  };

  /** Registration records of the event being edited (empty when creating). */
  registrations = signal<AdminRegistration[]>([]);

  /**
   * @param route current route; a numeric :id means edit mode
   * @param router used to go back to the list after creating
   * @param api service wrapping the admin CRUD endpoints
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: AdminApiService
  ) {}

  /**
   * Loads categories for the drop-down; in edit mode also loads the
   * event and fills the form (event_date converted for datetime-local).
   */
  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (c) => this.categories.set(c) });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = Number(idParam);
      this.loading.set(true);
      this.api.getEvent(this.editId).subscribe({
        next: (e) => {
          this.loading.set(false);
          this.form = {
            organisation_id: e.organisation_id,
            category_id: e.category_id,
            name: e.name,
            short_description: e.short_description ?? '',
            full_description: e.full_description ?? '',
            purpose: e.purpose ?? '',
            // datetime-local needs "YYYY-MM-DDTHH:mm"
            event_date: e.event_date.replace(' ', 'T').slice(0, 16),
            location: e.location,
            city: e.city,
            ticket_price: parseFloat(e.ticket_price),
            ticket_info: e.ticket_info ?? '',
            fundraising_goal: parseFloat(e.fundraising_goal),
            funds_raised: parseFloat(e.funds_raised),
            image_url: e.image_url ?? '',
            latitude: parseFloat(e.latitude),
            longitude: parseFloat(e.longitude),
            status: e.status
          };
          this.registrations.set(e.registrations ?? []);
        },
        error: () => { this.loading.set(false); this.error.set('Failed to load the event.'); }
      });
    }
  }

  /**
   * Builds the payload (empty optional strings removed) and calls the
   * matching create or update endpoint.
   */
  onSubmit(): void {
    this.saving.set(true);
    this.error.set('');
    this.successMsg.set('');

    const payload: EventPayload = { ...this.form };
    (Object.keys(payload) as (keyof EventPayload)[]).forEach((k) => {
      if (payload[k] === '') { delete payload[k]; }
    });

    const done = {
      next: () => {
        this.saving.set(false);
        this.successMsg.set(this.editId ? 'Event updated.' : 'Event created.');
        if (!this.editId) { this.router.navigate(['/']); }
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err.error?.error ?? 'Save failed. Please try again.');
      }
    };

    if (this.editId) {
      this.api.updateEvent(this.editId, payload).subscribe(done);
    } else {
      this.api.createEvent(payload).subscribe(done);
    }
  }
}
