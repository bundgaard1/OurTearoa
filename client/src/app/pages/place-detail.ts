import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService } from '../core/api/api.service';
import { Place } from '../core/models';
import { ErrorAlert } from '../shared/error-alert';
import { Loading } from '../shared/loading';
import { PlaceMap } from './place-map';
import { PlaceReviews } from './place-reviews';

@Component({
  selector: 'app-place-detail',
  imports: [RouterLink, Loading, ErrorAlert, PlaceMap, PlaceReviews],
  templateUrl: './place-detail.html',
  styleUrl: './place-detail.scss',
})
export class PlaceDetailPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private request?: Subscription;
  private id = '';

  readonly place = signal<Place | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => {
      this.id = params.get('id') ?? '';
      this.load();
    });
  }

  load(): void {
    this.request?.unsubscribe();
    this.place.set(null);
    this.error.set(null);
    this.loading.set(true);
    this.request = this.api.get<Place>(`/places/${encodeURIComponent(this.id)}`).subscribe({
      next: (place) => {
        this.place.set(place);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 404 ? 'This place could not be found.' : 'Could not load this place.');
        this.loading.set(false);
      },
    });
  }
}
