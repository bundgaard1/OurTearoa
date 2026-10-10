import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ApiService } from '../core/api/api.service';
import { AuthStore } from '../core/auth/auth.store';
import { Review } from '../core/models';
import { ErrorAlert } from '../shared/error-alert';
import { Loading } from '../shared/loading';
import { ReviewForm } from './review-form';

@Component({
  selector: 'app-place-reviews',
  imports: [DatePipe, Loading, ErrorAlert, ReviewForm],
  templateUrl: './place-reviews.html',
  styleUrl: './place-reviews.scss',
})
export class PlaceReviews {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthStore);
  private request?: Subscription;

  readonly placeId = input.required<string>();

  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

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

  addReview(review: Review): void {
    this.reviews.update((list) => [review, ...list]);
  }

  startEdit(review: Review): void {
    this.actionError.set(null);
    this.editingId.set(review.id);
  }

  stopEdit(): void {
    this.editingId.set(null);
  }

  replaceReview(review: Review): void {
    this.reviews.update((list) => list.map((item) => (item.id === review.id ? review : item)));
    this.editingId.set(null);
  }

  remove(review: Review): void {
    if (!window.confirm('Delete this review?')) {
      return;
    }
    this.actionError.set(null);
    this.api.delete(`/reviews/${encodeURIComponent(review.id)}`).subscribe({
      next: () => this.dropReview(review.id),
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.dropReview(review.id);
          return;
        }
        this.actionError.set('Could not delete the review. Try again.');
      },
    });
  }

  private dropReview(id: string): void {
    this.reviews.update((list) => list.filter((item) => item.id !== id));
    if (this.editingId() === id) {
      this.editingId.set(null);
    }
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
