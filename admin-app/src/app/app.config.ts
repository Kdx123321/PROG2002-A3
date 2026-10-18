/**
 * @file app.config.ts
 * @description Application-level providers: zoneless change detection with
 *              signals, the router, and the HTTP client.
 */
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes), provideHttpClient()]
};
