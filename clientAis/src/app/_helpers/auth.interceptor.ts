import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

const TOKEN_HEADER_KEY = 'x-access-token';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const TOKEN_KEY = 'auth-token';
    let authReq = req;
    const token = localStorage.getItem(TOKEN_KEY)
    if (token != null) {
        authReq = req.clone({ headers: req.headers.set(TOKEN_HEADER_KEY, token) });
      }
      return next.handle(authReq);
    }
  }

export const authInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
];