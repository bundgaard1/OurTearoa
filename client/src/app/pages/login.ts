import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiService } from '../core/api/api.service';
import { AuthStore } from '../core/auth/auth.store';
import { ApiError, AuthResponse, LoginInput } from '../core/models';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './form-page.scss',
})
export class LoginPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]],
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
    this.api.post<AuthResponse>('/auth/login', this.form.getRawValue() satisfies LoginInput).subscribe({
      next: (response) => {
        this.auth.setSession(response);
        this.pending.set(false);
        void this.router.navigateByUrl(this.returnUrl());
      },
      error: (err: HttpErrorResponse) => {
        this.pending.set(false);
        this.error.set((err.error as ApiError | null)?.error ?? 'Could not reach the server. Try again.');
      },
    });
  }

  private returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return value && value.startsWith('/') && !value.startsWith('//') ? value : '/places';
  }
}
