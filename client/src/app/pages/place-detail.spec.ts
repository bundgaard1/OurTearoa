import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../app.routes';
import { PlacesPage } from './places';

describe('master/detail layout', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('keeps the list mounted beside the panel on /places/:id', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/places/abc');
    const el = harness.routeNativeElement as HTMLElement;
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(PlacesPage);
    expect(el.querySelector('section.list')).not.toBeNull();
    expect(el.querySelector('app-place-detail aside.panel')).not.toBeNull();
    expect(el.querySelector('.layout')?.classList.contains('panel-open')).toBe(true);
  });

  it('shows no panel on /places', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/places');
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('app-place-detail')).toBeNull();
    expect(el.querySelector('.layout')?.classList.contains('panel-open')).toBe(false);
  });

  it('Close returns to /places and removes the panel', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/places/abc');
    const el = harness.routeNativeElement as HTMLElement;
    el.querySelector<HTMLAnchorElement>('a.close')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/places');
    expect(el.querySelector('app-place-detail')).toBeNull();
  });
});
