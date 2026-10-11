import { HttpClient } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { switchMap } from 'rxjs';

import { ApiService } from '../core/api/api.service';
import { AuthStore } from '../core/auth/auth.store';
import { Place } from '../core/models';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUpload {
  url: string;
  fields: Record<string, string>;
  key: string;
}

@Component({
  selector: 'app-place-image-upload',
  template: `
    @if (auth.isAuthenticated()) {
      <label class="upload">
        {{ uploading() ? 'Uploading...' : 'Upload a photo' }}
        <input
          type="file"
          [accept]="accept"
          [disabled]="uploading()"
          (change)="onFile($event)"
        />
      </label>
      @if (error()) {
        <p class="upload-error" role="alert">{{ error() }}</p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      margin-top: var(--space-2);
    }

    .upload {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .upload-error {
      margin: var(--space-1) 0 0;
      color: var(--color-error);
    }
  `,
})
export class PlaceImageUpload {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  protected readonly auth = inject(AuthStore);

  readonly placeId = input.required<string>();
  readonly uploaded = output<Place>();

  readonly accept = IMAGE_TYPES.join(',');
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  onFile(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (file) {
      this.upload(file);
    }
  }

  upload(file: File): void {
    if (this.uploading()) {
      return;
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      this.error.set('Choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.error.set('The image must be 5 MB or smaller.');
      return;
    }
    const path = `/places/${encodeURIComponent(this.placeId())}`;
    this.error.set(null);
    this.uploading.set(true);
    let key = '';
    this.api
      .post<ImageUpload>(`${path}/image-upload-url`, { contentType: file.type })
      .pipe(
        switchMap((upload) => {
          key = upload.key;
          const form = new FormData();
          for (const [name, value] of Object.entries(upload.fields)) {
            form.append(name, value);
          }
          form.append('file', file);
          return this.http.post(upload.url, form, { responseType: 'text' });
        }),
        switchMap(() => this.api.post<Place>(`${path}/image`, { key })),
      )
      .subscribe({
        next: (place) => {
          this.uploading.set(false);
          this.uploaded.emit(place);
        },
        error: () => {
          this.uploading.set(false);
          this.error.set('Could not upload the image. Try again.');
        },
      });
  }
}
