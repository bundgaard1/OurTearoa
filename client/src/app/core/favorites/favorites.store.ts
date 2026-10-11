import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ApiService } from '../api/api.service';
import { AuthStore } from '../auth/auth.store';
import { Favorite } from '../models';

@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);

  private readonly _favorites = signal<Favorite[]>([]);
  private readonly _loading = signal(false);
  private readonly _failed = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly pending = signal(new Set<string>());
  private loadedForUser = '';
  private request?: Subscription;

  readonly loading = this._loading.asReadonly();
  readonly failed = this._failed.asReadonly();
  readonly error = this._error.asReadonly();

  readonly favorites = computed(() => {
    const list = this._favorites();
    const userId = this.auth.user()?.id;
    return userId !== undefined && userId === this.loadedForUser ? list : [];
  });

  isFavorite(placeId: string): boolean {
    return this.favorites().some((favorite) => favorite.placeId === placeId);
  }

  isPending(placeId: string): boolean {
    return this.pending().has(placeId);
  }

  hasError(placeId: string): boolean {
    return this._error() === placeId;
  }

  ensureLoaded(): void {
    const userId = this.auth.user()?.id;
    if (!userId || this.loadedForUser === userId || this._loading()) {
      return;
    }
    this.load();
  }

  load(): void {
    this.request?.unsubscribe();
    this._failed.set(false);
    this._loading.set(true);
    this.request = this.api.get<Favorite[]>('/favorites').subscribe({
      next: (favorites) => {
        this._favorites.set(favorites);
        this.loadedForUser = this.auth.user()?.id ?? '';
        this._loading.set(false);
      },
      error: () => {
        this._failed.set(true);
        this._loading.set(false);
      },
    });
  }

  toggle(placeId: string): void {
    if (!this.auth.isAuthenticated() || this.pending().has(placeId)) {
      return;
    }
    const favorite = this.favorites().find((item) => item.placeId === placeId);
    if (favorite) {
      this.remove(favorite.id);
    } else {
      this.add(placeId);
    }
  }

  remove(favoriteId: string): void {
    const favorite = this.favorites().find((item) => item.id === favoriteId);
    if (!favorite || this.pending().has(favorite.placeId)) {
      return;
    }
    const placeId = favorite.placeId;
    this.markPending(placeId);
    this.api.delete(`/favorites/${encodeURIComponent(favoriteId)}`).subscribe({
      next: () => {
        this.dropFavorite(favoriteId);
        this.clearPending(placeId);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.dropFavorite(favoriteId);
          this.clearPending(placeId);
          return;
        }
        this.clearPending(placeId);
        this._error.set(placeId);
      },
    });
  }

  private add(placeId: string): void {
    this.markPending(placeId);
    this.api.post<Favorite>('/favorites', { placeId }).subscribe({
      next: (favorite) => {
        this._favorites.update((list) => [favorite, ...list.filter((item) => item.placeId !== favorite.placeId)]);
        this.clearPending(placeId);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.clearPending(placeId);
          this.load();
          return;
        }
        this.clearPending(placeId);
        this._error.set(placeId);
      },
    });
  }

  private markPending(id: string): void {
    this._error.set(null);
    this.pending.update((set) => new Set(set).add(id));
  }

  private clearPending(id: string): void {
    this.pending.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  private dropFavorite(favoriteId: string): void {
    this._favorites.update((list) => list.filter((item) => item.id !== favoriteId));
  }
}
