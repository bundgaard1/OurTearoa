import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-place-detail',
  imports: [RouterLink],
  template: `
    <aside class="panel" aria-label="Place detail">
      <a class="close" routerLink="/places" aria-label="Close">Close</a>
    </aside>
  `,
  styleUrl: './place-detail.scss',
})
export class PlaceDetailPage {}
