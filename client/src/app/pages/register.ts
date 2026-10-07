import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../core/api/api.service';
import { AuthStore } from '../core/auth/auth.store';
import { ApiError, AuthResponse, RegisterInput } from '../core/models';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() === '' ? { blank: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './form-page.scss',
})
export class RegisterPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    name: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }
    this.pending.set(true);
    this.api.post<AuthResponse>('/auth/register', this.form.getRawValue() satisfies RegisterInput).subscribe({
      next: (response) => {
        this.auth.setSession(response);
        this.pending.set(false);
        void this.router.navigateByUrl('/places');
      },
      error: (err: HttpErrorResponse) => {
        this.pending.set(false);
        this.error.set(
          err.status === 409
            ? 'That email is already registered. Try logging in instead.'
            : ((err.error as ApiError | null)?.error ?? 'Could not reach the server. Try again.'),
        );
      },
    });
  }
}
