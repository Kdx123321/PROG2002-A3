/**
 * @file search.component.ts
 * @description Search page: filter active events by date, location and
 *              category (combined with AND logic), results as event cards.
 */
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category, EventItem } from '../models';

@Component({
  selector: 'app-search',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {

  /** Categories for the drop-down, loaded once on open. */
  categories = signal<Category[]>([]);
  /** Search results; null means the user has not searched yet. */
  results = signal<EventItem[] | null>(null);
  /** True while a search request is in flight. */
  loading = signal(false);
  /** User-facing message if the search request fails. */
  error = signal('');

  /** Form model bound with ngModel (plain object, not a signal). */
  criteria = { date: '', location: '', category_id: '' as number | '' };

  /**
   * @param api service that wraps the /api/events/search endpoint
   */
  constructor(private api: ApiService) {}

  /** Loads the category list for the drop-down when the page opens. */
  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (c) => this.categories.set(c) });
  }

  /** Runs the search with the current criteria and stores the results. */
  onSearch(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.searchEvents({
      date: this.criteria.date || undefined,
      location: this.criteria.location || undefined,
      category_id: this.criteria.category_id
    }).subscribe({
      next: (data) => { this.results.set(data); this.loading.set(false); },
      error: () => { this.error.set('Search failed. Is the API running on port 3000?'); this.loading.set(false); }
    });
  }

  /**
   * Converts the price string to a number for display.
   * @param e - event whose ticket_price should be parsed
   * @returns price as a number
   */
  priceNum(e: EventItem): number { return parseFloat(e.ticket_price); }
}
