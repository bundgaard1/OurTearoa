import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../core/api/api.service';
import { AuthStore } from '../core/auth/auth.store';
import { ApiError, Review, ReviewInput } from '../core/models';

@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './review-form.html',
  styleUrl: './review-form.scss',
})
export class ReviewForm {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthStore);

  readonly placeId = input.required<string>();
  readonly created = output<Review>();

  readonly ratings = [1, 2, 3, 4, 5];
  readonly form = inject(FormBuilder).nonNullable.group({
    rating: [0, [Validators.min(1), Validators.max(5)]],
    comment: [''],
  });
  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  setRating(value: number): void {
    this.form.controls.rating.setValue(value);
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }
    const { rating, comment } = this.form.getRawValue();
    const body: ReviewInput = { placeId: this.placeId(), rating };
    if (comment.trim() !== '') {
      body.comment = comment.trim();
    }
    this.pending.set(true);
    this.api.post<Review>('/reviews', body).subscribe({
      next: (review) => {
        this.pending.set(false);
        this.submitted.set(false);
        this.form.reset({ rating: 0, comment: '' });
        this.created.emit(review);
      },
      error: (err: HttpErrorResponse) => {
        this.pending.set(false);
        this.error.set(
          err.status === 404
            ? 'This place no longer exists.'
            : ((err.error as ApiError | null)?.error ?? 'Could not reach the server. Try again.'),
        );
      },
    });
  }
}
