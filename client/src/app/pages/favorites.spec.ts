import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { Favorite } from '../core/models';
import { FavoritesPage } from './favorites';

const url = `${environment.apiUrl}/favorites`;

const favorite = (over: Partial<Favorite>): Favorite => ({
  id: 'f1',
  placeId: 'p1',
  userId: 'u1',
  createdAt: '2026-03-04T10:00:00.000Z',
  place: {
    id: 'p1',
    name: 'Milford Sound',
    region: 'Fiordland',
    description: null,
    latitude: null,
    longitude: null,
    type: null,
    createdAt: '',
    updatedAt: '',
  },
  ...over,
});

describe('FavoritesPage', () => {
  let http: HttpTestingController;

  function setup() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FavoritesPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(FavoritesPage);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  it('shows a row per favourite with a link and region · type', () => {
    const fixture = setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-loading')).not.toBeNull();

    http
      .expectOne(url)
      .flush([
        favorite({ place: { ...favorite({}).place, type: 'Fjord' } }),
        favorite({ id: 'f2', placeId: 'p2', place: { ...favorite({}).place, id: 'p2', name: 'Rotorua', region: 'Bay of Plenty', type: null } }),
      ]);
    fixture.detectChanges();

    const rows = el.querySelectorAll('li.row');
    expect(rows.length).toBe(2);
    expect(el.querySelector('app-loading')).toBeNull();
    const first = rows[0].querySelector<HTMLAnchorElement>('a.name')!;
    expect(first.textContent).toContain('Milford Sound');
    expect(first.getAttribute('href')).toBe('/places/p1');
    expect(rows[0].textContent).toContain('Fiordland · Fjord');
    expect(rows[1].textContent).not.toContain('·');
  });

  it('shows the empty state with a browse link', () => {
    const fixture = setup();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const empty = el.querySelector('app-empty-state')!;
    expect(empty.textContent).toContain('You have no favourites yet.');
    const browse = empty.querySelector<HTMLAnchorElement>('a[href="/places"]')!;
    expect(browse.textContent).toContain('Browse places');
  });

  it('removes a favourite and drops the row', () => {
    const fixture = setup();
    http
      .expectOne(url)
      .flush([favorite({}), favorite({ id: 'f2', placeId: 'p2', place: { ...favorite({}).place, id: 'p2', name: 'Rotorua' } })]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const remove = el.querySelectorAll<HTMLButtonElement>('button.remove')[0];
    remove.click();
    const req = http.expectOne(`${url}/f1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    const rows = el.querySelectorAll('li.row');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Rotorua');
  });

  it('shows an error and retries', () => {
    const fixture = setup();
    http.expectOne(url).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const alert = el.querySelector('app-error-alert');
    expect(alert?.textContent).toContain('Could not load favourites.');

    alert!.querySelector<HTMLButtonElement>('button.retry')!.click();
    http.expectOne(url).flush([favorite({})]);
    fixture.detectChanges();
    expect(el.querySelectorAll('li.row').length).toBe(1);
  });
});
