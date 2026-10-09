import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from './auth.store';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let store: AuthStore;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate, url: '/favorites' } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
  });

  afterEach(() => controller.verify());

  it('attaches the bearer token when logged in', () => {
    store.setSession({ token: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    http.get(`${environment.apiUrl}/favorites`).subscribe();
    const req = controller.expectOne(`${environment.apiUrl}/favorites`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush([]);
  });

  it('sends no Authorization header when logged out', () => {
    http.get(`${environment.apiUrl}/places`).subscribe();
    const req = controller.expectOne(`${environment.apiUrl}/places`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('does not attach the token to other hosts', () => {
    store.setSession({ token: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    http.get('https://example.com/x').subscribe();
    const req = controller.expectOne('https://example.com/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('clears the session and redirects to login on 401', () => {
    store.setSession({ token: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    http.get(`${environment.apiUrl}/favorites`).subscribe({ error: () => undefined });
    controller
      .expectOne(`${environment.apiUrl}/favorites`)
      .flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(store.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/favorites' } });
  });

  it('leaves the session alone for a 401 from the login call', () => {
    store.setSession({ token: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => undefined });
    controller
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ error: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });
    expect(store.isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
