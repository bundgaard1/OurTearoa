import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { Favorite } from '../core/models';
import { FavoriteToggle } from './favorite-toggle';

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

describe('FavoriteToggle', () => {
  let http: HttpTestingController;

  function setup(loggedIn = true) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FavoriteToggle],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    if (loggedIn) {
      TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    }
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(FavoriteToggle);
    fixture.componentRef.setInput('placeId', 'p1');
    fixture.detectChanges();
    return fixture;
  }

  const button = (fixture: ReturnType<typeof setup>) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button.favorite-toggle');

  afterEach(() => http.verify());

  it('renders nothing for anonymous users and makes no request', () => {
    const fixture = setup(false);
    expect(button(fixture)).toBeNull();
    http.expectNone(url);
  });

  it('saves then unsaves via clicks', () => {
    const fixture = setup();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    const btn = button(fixture)!;
    expect(btn.textContent).toContain('♡ Save');
    expect(btn.getAttribute('aria-pressed')).toBe('false');

    btn.click();
    const post = http.expectOne(url);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ placeId: 'p1' });
    post.flush(favorite('f1', 'p1'), { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(btn.textContent).toContain('♥ Saved');
    expect(btn.getAttribute('aria-pressed')).toBe('true');

    btn.click();
    const del = http.expectOne(`${url}/f1`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(btn.textContent).toContain('♡ Save');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('disables the button while pending', () => {
    const fixture = setup();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    const btn = button(fixture)!;
    btn.click();
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    req.flush(favorite('f1', 'p1'), { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
  });

  it('treats a 409 as a favourite via refetch and shows no error', () => {
    const fixture = setup();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    const btn = button(fixture)!;
    btn.click();
    http
      .expectOne((req) => req.method === 'POST' && req.url === url)
      .flush({ error: 'Place is already a favorite' }, { status: 409, statusText: 'Conflict' });
    http.expectOne(url).flush([favorite('f1', 'p1')]);
    fixture.detectChanges();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).toBeNull();
  });

  it('shows a short error message on other failures', () => {
    const fixture = setup();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    const btn = button(fixture)!;
    btn.click();
    http.expectOne(url).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not update favourites. Try again.');
    expect(btn.textContent).toContain('♡ Save');
  });
});
