import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { ItineraryEntry, Place } from '../core/models';
import { ItineraryPage } from './itinerary';

const place = (id: string, name: string): Place => ({
  id,
  name,
  region: 'Fiordland',
  description: null,
  latitude: null,
  longitude: null,
  type: null,
  createdAt: '',
  updatedAt: '',
});

const entry = (id: string, startDate: string, endDate: string, name: string, note: string | null): ItineraryEntry => ({
  id,
  placeId: id,
  userId: 'u1',
  startDate,
  endDate,
  note,
  createdAt: '2026-03-01T12:00:00.000Z',
  updatedAt: '2026-03-01T12:00:00.000Z',
  place: place(id, name),
});

describe('ItineraryPage', () => {
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/itinerary`;

  function setup() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ItineraryPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ItineraryPage);
    fixture.detectChanges();
    return fixture;
  }

  const items = (fixture: ReturnType<typeof setup>) =>
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('li.entry');

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('lists entries in date order with readable ranges, links and notes', () => {
    const fixture = setup();
    http.expectOne(url).flush([
      entry('p2', '2026-03-10T00:00:00.000Z', '2026-03-11T00:00:00.000Z', 'Rotorua', null),
      entry('p1', '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', 'Milford Sound', 'Take the boat'),
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const list = el.querySelectorAll('li.entry');
    expect(el.querySelector('h1')?.textContent).toBe('Itinerary');
    expect(list.length).toBe(2);
    expect(list[0].querySelector('.name')?.textContent).toBe('Milford Sound');
    expect(list[0].querySelector('.date')?.textContent).toContain('Mar 4, 2026 – Mar 6, 2026');
    expect(list[0].querySelector('.region')?.textContent).toBe('Fiordland');
    expect(list[0].querySelector('.note')?.textContent).toBe('Take the boat');
    expect(list[0].querySelector<HTMLAnchorElement>('a.name')?.getAttribute('href')).toBe('/places/p1');
    expect(list[1].querySelector('.name')?.textContent).toBe('Rotorua');
    expect(list[1].querySelector('.date')?.textContent).toContain('Mar 10, 2026');
    expect(list[1].querySelector('.note')).toBeNull();
  });

  it('shows the empty state with a link to the catalogue', () => {
    const fixture = setup();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-empty-state')?.textContent).toContain('Your itinerary is empty.');
    expect(el.querySelector('a[href="/places"]')?.textContent).toContain('Find a place to add');
  });

  it('shows an error and retries', () => {
    const fixture = setup();
    http.expectOne(url).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-error-alert')?.textContent).toContain('Could not load your itinerary.');
    el.querySelector<HTMLButtonElement>('button.retry')!.click();
    http.expectOne(url).flush([entry('p1', '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', 'Milford Sound', null)]);
    fixture.detectChanges();
    expect(el.querySelectorAll('li.entry').length).toBe(1);
  });

  it('edits inline, PUTs only the changed fields, and re-sorts the list', () => {
    const fixture = setup();
    http.expectOne(url).flush([
      entry('p2', '2026-03-10T00:00:00.000Z', '2026-03-11T00:00:00.000Z', 'Rotorua', null),
      entry('p1', '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', 'Milford Sound', 'Boat'),
    ]);
    fixture.detectChanges();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.edit')!.click();
    fixture.detectChanges();
    const form = items(fixture)[0].querySelector('app-itinerary-form')!;
    expect((form.querySelector('textarea') as HTMLTextAreaElement).value).toBe('Boat');
    const dates = form.querySelectorAll<HTMLInputElement>('input[type="date"]');
    dates[0].value = '2026-03-14';
    dates[0].dispatchEvent(new Event('input'));
    dates[1].value = '2026-03-16';
    dates[1].dispatchEvent(new Event('input'));
    form.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne(`${environment.apiUrl}/itinerary/p1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ startDate: '2026-03-14', endDate: '2026-03-16' });
    req.flush(
      entry('p1', '2026-03-14T00:00:00.000Z', '2026-03-16T00:00:00.000Z', 'Milford Sound', 'Boat'),
    );
    fixture.detectChanges();
    const list = items(fixture);
    expect(list.length).toBe(2);
    expect(list[0].querySelector('.name')?.textContent).toBe('Rotorua');
    expect(list[1].querySelector('.name')?.textContent).toBe('Milford Sound');
    expect(list[0].querySelector('app-itinerary-form')).toBeNull();
  });

  it('asks for confirmation and does nothing when declined', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fixture = setup();
    http.expectOne(url).flush([entry('p1', '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', 'Milford Sound', null)]);
    fixture.detectChanges();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.delete')!.click();
    expect(confirm).toHaveBeenCalled();
    http.expectNone(`${environment.apiUrl}/itinerary/p1`);
    expect(items(fixture).length).toBe(1);
  });

  it('removes an entry after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = setup();
    http.expectOne(url).flush([
      entry('p1', '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', 'Milford Sound', null),
      entry('p2', '2026-03-10T00:00:00.000Z', '2026-03-11T00:00:00.000Z', 'Rotorua', null),
    ]);
    fixture.detectChanges();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.delete')!.click();
    const req = http.expectOne(`${environment.apiUrl}/itinerary/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(items(fixture).length).toBe(1);
    expect(items(fixture)[0].querySelector('.name')?.textContent).toBe('Rotorua');
  });

  it('treats a 404 on delete as already gone', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = setup();
    http.expectOne(url).flush([entry('p1', '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', 'Milford Sound', null)]);
    fixture.detectChanges();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.delete')!.click();
    http
      .expectOne(`${environment.apiUrl}/itinerary/p1`)
      .flush({ error: 'Itinerary entry not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(items(fixture).length).toBe(0);
  });

  it('keeps the entry and shows a message when removal fails', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = setup();
    http.expectOne(url).flush([entry('p1', '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', 'Milford Sound', null)]);
    fixture.detectChanges();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.delete')!.click();
    http.expectOne(`${environment.apiUrl}/itinerary/p1`).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(items(fixture).length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).querySelector('.action-error')?.textContent).toContain(
      'Could not remove',
    );
  });
});
