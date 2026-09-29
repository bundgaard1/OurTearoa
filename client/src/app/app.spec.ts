import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('OurAotearoa — Cloud Healthcheck');
  });

  it('should request the health endpoint on init', async () => {
    const fixture = TestBed.createComponent(App);
    const httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/health') && r.method === 'GET',
    );
    req.flush({
      status: 'UP',
      timestamp: '2026-09-29T00:18:23.886Z',
      database: 'UP',
      latencyMs: 34.9,
      reason: null,
    });
    await fixture.whenStable();

    expect(fixture.componentInstance.healthData()?.database).toBe('UP');
    expect(fixture.componentInstance.healthData()?.latencyMs).toBe(34.9);
    httpMock.verify();
  });

  it('should surface an error when the health request fails', async () => {
    const fixture = TestBed.createComponent(App);
    const httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/api/health') && r.method === 'GET',
    );
    req.flush('nope', { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();

    expect(fixture.componentInstance.error()).toBe('Could not reach Express server');
    httpMock.verify();
  });
});
