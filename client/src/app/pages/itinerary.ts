import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService } from '../core/api/api.service';
import { ItineraryEntry } from '../core/models';
import { EmptyState } from '../shared/empty-state';
import { ErrorAlert } from '../shared/error-alert';
import { Loading } from '../shared/loading';
import { ItineraryForm } from './itinerary-form';

@Component({
  selector: 'app-itinerary',
  imports: [RouterLink, Loading, ErrorAlert, EmptyState, ItineraryForm],
  providers: [DatePipe],
  templateUrl: './itinerary.html',
  styleUrl: './itinerary.scss',
})
export class ItineraryPage {
  private readonly api = inject(ApiService);
  private readonly datePipe = inject(DatePipe);
  private request?: Subscription;

  readonly entries = signal<ItineraryEntry[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.request?.unsubscribe();
    this.failed.set(false);
    this.loading.set(true);
    this.request = this.api.get<ItineraryEntry[]>('/itinerary').subscribe({
      next: (entries) => {
        this.entries.set([...entries].sort((a, b) => a.startDate.localeCompare(b.startDate)));
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  startEdit(entry: ItineraryEntry): void {
    this.actionError.set(null);
    this.editingId.set(entry.id);
  }

  stopEdit(): void {
    this.editingId.set(null);
  }

  replaceEntry(entry: ItineraryEntry): void {
    this.entries.update((list) =>
      [...list.map((item) => (item.id === entry.id ? entry : item))].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      ),
    );
    this.editingId.set(null);
  }

  remove(entry: ItineraryEntry): void {
    if (!window.confirm('Remove this entry from your itinerary?')) {
      return;
    }
    this.actionError.set(null);
    this.api.delete(`/itinerary/${encodeURIComponent(entry.id)}`).subscribe({
      next: () => this.dropEntry(entry.id),
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.dropEntry(entry.id);
          return;
        }
        this.actionError.set('Could not remove the entry. Try again.');
      },
    });
  }

  dateRange(entry: ItineraryEntry): string {
    const start = this.datePipe.transform(entry.startDate, 'mediumDate', 'UTC') ?? entry.startDate.slice(0, 10);
    const end = this.datePipe.transform(entry.endDate, 'mediumDate', 'UTC') ?? entry.endDate.slice(0, 10);
    return start === end ? start : `${start} – ${end}`;
  }

  private dropEntry(id: string): void {
    this.entries.update((list) => list.filter((item) => item.id !== id));
    if (this.editingId() === id) {
      this.editingId.set(null);
    }
  }
}
