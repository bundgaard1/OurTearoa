import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStore } from './auth.store';

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const store = inject(AuthStore);
  const router = inject(Router);
  const token = store.token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((path) => req.url.endsWith(path));
      if (error instanceof HttpErrorResponse && error.status === 401 && !isPublicAuthCall) {
        store.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
