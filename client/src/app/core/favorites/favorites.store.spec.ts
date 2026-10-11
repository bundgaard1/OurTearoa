import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';
import { Favorite } from '../models';
import { FavoritesStore } from './favorites.store';

const url = `${environment.apiUrl}/favorites`;

const favorite = (id: string, placeId: string): Favorite => ({
  id,
  placeId,
  userId: 'u1',
  createdAt: '2026-03-04T10:00:00.000Z',
  place: {
    id: placeId,
    name: `Place ${placeId}`,
    region: 'Fiordland',
    description: null,
    latitude: null,
    longitude: null,
    type: null,
    createdAt: '',
    updatedAt: '',
  },
});

describe('FavoritesStore', () => {
  let http: HttpTestingController;
  let store: FavoritesStore;
  let auth: AuthStore;

  function setup() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthStore);
    auth.setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    store = TestBed.inject(FavoritesStore);
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('dedupes ensureLoaded so many toggles cause a single GET', () => {
    setup();
    store.ensureLoaded();
    store.ensureLoaded();
    http.expectOne(url).flush([favorite('f1', 'p1')]);
    expect(store.favorites().length).toBe(1);
    store.ensureLoaded();
    http.expectNone(url);
  });

  it('adds a favourite via POST on 201', () => {
    setup();
    store.ensureLoaded();
    http.expectOne(url).flush([]);
    store.toggle('p9');
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ placeId: 'p9' });
    req.flush(favorite('f9', 'p9'), { status: 201, statusText: 'Created' });
    expect(store.isFavorite('p9')).toBe(true);
    expect(store.favorites().map((f) => f.placeId)).toEqual(['p9']);
  });

  it('treats a 409 as already favourited and refetches without an error', () => {
    setup();
    store.ensureLoaded();
    http.expectOne(url).flush([]);
    store.toggle('p1');
    http
      .expectOne((req) => req.method === 'POST' && req.url === url)
      .flush({ error: 'Place is already a favorite' }, { status: 409, statusText: 'Conflict' });
    http.expectOne(url).flush([favorite('f1', 'p1')]);
    expect(store.isFavorite('p1')).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('removes a favourite via DELETE on 204', () => {
    setup();
    store.ensureLoaded();
    http.expectOne(url).flush([favorite('f1', 'p1')]);
    store.toggle('p1');
    const req = http.expectOne(`${url}/f1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(store.isFavorite('p1')).toBe(false);
    expect(store.favorites()).toEqual([]);
  });

  it('treats a 404 on remove as already removed', () => {
    setup();
    store.ensureLoaded();
    http.expectOne(url).flush([favorite('f1', 'p1')]);
    store.remove('f1');
    http.expectOne(`${url}/f1`).flush({ error: 'Favorite not found' }, { status: 404, statusText: 'Not Found' });
    expect(store.isFavorite('p1')).toBe(false);
  });

  it('hides the list after logout and for another user', () => {
    setup();
    store.ensureLoaded();
    http.expectOne(url).flush([favorite('f1', 'p1')]);
    expect(store.favorites().length).toBe(1);
    auth.clear();
    expect(store.favorites()).toEqual([]);
    auth.setSession({ token: 't2', user: { id: 'u2', email: 'b@c.d', name: 'Ben' } });
    expect(store.favorites()).toEqual([]);
  });

  it('marks the place as pending while removing and keys errors by place', () => {
    setup();
    store.load();
    http.expectOne(url).flush([favorite('f1', 'p1'), favorite('f2', 'p2')]);
    store.remove('f1');
    expect(store.isPending('p1')).toBe(true);
    expect(store.isPending('p2')).toBe(false);
    http.expectOne(`${url}/f1`).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    expect(store.isPending('p1')).toBe(false);
    expect(store.hasError('p1')).toBe(true);
    expect(store.hasError('p2')).toBe(false);
    expect(store.isFavorite('p1')).toBe(true);
  });
});
