import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { authInterceptor } from '../core/auth/auth.interceptor';
import { AuthStore } from '../core/auth/auth.store';
import { Place } from '../core/models';
import { PlaceImageUpload } from './place-image-upload';

describe('PlaceImageUpload', () => {
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/places/p1`;
  const s3 = 'https://ourtearoa-storage.s3.ap-southeast-2.amazonaws.com/';
  const key = 'public/places/p1/abc.png';
  const presign = { url: s3, fields: { key, 'Content-Type': 'image/png', Policy: 'pol' }, key, imageUrl: s3 + key };
  const png = (size = 10) => new File([new Uint8Array(size)], 'photo.png', { type: 'image/png' });

  function setup(loggedIn = true) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PlaceImageUpload],
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    if (loggedIn) {
      TestBed.inject(AuthStore).setSession({ token: 't', user: { id: 'u1', email: 'a@b.co', name: 'Ann' } });
    }
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PlaceImageUpload);
    fixture.componentRef.setInput('placeId', 'p1');
    fixture.detectChanges();
    const uploaded: Place[] = [];
    fixture.componentInstance.uploaded.subscribe((p) => uploaded.push(p));
    return { fixture, uploaded, el: fixture.nativeElement as HTMLElement };
  }

  afterEach(() => http.verify());

  it('is hidden for anonymous users', () => {
    const { el } = setup(false);
    expect(el.querySelector('input[type=file]')).toBeNull();
  });

  it('offers a file input limited to jpeg, png and webp', () => {
    const { el } = setup();
    expect(el.querySelector('input[type=file]')?.getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
  });

  it('presigns, uploads straight to S3 without auth, then confirms', () => {
    const { fixture, uploaded, el } = setup();
    fixture.componentInstance.upload(png());
    fixture.detectChanges();
    expect(el.textContent).toContain('Uploading...');

    const presignReq = http.expectOne({ method: 'POST', url: `${api}/image-upload-url` });
    expect(presignReq.request.body).toEqual({ contentType: 'image/png' });
    expect(presignReq.request.headers.get('Authorization')).toBe('Bearer t');
    presignReq.flush(presign);

    const s3Req = http.expectOne({ method: 'POST', url: s3 });
    expect(s3Req.request.headers.has('Authorization')).toBe(false);
    const form = s3Req.request.body as FormData;
    expect(form.get('key')).toBe(key);
    expect(form.get('Policy')).toBe('pol');
    expect([...form.keys()].at(-1)).toBe('file');
    s3Req.flush('', { status: 204, statusText: 'No Content' });

    const confirmReq = http.expectOne({ method: 'POST', url: `${api}/image` });
    expect(confirmReq.request.body).toEqual({ key });
    confirmReq.flush({ id: 'p1', imageUrl: s3 + key });
    fixture.detectChanges();

    expect(uploaded.map((p) => p.imageUrl)).toEqual([s3 + key]);
    expect(el.textContent).toContain('Upload a photo');
    expect(el.querySelector('.upload-error')).toBeNull();
  });

  it('shows an error and skips confirm when the S3 upload fails', () => {
    const { fixture, uploaded, el } = setup();
    fixture.componentInstance.upload(png());
    http.expectOne(`${api}/image-upload-url`).flush(presign);
    http.expectOne(s3).flush('<Error/>', { status: 403, statusText: 'Forbidden' });
    http.expectNone(`${api}/image`);
    fixture.detectChanges();
    expect(el.querySelector('.upload-error')?.textContent).toContain('Could not upload the image.');
    expect(el.querySelector<HTMLInputElement>('input[type=file]')?.disabled).toBe(false);
    expect(uploaded).toEqual([]);
  });

  it('shows an error when presigning fails', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.upload(png());
    http.expectOne(`${api}/image-upload-url`).flush({ error: 'x' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(el.querySelector('.upload-error')).not.toBeNull();
  });

  it('rejects other file types and files over 5 MB without calling the API', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.upload(new File(['x'], 'a.gif', { type: 'image/gif' }));
    fixture.detectChanges();
    expect(el.querySelector('.upload-error')?.textContent).toContain('JPEG, PNG or WebP');
    fixture.componentInstance.upload(png(5 * 1024 * 1024 + 1));
    fixture.detectChanges();
    expect(el.querySelector('.upload-error')?.textContent).toContain('5 MB or smaller');
    http.expectNone(`${api}/image-upload-url`);
  });
});
