import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

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
  readonly region = signal('');
  readonly query = signal('');
  private readonly knownRegions = signal<string[]>([]);
  readonly regions = computed(() => [...this.knownRegions()].sort((a, b) => a.localeCompare(b)));
  readonly filtered = computed(() => this.region() !== '' || this.query() !== '');
  private request?: Subscription;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.request?.unsubscribe();
    this.request = this.api.get<Place[]>('/places', { region: this.region(), q: this.query().trim() }).subscribe({
      next: (places) => {
        this.places.set(places);
        const merged = new Set([...this.knownRegions(), ...places.map((place) => place.region)]);
        this.knownRegions.set([...merged]);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  setRegion(value: string): void {
    this.region.set(value);
    this.load();
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.load();
  }

  clearFilters(): void {
    this.region.set('');
    this.query.set('');
    this.load();
  }
}
