import { Injectable, computed, signal } from '@angular/core';

import { AuthResponse, User } from '../models';

const TOKEN_KEY = 'ourtearoa.token';
const USER_KEY = 'ourtearoa.user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null && this._user() !== null);

  constructor() {
    this.restore();
  }

  setSession(response: AuthResponse): void {
    this._token.set(response.token);
    this._user.set(response.user);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  clear(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private restore(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (!token || !rawUser) {
      return;
    }
    try {
      this._user.set(JSON.parse(rawUser) as User);
      this._token.set(token);
    } catch {
      this.clear();
    }
  }
}
