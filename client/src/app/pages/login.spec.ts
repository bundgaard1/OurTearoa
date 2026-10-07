import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { LoginPage } from './login';

const response = { token: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } };

describe('LoginPage', () => {
  let http: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  function setup(returnUrl?: string) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new Map(returnUrl ? [['returnUrl', returnUrl]] : []) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture;
  }

  function fill(fixture: ReturnType<typeof setup>, email: string, password: string) {
    fixture.componentInstance.form.setValue({ email, password });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('blocks submission and shows messages when fields are empty', () => {
    const fixture = setup();
    fill(fixture, '', '');
    http.expectNone(`${environment.apiUrl}/auth/login`);
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Email is required.');
    expect(text).toContain('Password is required.');
  });

  it('stores the session and goes to /places on success', () => {
    const fixture = setup();
    fill(fixture, 'a@b.co', 'secret123');
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.body).toEqual({ email: 'a@b.co', password: 'secret123' });
    req.flush(response);
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(true);
    expect(navigateByUrl).toHaveBeenCalledWith('/places');
  });

  it('returns the user to returnUrl after login', () => {
    const fixture = setup('/favorites');
    fill(fixture, 'a@b.co', 'secret123');
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(response);
    expect(navigateByUrl).toHaveBeenCalledWith('/favorites');
  });

  it('ignores an external returnUrl', () => {
    const fixture = setup('//evil.example');
    fill(fixture, 'a@b.co', 'secret123');
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(response);
    expect(navigateByUrl).toHaveBeenCalledWith('/places');
  });

  it('shows the backend message on a 401 and stays logged out', () => {
    const fixture = setup();
    fill(fixture, 'a@b.co', 'wrong');
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ error: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain(
      'Invalid email or password',
    );
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
