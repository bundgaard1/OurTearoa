import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { Review } from '../core/models';
import { PlaceReviews } from './place-reviews';

const review = (id: string, userId: string, rating: number, comment: string | null): Review => ({
  id,
  placeId: 'p1',
  userId,
  rating,
  comment,
  createdAt: '2026-03-04T10:00:00.000Z',
  updatedAt: '2026-03-04T10:00:00.000Z',
  user: { id: userId, name: userId === 'me' ? 'Ann' : 'Ben' },
});

describe('PlaceReviews edit and delete', () => {
  let http: HttpTestingController;
  const list = `${environment.apiUrl}/places/p1/reviews`;

  function setup(loggedIn = true) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PlaceReviews],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    if (loggedIn) {
      TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'me', email: 'a@b.co', name: 'Ann' } });
    }
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PlaceReviews);
    fixture.componentRef.setInput('placeId', 'p1');
    fixture.detectChanges();
    http.expectOne(list).flush([review('r1', 'me', 5, 'Mine'), review('r2', 'other', 3, 'Theirs')]);
    fixture.detectChanges();
    return fixture;
  }

  const items = (f: ReturnType<typeof setup>) =>
    (f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('li.review');

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('shows Edit and Delete only on the logged-in user own review', () => {
    const fixture = setup();
    const [mine, theirs] = Array.from(items(fixture));
    expect(mine.querySelector('button.edit')).not.toBeNull();
    expect(mine.querySelector('button.delete')).not.toBeNull();
    expect(theirs.querySelector('button.edit')).toBeNull();
    expect(theirs.querySelector('button.delete')).toBeNull();
  });

  it('shows no controls to anonymous visitors', () => {
    const fixture = setup(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('button.edit, button.delete')).toBeNull();
  });

  it('edits through the shared form, PUTs, and updates the list and average', () => {
    const fixture = setup();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.edit')!.click();
    fixture.detectChanges();
    const form = items(fixture)[0].querySelector('app-review-form')!;
    expect(form.querySelector('h4')?.textContent).toContain('Edit your review');
    expect((form.querySelector('textarea') as HTMLTextAreaElement).value).toBe('Mine');

    form.querySelectorAll<HTMLButtonElement>('button.star')[1].click();
    fixture.detectChanges();
    form.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne(`${environment.apiUrl}/reviews/r1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ rating: 2, comment: 'Mine' });
    req.flush(review('r1', 'me', 2, 'Mine'));
    fixture.detectChanges();

    expect(items(fixture)[0].querySelector('app-review-form')).toBeNull();
    expect(items(fixture)[0].querySelector('.stars')?.textContent).toBe('★★☆☆☆');
    expect((fixture.nativeElement as HTMLElement).querySelector('.summary')?.textContent).toContain('2.5');
  });

  it('sends a null comment when the comment is cleared', () => {
    const fixture = setup();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.edit')!.click();
    fixture.detectChanges();
    const form = items(fixture)[0].querySelector('app-review-form')!;
    const area = form.querySelector('textarea') as HTMLTextAreaElement;
    area.value = '';
    area.dispatchEvent(new Event('input'));
    form.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne(`${environment.apiUrl}/reviews/r1`);
    expect(req.request.body).toEqual({ rating: 5, comment: null });
    req.flush(review('r1', 'me', 5, null));
  });

  it('cancel leaves the review unchanged and sends nothing', () => {
    const fixture = setup();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.edit')!.click();
    fixture.detectChanges();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.cancel')!.click();
    fixture.detectChanges();
    expect(items(fixture)[0].querySelector('app-review-form')).toBeNull();
    expect(items(fixture)[0].textContent).toContain('Mine');
  });

  it('asks for confirmation and does nothing when declined', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fixture = setup();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.delete')!.click();
    expect(confirm).toHaveBeenCalled();
    http.expectNone(`${environment.apiUrl}/reviews/r1`);
    expect(items(fixture).length).toBe(2);
  });

  it('deletes after confirmation and removes the review from the list', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = setup();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.delete')!.click();
    const req = http.expectOne(`${environment.apiUrl}/reviews/r1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(items(fixture).length).toBe(1);
    expect(items(fixture)[0].textContent).toContain('Theirs');
  });

  it('treats a 404 on delete as already gone', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = setup();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.delete')!.click();
    http.expectOne(`${environment.apiUrl}/reviews/r1`).flush({ error: 'Review not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(items(fixture).length).toBe(1);
  });

  it('keeps the review and shows a message when delete fails', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = setup();
    items(fixture)[0].querySelector<HTMLButtonElement>('button.delete')!.click();
    http.expectOne(`${environment.apiUrl}/reviews/r1`).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(items(fixture).length).toBe(2);
    expect((fixture.nativeElement as HTMLElement).querySelector('.action-error')?.textContent).toContain('Could not delete');
  });
});
