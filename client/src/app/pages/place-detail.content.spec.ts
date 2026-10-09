import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environment';
import { Place } from '../core/models';
import { PlaceDetailPage } from './place-detail';

const full: Place = {
  id: 'p1',
  name: 'Milford Sound',
  region: 'Fiordland',
  description: 'A fjord.',
  latitude: -44.67,
  longitude: 167.92,
  type: 'Fjord',
  imageUrl: '/api/uploads/m.jpg',
  createdAt: '',
  updatedAt: '',
};

describe('PlaceDetailPage content', () => {
  let http: HttpTestingController;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function setup() {
    params = new BehaviorSubject(convertToParamMap({ id: 'p1' }));
    TestBed.configureTestingModule({
      imports: [PlaceDetailPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PlaceDetailPage);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  it('renders a full place', () => {
    const fixture = setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-loading')).not.toBeNull();
    http.expectOne(`${environment.apiUrl}/places/p1`).flush(full);
    fixture.detectChanges();
    expect(el.querySelector('h2')?.textContent).toBe('Milford Sound');
    expect(el.textContent).toContain('Fiordland');
    expect(el.textContent).toContain('Fjord');
    expect(el.textContent).toContain('A fjord.');
    expect(el.textContent).toContain('-44.67, 167.92');
    expect(el.querySelector('img')?.getAttribute('src')).toBe('/api/uploads/m.jpg');
    expect(el.querySelector('app-place-map')).not.toBeNull();
    expect(el.querySelector('app-place-reviews')).not.toBeNull();
    http.expectOne(`${environment.apiUrl}/places/p1/reviews`).flush([]);
  });

  it('renders a sparse place without breaking', () => {
    const fixture = setup();
    http
      .expectOne(`${environment.apiUrl}/places/p1`)
      .flush({ ...full, description: null, latitude: null, longitude: null, type: null, imageUrl: null });
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/places/p1/reviews`).flush([]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toBe('Milford Sound');
    expect(el.querySelector('.description')).toBeNull();
    expect(el.querySelector('.coords')).toBeNull();
    expect(el.querySelector('app-place-map')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.meta')?.textContent).not.toContain('·');
  });

  it('shows the error state on a 404', () => {
    const fixture = setup();
    http
      .expectOne(`${environment.apiUrl}/places/p1`)
      .flush({ error: 'Place not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-error-alert')?.textContent).toContain('could not be found');
    expect(el.querySelector('h2')).toBeNull();
  });

  it('loads the new place when the id changes', () => {
    const fixture = setup();
    http.expectOne(`${environment.apiUrl}/places/p1`).flush(full);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/places/p1/reviews`).flush([]);
    params.next(convertToParamMap({ id: 'p2' }));
    http.expectOne(`${environment.apiUrl}/places/p2`).flush({ ...full, id: 'p2', name: 'Rotorua' });
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/places/p2/reviews`).flush([]);
    expect((fixture.nativeElement as HTMLElement).querySelector('h2')?.textContent).toBe('Rotorua');
  });
});
