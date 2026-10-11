import { Component, OnInit, inject, input } from '@angular/core';

import { AuthStore } from '../core/auth/auth.store';
import { FavoritesStore } from '../core/favorites/favorites.store';

@Component({
  selector: 'app-favorite-toggle',
  template: `
    @if (auth.isAuthenticated()) {
      <button
        type="button"
        class="favorite-toggle"
        [attr.aria-pressed]="store.isFavorite(placeId())"
        [disabled]="store.isPending(placeId())"
        (click)="store.toggle(placeId())"
      >
        {{ store.isFavorite(placeId()) ? '♥ Saved' : '♡ Save' }}
      </button>
      @if (store.hasError(placeId())) {
        <p class="toggle-error" role="alert">Could not update favourites. Try again.</p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      margin-top: var(--space-2);
    }

    .favorite-toggle {
      background: transparent;
      color: var(--color-primary);
      border-color: var(--color-primary);
    }

    .favorite-toggle[aria-pressed='true'] {
      background: var(--color-primary);
      color: var(--color-primary-contrast);
    }

    .toggle-error {
      margin: var(--space-1) 0 0;
      color: var(--color-error);
      font-size: 0.85rem;
    }
  `,
})
export class FavoriteToggle implements OnInit {
  protected readonly store = inject(FavoritesStore);
  protected readonly auth = inject(AuthStore);
  readonly placeId = input.required<string>();

  ngOnInit(): void {
    this.store.ensureLoaded();
  }
}
