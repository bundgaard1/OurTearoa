import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { RegisterPage } from './register';

const response = { token: 'tok', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } };
const valid = { email: 'a@b.co', name: 'Ann', password: 'secret123' };

describe('RegisterPage', () => {
  let http: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  function setup() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    return fixture;
  }

  function submit(fixture: ReturnType<typeof setup>, value: typeof valid) {
    fixture.componentInstance.form.setValue(value);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('stores the session and leaves /register on 201', () => {
    const fixture = setup();
    submit(fixture, valid);
    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.body).toEqual(valid);
    req.flush(response, { status: 201, statusText: 'Created' });
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(true);
    expect(navigateByUrl).toHaveBeenCalledWith('/places');
  });

  it('shows a distinct message on 409', () => {
    const fixture = setup();
    submit(fixture, valid);
    http
      .expectOne(`${environment.apiUrl}/auth/register`)
      .flush({ error: 'Email already registered' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain(
      'already registered',
    );
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
  });

  it('shows the backend message on a 400', () => {
    const fixture = setup();
    submit(fixture, valid);
    http
      .expectOne(`${environment.apiUrl}/auth/register`)
      .flush({ error: 'email, name (max 100 chars) and password (min 8 chars) are required' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain(
      'min 8 chars',
    );
  });

  it.each([
    ['bad email', { ...valid, email: 'nope' }, 'Enter a valid email address.'],
    ['blank name', { ...valid, name: '   ' }, 'Name is required'],
    ['name over 100 characters', { ...valid, name: 'x'.repeat(101) }, 'Name is required'],
    ['short password', { ...valid, password: 'short' }, 'at least 8 characters'],
  ])('rejects %s client-side without a request', (_label, value, message) => {
    const fixture = setup();
    submit(fixture, value);
    http.expectNone(`${environment.apiUrl}/auth/register`);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(message);
  });

  it('links to the login page', () => {
    const fixture = setup();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/login"]')).not.toBeNull();
  });
});
