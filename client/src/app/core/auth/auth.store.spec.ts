import { TestBed } from '@angular/core/testing';

import { AuthStore } from './auth.store';

const session = { token: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } };

describe('AuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('starts logged out', () => {
    const store = TestBed.inject(AuthStore);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.token()).toBeNull();
  });

  it('setSession exposes and persists the session', () => {
    const store = TestBed.inject(AuthStore);
    store.setSession(session);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()?.name).toBe('Ann');
    expect(localStorage.getItem('ourtearoa.token')).toBe('tok');
  });

  it('restores the session from localStorage', () => {
    TestBed.inject(AuthStore).setSession(session);
    TestBed.resetTestingModule();
    const restored = TestBed.inject(AuthStore);
    expect(restored.isAuthenticated()).toBe(true);
    expect(restored.token()).toBe('tok');
  });

  it('clear removes the session everywhere', () => {
    const store = TestBed.inject(AuthStore);
    store.setSession(session);
    store.clear();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('ourtearoa.token')).toBeNull();
    expect(localStorage.getItem('ourtearoa.user')).toBeNull();
  });

  it('ignores corrupt stored data', () => {
    localStorage.setItem('ourtearoa.token', 'tok');
    localStorage.setItem('ourtearoa.user', '{not json');
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
  });
});
