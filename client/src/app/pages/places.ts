import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-places',
  imports: [RouterOutlet],
  template: `
    <section>
      <h1>Places</h1>
    </section>
    <router-outlet />
  `,
})
export class PlacesPage {}
