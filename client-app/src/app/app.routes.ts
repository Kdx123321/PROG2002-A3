/**
 * @file app.routes.ts
 * @description Route table for the client site. Each route maps a URL path
 *              to one page component rendered inside the Body segment.
 */
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SearchComponent } from './search/search.component';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { RegisterComponent } from './register/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: SearchComponent },
  { path: 'event/:id', component: EventDetailComponent },
  { path: 'register/:id', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
