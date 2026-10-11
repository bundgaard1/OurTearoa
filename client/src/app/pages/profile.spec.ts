import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth/auth.store';
import { ProfilePage } from './profile';

describe('ProfilePage', () => {
  let http: HttpTestingController;
  let store: AuthStore;
  let navigate: ReturnType<typeof vi.spyOn>;
  const url = `${environment.apiUrl}/users/me`;
  const profile = { id: 'u1', name: 'Ann', email: 'a@b.co', createdAt: '2026-03-01T12:00:00.000Z' };

  function setup() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AuthStore);
    store.setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
    return fixture;
  }

  function loaded() {
    const fixture = setup();
    http.expectOne({ method: 'GET', url }).flush(profile);
    fixture.detectChanges();
    return fixture;
  }

  const el = (fixture: ReturnType<typeof setup>) => fixture.nativeElement as HTMLElement;
  const click = (fixture: ReturnType<typeof setup>, selector: string) => {
    el(fixture).querySelector<HTMLButtonElement>(selector)!.click();
    fixture.detectChanges();
  };

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('shows name, email and member since', () => {
    const fixture = loaded();
    expect(el(fixture).querySelector('.name')?.textContent).toBe('Ann');
    expect(el(fixture).querySelector('.email')?.textContent).toBe('a@b.co');
    expect(el(fixture).querySelector('.since')?.textContent).toBe(
      new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    );
  });

  it('shows a retry alert when loading fails', () => {
    const fixture = setup();
    http.expectOne(url).flush({ error: 'Internal' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el(fixture).querySelector('app-error-alert')?.textContent).toContain('Could not load your profile.');
    click(fixture, '.retry');
    http.expectOne(url).flush(profile);
    fixture.detectChanges();
    expect(el(fixture).querySelector('.name')?.textContent).toBe('Ann');
  });

  it('shows user not found and clears the session for a stale token', () => {
    const fixture = setup();
    http.expectOne(url).flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(el(fixture).querySelector('.not-found')?.textContent).toContain('User not found');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('requires a confirmation step and can be cancelled', () => {
    const fixture = loaded();
    click(fixture, '.delete');
    expect(el(fixture).querySelector('.confirm-text')).not.toBeNull();
    click(fixture, '.cancel');
    expect(el(fixture).querySelector('.confirm')).toBeNull();
    expect(el(fixture).querySelector('.delete')).not.toBeNull();
  });

  it('deletes the account, clears the session and returns to /places', () => {
    const fixture = loaded();
    click(fixture, '.delete');
    click(fixture, '.confirm');
    expect(el(fixture).querySelector<HTMLButtonElement>('.confirm')?.disabled).toBe(true);
    http.expectOne({ method: 'DELETE', url }).flush(null, { status: 204, statusText: 'No Content' });
    expect(store.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/places']);
  });

  it('shows user not found when the account is already gone on delete', () => {
    const fixture = loaded();
    click(fixture, '.delete');
    click(fixture, '.confirm');
    http.expectOne({ method: 'DELETE', url }).flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(el(fixture).querySelector('.not-found')).not.toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps the session and shows an error when delete fails', () => {
    const fixture = loaded();
    click(fixture, '.delete');
    click(fixture, '.confirm');
    http.expectOne({ method: 'DELETE', url }).flush({ error: 'Internal' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el(fixture).querySelector('.action-error')?.textContent).toContain('Could not delete your account.');
    expect(el(fixture).querySelector<HTMLButtonElement>('.confirm')?.disabled).toBe(false);
    expect(store.isAuthenticated()).toBe(true);
  });
});
