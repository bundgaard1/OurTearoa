import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FavoritesStore } from '../core/favorites/favorites.store';
import { EmptyState } from '../shared/empty-state';
import { ErrorAlert } from '../shared/error-alert';
import { Loading } from '../shared/loading';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, Loading, ErrorAlert, EmptyState],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class FavoritesPage {
  protected readonly store = inject(FavoritesStore);

  constructor() {
    this.store.load();
  }

  retry(): void {
    this.store.load();
  }
}
