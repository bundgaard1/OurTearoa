import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { ItineraryEntry } from '../core/models';
import { ItineraryForm } from './itinerary-form';

const entry = (overrides: Partial<ItineraryEntry> = {}): ItineraryEntry => ({
  id: 'i1',
  placeId: 'p1',
  userId: 'u1',
  startDate: '2026-03-04T00:00:00.000Z',
  endDate: '2026-03-06T00:00:00.000Z',
  note: 'Hike',
  createdAt: '2026-03-01T12:00:00.000Z',
  updatedAt: '2026-03-01T12:00:00.000Z',
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
  ...overrides,
});

describe('ItineraryForm', () => {
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/itinerary`;

  function setup(loggedIn = true) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ItineraryForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    if (loggedIn) {
      TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    }
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ItineraryForm);
    fixture.componentRef.setInput('placeId', 'p1');
    fixture.detectChanges();
    return fixture;
  }

  function fillDates(fixture: ReturnType<typeof setup>) {
    fixture.componentInstance.form.controls.startDate.setValue('2026-03-04');
    fixture.componentInstance.form.controls.endDate.setValue('2026-03-06');
  }

  function submit(fixture: ReturnType<typeof setup>) {
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('shows a login prompt instead of the form for anonymous visitors', () => {
    const fixture = setup(false);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('a[href^="/login"]')?.textContent).toContain('Log in');
  });

  it('posts yyyy-MM-dd dates, omits an empty note, emits created, and shows the success text', () => {
    const fixture = setup();
    const emitted: ItineraryEntry[] = [];
    fixture.componentInstance.created.subscribe((e) => emitted.push(e));
    fillDates(fixture);
    submit(fixture);
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ placeId: 'p1', startDate: '2026-03-04', endDate: '2026-03-06' });
    req.flush(entry(), { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(emitted).toEqual([entry()]);
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ startDate: '', endDate: '', note: '' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.form-success')?.textContent).toContain('Added to your itinerary.');
    expect(el.querySelector('.form-success a')?.getAttribute('href')).toBe('/itinerary');
  });

  it('sends a trimmed note when provided', () => {
    const fixture = setup();
    fillDates(fixture);
    fixture.componentInstance.form.controls.note.setValue('  Hike  ');
    submit(fixture);
    const req = http.expectOne(url);
    expect(req.request.body).toEqual({
      placeId: 'p1',
      startDate: '2026-03-04',
      endDate: '2026-03-06',
      note: 'Hike',
    });
    req.flush(entry(), { status: 201, statusText: 'Created' });
  });

  it('blocks an end date before the start date with no request', () => {
    const fixture = setup();
    fillDates(fixture);
    fixture.componentInstance.form.controls.startDate.setValue('2026-03-06');
    fixture.componentInstance.form.controls.endDate.setValue('2026-03-04');
    submit(fixture);
    http.expectNone(url);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('End date must not be before the start date.');
  });

  it('shows the backend message on a 400', () => {
    const fixture = setup();
    fillDates(fixture);
    submit(fixture);
    http
      .expectOne(url)
      .flush({ error: 'placeId, startDate and endDate (ISO dates) are required' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('ISO dates');
  });

  it('prefills the dates and note in edit mode', () => {
    const fixture = setup();
    fixture.componentRef.setInput('entry', entry());
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      startDate: '2026-03-04',
      endDate: '2026-03-06',
      note: 'Hike',
    });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('button.submit')?.textContent).toBe('Save changes');
    expect(el.querySelector('button.cancel')).not.toBeNull();
  });

  it('sends only the changed fields on edit', () => {
    const fixture = setup();
    fixture.componentRef.setInput('entry', entry());
    fixture.detectChanges();
    fixture.componentInstance.form.controls.startDate.setValue('2026-03-05');
    submit(fixture);
    const req = http.expectOne(`${environment.apiUrl}/itinerary/i1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ startDate: '2026-03-05' });
    req.flush(entry({ startDate: '2026-03-05T00:00:00.000Z' }));
    fixture.detectChanges();
  });

  it('sends null when the note is cleared on edit', () => {
    const fixture = setup();
    fixture.componentRef.setInput('entry', entry());
    fixture.detectChanges();
    fixture.componentInstance.form.controls.note.setValue('');
    submit(fixture);
    const req = http.expectOne(`${environment.apiUrl}/itinerary/i1`);
    expect(req.request.body).toEqual({ note: null });
    req.flush(entry({ note: null }));
    fixture.detectChanges();
  });

  it('applies the end-before-start rule in edit mode', () => {
    const fixture = setup();
    fixture.componentRef.setInput('entry', entry());
    fixture.detectChanges();
    fixture.componentInstance.form.controls.endDate.setValue('2026-03-02');
    submit(fixture);
    http.expectNone(url);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('End date must not be before the start date.');
  });

  it('emits cancelled with no request when nothing changed', () => {
    const fixture = setup();
    fixture.componentRef.setInput('entry', entry());
    fixture.detectChanges();
    let cancelled = 0;
    fixture.componentInstance.cancelled.subscribe(() => cancelled++);
    submit(fixture);
    http.expectNone(url);
    expect(cancelled).toBe(1);
  });

  it('shows the entry message on a 404 in edit mode', () => {
    const fixture = setup();
    fixture.componentRef.setInput('entry', entry());
    fixture.detectChanges();
    fixture.componentInstance.form.controls.startDate.setValue('2026-03-05');
    submit(fixture);
    http
      .expectOne(`${environment.apiUrl}/itinerary/i1`)
      .flush({ error: 'Itinerary entry not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain(
      'This itinerary entry no longer exists.',
    );
  });
});
