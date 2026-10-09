import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { Place } from '../core/models';
import { PlacesPage } from './places';

const place = (id: string, name: string, region: string): Place => ({
  id,
  name,
  region,
  description: null,
  latitude: null,
  longitude: null,
  type: null,
  createdAt: '',
  updatedAt: '',
});

const all = [place('1', 'Milford Sound', 'Fiordland'), place('2', 'Rotorua', 'Bay of Plenty'), place('3', 'Doubtful Sound', 'Fiordland')];

describe('PlacesPage filters', () => {
  let http: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      imports: [PlacesPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PlacesPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${environment.apiUrl}/places` && r.params.keys().length === 0).flush(all);
    fixture.detectChanges();
    return fixture;
  }

  const select = (fixture: ReturnType<typeof setup>) =>
    (fixture.nativeElement as HTMLElement).querySelector('select') as HTMLSelectElement;

  afterEach(() => http.verify());

  it('derives region options from the API, deduplicated and sorted', () => {
    const fixture = setup();
    const options = Array.from(select(fixture).options).map((o) => o.textContent!.trim());
    expect(options).toEqual(['All regions', 'Bay of Plenty', 'Fiordland']);
  });

  it('sends ?region= when a region is chosen and keeps all options', () => {
    const fixture = setup();
    const el = select(fixture);
    el.value = 'Fiordland';
    el.dispatchEvent(new Event('change'));
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/places`);
    expect(req.request.params.get('region')).toBe('Fiordland');
    expect(req.request.params.has('q')).toBe(false);
    req.flush([all[0], all[2]]);
    fixture.detectChanges();
    expect(select(fixture).options.length).toBe(3);
  });

  it('sends ?q= for the search text', () => {
    const fixture = setup();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'milf';
    input.dispatchEvent(new Event('input'));
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/places`);
    expect(req.request.params.get('q')).toBe('milf');
    req.flush([all[0]]);
  });

  it('combines region and search', () => {
    const fixture = setup();
    const el = select(fixture);
    el.value = 'Fiordland';
    el.dispatchEvent(new Event('change'));
    http.expectOne((r) => r.url === `${environment.apiUrl}/places`).flush([all[0], all[2]]);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'doubt';
    input.dispatchEvent(new Event('input'));
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/places`);
    expect(req.request.params.get('region')).toBe('Fiordland');
    expect(req.request.params.get('q')).toBe('doubt');
    req.flush([all[2]]);
  });

  it('shows the filtered empty state, and Clear re-requests the unfiltered list', () => {
    const fixture = setup();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));
    http.expectOne((r) => r.url === `${environment.apiUrl}/places`).flush([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-empty-state')?.textContent).toContain('No places match your filters.');

    el.querySelector<HTMLButtonElement>('.filters button')!.click();
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/places`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush(all);
    fixture.detectChanges();
    expect(el.querySelectorAll('a.card').length).toBe(3);
    expect(input.value).toBe('');
  });
});
