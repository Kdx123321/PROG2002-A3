/**
 * @file register.component.ts
 * @description Registration page (Body segment): form for buying tickets
 *              to one event. Handles success, duplicate-email (409) and
 *              validation (400) responses from the API.
 */
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { EventItem } from '../models';

@Component({
  selector: 'app-register',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  /** The event being registered for; null until loaded. */
  event = signal<EventItem | null>(null);
  /** Connection error while loading the event. */
  error = signal('');
  /** True when the route id does not match an active event (404). */
  notFound = signal(false);

  /** Form model bound with ngModel (plain object, not a signal). */
  form = { full_name: '', email: '', phone: '', tickets: 1 };

  /** True while the registration POST is in flight. */
  submitting = signal(false);
  /** Success message returned after a created registration. */
  successMsg = signal('');
  /** Validation / duplicate / server error message to show above the form. */
  formError = signal('');

  /**
   * @param route current route, provides the :id path parameter
   * @param api service wrapping the event and registration endpoints
   */
  constructor(private route: ActivatedRoute, private api: ApiService) {}

  /** Loads the event so the page can show what the user is registering for. */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getEvent(id).subscribe({
      next: (data) => this.event.set(data),
      error: (err) => {
        this.notFound.set(err.status === 404);
        if (err.status !== 404) { this.error.set('Failed to load the event. Is the API running on port 3000?'); }
      }
    });
  }

  /** Validates and submits the registration, then surfaces the API result. */
  onSubmit(): void {
    const ev = this.event();
    if (!ev) { return; }
    this.submitting.set(true);
    this.successMsg.set('');
    this.formError.set('');
    this.api.register({
      event_id: ev.event_id,
      full_name: this.form.full_name,
      email: this.form.email,
      phone: this.form.phone || undefined,
      tickets: Number(this.form.tickets)
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMsg.set('Registration successful! See you at ' + ev.name + '.');
        this.form = { full_name: '', email: '', phone: '', tickets: 1 };
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.status === 409) {
          this.formError.set(err.error?.error ?? 'This email is already registered for this event.');
        } else if (err.status === 400) {
          this.formError.set(err.error?.error ?? 'Please check the form: all required fields must be valid.');
        } else {
          this.formError.set('Registration failed. Please try again later.');
        }
      }
    });
  }
}
