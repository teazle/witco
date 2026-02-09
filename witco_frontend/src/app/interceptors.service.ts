import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class InterceptorsService implements HttpInterceptor {

    private toast: ToastrService
    constructor(private router: Router,) { }

  headers = new Headers({
    'Content-Type': 'application/json',
    'Token': localStorage.getItem("token")
  });
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    const getMessage = (err: HttpErrorResponse) =>
      (err.error && err.error.message) || err.message || 'Request failed';

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.clear();
          // this.toast.error('Timeout')
          this.router.navigate(['/']);
          return throwError(getMessage(error));
        }
        if (error.status === 404) {
          return throwError(getMessage(error));
        }
        if (error.status === 400) {
          return throwError(getMessage(error));
        }
        if (error.status === 403) {
          return throwError(getMessage(error));
        }
        if (error.status === 500) {
          return throwError(getMessage(error));
        }
        // this.getServerErrorMessage(error);
        return throwError(getMessage(error));
      })
    );
  }

  // private getServerErrorMessage(error: HttpErrorResponse): any {
  //   switch (error.status) {
  //     case 404: {
  //       console.log(error);
  //     }
  //     case 403: {
  //       console.log(error);
  //     }
  //     case 500: {
  //       console.log(error);
  //     }
  //     default: {
  //       console.log(error);
  //     }
  //   }
  // }
}


