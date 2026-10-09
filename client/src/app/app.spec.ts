import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { App } from './app';
import { routes } from './app.routes';
import { AuthStore } from './core/auth/auth.store';
import { FavoritesPage } from './pages/favorites';
import { ItineraryPage } from './pages/itinerary';
import { LoginPage } from './pages/login';
import { NotFoundPage } from './pages/not-found';
import { PlaceDetailPage } from './pages/place-detail';
import { PlacesPage } from './pages/places';
import { ProfilePage } from './pages/profile';
import { RegisterPage } from './pages/register';

describe('app routes', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  const cases: [string, unknown][] = [
    ['/login', LoginPage],
    ['/register', RegisterPage],
    ['/nowhere/at/all', NotFoundPage],
  ];

  it.each(cases)('%s resolves to its component', async (url, component) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(component as never);
  });

  it.each(['/favorites', '/itinerary', '/profile'])('%s redirects anonymous users to login with returnUrl', async (url) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const router = TestBed.inject(Router);
    expect(router.url).toBe(`/login?returnUrl=${encodeURIComponent(url)}`);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(LoginPage);
  });

  it.each([
    ['/favorites', FavoritesPage],
    ['/itinerary', ItineraryPage],
    ['/profile', ProfilePage],
  ])('%s opens for a logged-in user', async (url, component) => {
    TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(component);
  });

  it('redirects the root to /places', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/places');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(PlacesPage);
  });

  it('renders /places/:id as a child inside the places page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/places/abc');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(PlacesPage);
    expect(harness.routeNativeElement?.querySelector('app-place-detail')).not.toBeNull();
    expect(PlaceDetailPage).toBeDefined();
  });
});

describe('App shell header', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('shows Login and Register when logged out', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).querySelector('nav')!.textContent;
    expect(text).toContain('Login');
    expect(text).toContain('Register');
    expect(text).not.toContain('Logout');
  });

  it('shows the user name and Logout when logged in, and logout clears the session', () => {
    TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav')!;
    expect(nav.textContent).toContain('Ann');
    expect(nav.textContent).not.toContain('Login');

    nav.querySelector<HTMLButtonElement>('button')!.click();
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
  });
});
