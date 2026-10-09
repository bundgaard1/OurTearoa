import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthStore } from './auth.store';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { createUrlTree: (c: unknown[], e: unknown) => ({ c, e }) } }] });
  });

  const run = (url: string) =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  it('redirects anonymous users to /login with the returnUrl', () => {
    const result = run('/itinerary?x=1') as unknown as UrlTree;
    expect(result).toEqual({ c: ['/login'], e: { queryParams: { returnUrl: '/itinerary?x=1' } } });
  });

  it('allows an authenticated user through', () => {
    TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    expect(run('/favorites')).toBe(true);
  });
});
