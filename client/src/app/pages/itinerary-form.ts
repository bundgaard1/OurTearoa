import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../core/api/api.service';
import { AuthStore } from '../core/auth/auth.store';
import { ApiError, ItineraryEntry, ItineraryInput } from '../core/models';

function endNotBeforeStart(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startDate')?.value as string;
  const end = control.get('endDate')?.value as string;
  if (start && end && end < start) {
    return { dateRange: true };
  }
  return null;
}

@Component({
  selector: 'app-itinerary-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './itinerary-form.html',
  styleUrl: './itinerary-form.scss',
})
export class ItineraryForm {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthStore);

  readonly placeId = input.required<string>();
  readonly entry = input<ItineraryEntry | null>(null);
  readonly created = output<ItineraryEntry>();
  readonly updated = output<ItineraryEntry>();
  readonly cancelled = output<void>();

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      note: [''],
    },
    { validators: endNotBeforeStart },
  );
  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  constructor() {
    effect(() => {
      const existing = this.entry();
      if (existing) {
        this.form.setValue({
          startDate: existing.startDate.slice(0, 10),
          endDate: existing.endDate.slice(0, 10),
          note: existing.note ?? '',
        });
      }
    });
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    this.success.set(false);
    if (this.form.invalid) {
      return;
    }
    const { startDate, endDate, note } = this.form.getRawValue();
    const existing = this.entry();
    const trimmed = note.trim();
    this.pending.set(true);
    if (existing) {
      const body: Partial<ItineraryInput> = {};
      if (startDate !== existing.startDate.slice(0, 10)) {
        body.startDate = startDate;
      }
      if (endDate !== existing.endDate.slice(0, 10)) {
        body.endDate = endDate;
      }
      const nextNote = trimmed === '' ? null : trimmed;
      if (nextNote !== (existing.note ?? null)) {
        body.note = nextNote;
      }
      if (Object.keys(body).length === 0) {
        this.pending.set(false);
        this.submitted.set(false);
        this.cancelled.emit();
        return;
      }
      this.api.put<ItineraryEntry>(`/itinerary/${encodeURIComponent(existing.id)}`, body).subscribe({
        next: (updated) => {
          this.pending.set(false);
          this.submitted.set(false);
          this.updated.emit(updated);
        },
        error: (err: HttpErrorResponse) => this.fail(err, true),
      });
      return;
    }
    const body: ItineraryInput = { placeId: this.placeId(), startDate, endDate };
    if (trimmed !== '') {
      body.note = trimmed;
    }
    this.api.post<ItineraryEntry>('/itinerary', body).subscribe({
      next: (created) => {
        this.pending.set(false);
        this.submitted.set(false);
        this.form.reset({ startDate: '', endDate: '', note: '' });
        this.success.set(true);
        this.created.emit(created);
      },
      error: (err: HttpErrorResponse) => this.fail(err, false),
    });
  }

  private fail(err: HttpErrorResponse, editing: boolean): void {
    this.pending.set(false);
    this.error.set(
      err.status === 404
        ? editing
          ? 'This itinerary entry no longer exists.'
          : 'This place no longer exists.'
        : ((err.error as ApiError | null)?.error ?? 'Could not reach the server. Try again.'),
    );
  }
}
