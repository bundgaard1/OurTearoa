import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Review } from '../core/models';
import { PlaceReviews } from './place-reviews';

const review = (id: string, rating: number, comment: string | null, name = 'Ann'): Review => ({
  id,
  placeId: 'p1',
  userId: 'u' + id,
  rating,
  comment,
  createdAt: '2026-03-04T10:00:00.000Z',
  updatedAt: '2026-03-04T10:00:00.000Z',
  user: { id: 'u' + id, name },
});

describe('PlaceReviews', () => {
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/places/p1/reviews`;

  function setup() {
    TestBed.configureTestingModule({ imports: [PlaceReviews], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PlaceReviews);
    fixture.componentRef.setInput('placeId', 'p1');
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  it('lists reviews with author, stars, comment and date, plus average and count', () => {
    const fixture = setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-loading')).not.toBeNull();
    http.expectOne(url).flush([review('1', 5, 'Superb', 'Ann'), review('2', 4, null, 'Ben')]);
    fixture.detectChanges();

    const items = el.querySelectorAll('li.review');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.author')?.textContent).toBe('Ann');
    expect(items[0].querySelector('.stars')?.textContent).toBe('★★★★★');
    expect(items[0].querySelector('.comment')?.textContent).toBe('Superb');
    expect(items[0].querySelector('.date')?.textContent).toContain('2026');
    expect(items[1].querySelector('.comment')).toBeNull();
    expect(el.querySelector('.summary')?.textContent).toContain('4.5');
    expect(el.querySelector('.summary')?.textContent).toContain('from 2 reviews');
  });

  it('uses the singular for one review', () => {
    const fixture = setup();
    http.expectOne(url).flush([review('1', 3, 'ok')]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.summary')?.textContent).toContain('from 1 review');
  });

  it('shows a placeholder when there are no reviews', () => {
    const fixture = setup();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.placeholder')?.textContent).toContain('No reviews yet');
    expect(el.querySelector('.summary')).toBeNull();
  });

  it('shows an error and retries', () => {
    const fixture = setup();
    http.expectOne(url).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-error-alert')).not.toBeNull();
    el.querySelector<HTMLButtonElement>('button.retry')!.click();
    http.expectOne(url).flush([review('1', 5, 'Great')]);
    fixture.detectChanges();
    expect(el.querySelectorAll('li.review').length).toBe(1);
  });

  it('reloads when the place changes', () => {
    const fixture = setup();
    http.expectOne(url).flush([]);
    fixture.componentRef.setInput('placeId', 'p2');
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/places/p2/reviews`).flush([]);
  });
});
