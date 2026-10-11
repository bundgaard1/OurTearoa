import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../core/api/api.service';
import { AuthStore } from '../core/auth/auth.store';
import { Profile } from '../core/models';
import { ErrorAlert } from '../shared/error-alert';
import { Loading } from '../shared/loading';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, RouterLink, Loading, ErrorAlert],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfilePage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly notFound = signal(false);
  readonly confirming = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.failed.set(false);
    this.loading.set(true);
    this.api.get<Profile>('/users/me').subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.markNotFound();
          return;
        }
        this.failed.set(true);
      },
    });
  }

  askDelete(): void {
    this.deleteError.set(null);
    this.confirming.set(true);
  }

  cancelDelete(): void {
    this.confirming.set(false);
  }

  confirmDelete(): void {
    if (this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.deleteError.set(null);
    this.api.delete('/users/me').subscribe({
      next: () => {
        this.auth.clear();
        void this.router.navigate(['/places']);
      },
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        if (err.status === 404) {
          this.markNotFound();
          return;
        }
        this.deleteError.set('Could not delete your account. Try again.');
      },
    });
  }

  private markNotFound(): void {
    this.profile.set(null);
    this.confirming.set(false);
    this.notFound.set(true);
    this.auth.clear();
  }
}
