import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ApiService } from '../core/api/api.service';
import { Review } from '../core/models';
import { ErrorAlert } from '../shared/error-alert';
import { Loading } from '../shared/loading';

@Component({
  selector: 'app-place-reviews',
  imports: [DatePipe, Loading, ErrorAlert],
  templateUrl: './place-reviews.html',
  styleUrl: './place-reviews.scss',
})
export class PlaceReviews {
  private readonly api = inject(ApiService);
  private request?: Subscription;

  readonly placeId = input.required<string>();

  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly count = computed(() => this.reviews().length);
  readonly average = computed(() => {
    const list = this.reviews();
    return list.length === 0 ? null : list.reduce((sum, review) => sum + review.rating, 0) / list.length;
  });

  constructor() {
    effect(() => {
      this.load(this.placeId());
    });
  }

  retry(): void {
    this.load(this.placeId());
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  private load(placeId: string): void {
    this.request?.unsubscribe();
    this.reviews.set([]);
    this.failed.set(false);
    this.loading.set(true);
    this.request = this.api.get<Review[]>(`/places/${encodeURIComponent(placeId)}/reviews`).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
