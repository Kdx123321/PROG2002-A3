/**
 * @file app.routes.ts
 * @description Route table for the admin site. The same EventFormComponent
 *              serves both /new (create) and /edit/:id (update).
 */
import { Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { EventFormComponent } from './event-form/event-form.component';

export const routes: Routes = [
  { path: '', component: EventListComponent },
  { path: 'new', component: EventFormComponent },
  { path: 'edit/:id', component: EventFormComponent },
  { path: '**', redirectTo: '' }
];
