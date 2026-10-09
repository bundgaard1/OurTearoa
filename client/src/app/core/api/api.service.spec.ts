import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { Place } from '../models';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('prefixes paths with environment.apiUrl', () => {
    api.get<Place[]>('/places').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/places`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('adds a missing leading slash', () => {
    api.get('places').subscribe();
    http.expectOne(`${environment.apiUrl}/places`).flush([]);
  });

  it('sends defined query params and skips empty ones', () => {
    api.get('/places', { region: 'Otago', q: '', other: undefined }).subscribe();
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/places`);
    expect(req.request.params.get('region')).toBe('Otago');
    expect(req.request.params.has('q')).toBe(false);
    expect(req.request.params.has('other')).toBe(false);
    req.flush([]);
  });

  it('sends a body on POST and PUT', () => {
    api.post('/reviews', { rating: 5 }).subscribe();
    const post = http.expectOne(`${environment.apiUrl}/reviews`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ rating: 5 });
    post.flush({});

    api.put('/reviews/1', { rating: 4 }).subscribe();
    const put = http.expectOne(`${environment.apiUrl}/reviews/1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ rating: 4 });
    put.flush({});
  });

  it('issues DELETE requests', () => {
    api.delete('/reviews/1').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/reviews/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
