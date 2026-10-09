import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { Place } from '../core/models';
import { PlacesPage } from './places';

const place = (over: Partial<Place>): Place => ({
  id: 'p1',
  name: 'Milford Sound',
  region: 'Fiordland',
  description: null,
  latitude: null,
  longitude: null,
  type: 'Fjord',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('PlacesPage', () => {
  let http: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      imports: [PlacesPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PlacesPage);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  it('shows loading, then a card per place linking to /places/:id', () => {
    const fixture = setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-loading')).not.toBeNull();

    http.expectOne(`${environment.apiUrl}/places`).flush([
      place({}),
      place({ id: 'p2', name: 'Rotorua', region: 'Bay of Plenty', type: null }),
    ]);
    fixture.detectChanges();

    const cards = el.querySelectorAll('a.card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Milford Sound');
    expect(cards[0].textContent).toContain('Fiordland');
    expect(cards[0].textContent).toContain('Fjord');
    expect(cards[0].getAttribute('href')).toBe('/places/p1');
    expect(cards[1].textContent).not.toContain('·');
    expect(el.querySelector('app-loading')).toBeNull();
  });

  it('renders an image only when imageUrl is set', () => {
    const fixture = setup();
    http.expectOne(`${environment.apiUrl}/places`).flush([place({ imageUrl: '/api/uploads/a.jpg' }), place({ id: 'p2' })]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('img').length).toBe(1);
  });

  it('shows the empty state for an empty list', () => {
    const fixture = setup();
    http.expectOne(`${environment.apiUrl}/places`).flush([]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-empty-state')).not.toBeNull();
  });

  it('shows an error and retries', () => {
    const fixture = setup();
    http.expectOne(`${environment.apiUrl}/places`).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-error-alert')).not.toBeNull();

    el.querySelector<HTMLButtonElement>('button.retry')!.click();
    http.expectOne(`${environment.apiUrl}/places`).flush([place({})]);
    fixture.detectChanges();
    expect(el.querySelectorAll('a.card').length).toBe(1);
  });
});
