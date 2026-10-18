/**
 * @file event-detail.component.ts
 * @description Event detail page (Body segment): full event information,
 *              the public registration list, and a 7-day Open-Meteo
 *              weather forecast for the venue coordinates.
 */
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '../api.service';
import { EventDetail } from '../models';

/** Open-Meteo weather_code values mapped to human-readable labels. */
const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm'
};

/** One day of forecast data, flattened for the template. */
interface WeatherDay { date: string; label: string; max: number; min: number; }

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css'
})
export class EventDetailComponent implements OnInit {

  /** The event with its registrations; null until the API responds. */
  event = signal<EventDetail | null>(null);
  /** User-facing message for 404 / connection errors. */
  error = signal('');
  /** Seven forecast days for the venue; empty when weather is unavailable. */
  weatherDays = signal<WeatherDay[]>([]);

  /** Total tickets booked across all registrations of this event. */
  totalTickets = computed(() =>
    this.event()?.registrations.reduce((sum, r) => sum + r.tickets, 0) ?? 0
  );

  /**
   * @param route current route, provides the :id path parameter
   * @param api service wrapping the event and weather endpoints
   */
  constructor(private route: ActivatedRoute, private api: ApiService) {}

  /**
   * Loads the event (route param :id) and then kicks off the weather
   * request when the venue has coordinates.
   */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getEvent(id).subscribe({
      next: (data) => {
        this.event.set(data);
        const lat = data.latitude ? parseFloat(data.latitude) : null;
        const lng = data.longitude ? parseFloat(data.longitude) : null;
        if (lat !== null && lng !== null) { this.loadWeather(lat, lng); }
      },
      error: (err) => {
        this.error.set(err.status === 404
          ? 'Event not found or has been suspended.'
          : 'Failed to load the event. Is the API running on port 3000?');
      }
    });
  }

  /**
   * Requests the 7-day forecast and flattens it into WeatherDay objects.
   * @param lat - venue latitude (from the event row)
   * @param lng - venue longitude (from the event row)
   */
  loadWeather(lat: number, lng: number): void {
    this.api.getWeather(lat, lng).subscribe({
      next: (data) => {
        const daily = data.daily;
        this.weatherDays.set(daily.time.map((d: string, i: number) => ({
          date: d,
          label: WEATHER_CODES[daily.weather_code[i]] ?? 'Unknown',
          max: daily.temperature_2m_max[i],
          min: daily.temperature_2m_min[i]
        })));
      },
      error: () => { /* weather is optional, fail silently */ }
    });
  }
}
