import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { Review } from '../core/models';
import { ReviewForm } from './review-form';

const created: Review = {
  id: 'r1',
  placeId: 'p1',
  userId: 'u1',
  rating: 4,
  comment: 'Lovely',
  createdAt: '2026-03-04T10:00:00.000Z',
  updatedAt: '2026-03-04T10:00:00.000Z',
  user: { id: 'u1', name: 'Ann' },
};
const url = `${environment.apiUrl}/reviews`;

describe('ReviewForm', () => {
  let http: HttpTestingController;

  function setup(loggedIn = true) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ReviewForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    if (loggedIn) {
      TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    }
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ReviewForm);
    fixture.componentRef.setInput('placeId', 'p1');
    fixture.detectChanges();
    return fixture;
  }

  function pickStar(fixture: ReturnType<typeof setup>, n: number) {
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button.star')[n - 1].click();
    fixture.detectChanges();
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

  it('posts an integer rating and trimmed comment, emits the created review, and resets', () => {
    const fixture = setup();
    const emitted: Review[] = [];
    fixture.componentInstance.created.subscribe((r) => emitted.push(r));
    pickStar(fixture, 4);
    fixture.componentInstance.form.controls.comment.setValue('  Lovely  ');
    submit(fixture);
    const req = http.expectOne(url);
    expect(req.request.body).toEqual({ placeId: 'p1', rating: 4, comment: 'Lovely' });
    expect(Number.isInteger(req.request.body.rating)).toBe(true);
    req.flush(created, { status: 201, statusText: 'Created' });
    expect(emitted).toEqual([created]);
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ rating: 0, comment: '' });
  });

  it('omits an empty comment', () => {
    const fixture = setup();
    pickStar(fixture, 5);
    submit(fixture);
    const req = http.expectOne(url);
    expect(req.request.body).toEqual({ placeId: 'p1', rating: 5 });
    req.flush(created, { status: 201, statusText: 'Created' });
  });

  it('requires a rating before sending anything', () => {
    const fixture = setup();
    submit(fixture);
    http.expectNone(url);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Choose a rating from 1 to 5.');
  });

  it('shows the backend message on a 400', () => {
    const fixture = setup();
    pickStar(fixture, 3);
    submit(fixture);
    http
      .expectOne(url)
      .flush({ error: 'placeId and rating (integer 1-5) are required' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('integer 1-5');
  });

  it('shows a specific message on a 404', () => {
    const fixture = setup();
    pickStar(fixture, 3);
    submit(fixture);
    http.expectOne(url).flush({ error: 'Place not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('no longer exists');
  });
});
