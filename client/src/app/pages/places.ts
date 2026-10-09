import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ApiService } from '../core/api/api.service';
import { Place } from '../core/models';
import { EmptyState } from '../shared/empty-state';
import { ErrorAlert } from '../shared/error-alert';
import { Loading } from '../shared/loading';

@Component({
  selector: 'app-places',
  imports: [RouterLink, RouterOutlet, Loading, ErrorAlert, EmptyState],
  templateUrl: './places.html',
  styleUrl: './places.scss',
})
export class PlacesPage {
  private readonly api = inject(ApiService);

  readonly places = signal<Place[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly panelOpen = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.get<Place[]>('/places').subscribe({
      next: (places) => {
        this.places.set(places);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
