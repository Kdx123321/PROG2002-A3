/**
 * @file app.ts
 * @description Root component (selector app-root): renders the shared
 *              Header/Nav/Footer segments and the router outlet for Body.
 */
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Liuzhou Charity Events';
}
