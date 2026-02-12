import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
// import { JwtHelperService } from "@auth0/angular-jwt";
import { Router } from '@angular/router';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

// const jwtHelper = new JwtHelperService();

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userData = new Subject<any>();
  private userId = new BehaviorSubject<any>({});
  userData$ = this.userData.asObservable();
  loader = new BehaviorSubject(false);
  private loaderRequestCount = 0;
  private loaderEmitScheduled = false;
  localDataValuesChange: Subject<any> = new Subject<any>();
  private second = new Subject<any>();
  second$ = this.second.asObservable();
  // Base URL for uploads (proof/invoice). Use backend so it can redirect to
  // signed Blob/S3 URLs when buckets are private.
  pdfUrl: string = (environment.apiUrl && environment.apiUrl.trim())
    ? environment.apiUrl.replace(/\/$/, '')
    : '';
  baseUrl: string = (environment.apiUrl && environment.apiUrl.trim())
    ? (environment.apiUrl.replace(/\/$/, '') + '/api/v1/')
    : 'api/v1/';
  token;
  constructor(private http: HttpClient, private router: Router) {
    this.token = localStorage.getItem('token');
  }

  //  setHeaders() {
  //   let headers: HttpHeaders = new HttpHeaders();
  //   headers = headers.set('Accept', 'application/json');
  //   headers = headers.set('Content-Type', 'application/json');
   
  //   return headers;
  // }
  
  setUserId(data) {
    this.userId.next(data);
  }

  getUserId() {
    return this.userId.asObservable();
  }

  sendId(data){
    this.second.next(data);
  }

  sendUserData(data){
    this.userData.next(data);
  }

  public  getData(url, data?: any): Observable<any>{
    // let headers = this.setHeaders();
    if (data){
      const queryParams =  Object.keys(data).map(key => key + '=' + data[key]).join('&');
      url += '?' + queryParams;
    }

    // const token = 'Bearer' + ' ' + this.token;
    // headers = headers.set('Authorization', token);
    // const options = { headers: headers };
    return this.http.get(this.baseUrl + url);
  }

  public postData(url?:any, data?: any): Observable<any> {
    // let headers = this.setHeaders();
    // const options = { headers: headers };
    return this.http.post(this.baseUrl + url, data);
  }

  public deleteData(url): Observable<any>{
    // const headers = this.setHeaders();
    // const options = { headers: headers };
    return this.http.delete(this.baseUrl + url);
  }

  private extractData(res: Response) {
    const body = res;
    return body || {};
  }

  private handleError(error: any) {
    const errMsg = error && error.error;
    if (!errMsg) {
      return throwError(error && error.message || 'Request failed');
    }
    if (typeof errMsg.message === 'object') {
      const arr = Array.from(Object.keys(errMsg.message), k => errMsg.message[k]);
      return throwError(arr);
    }
    return throwError(errMsg.message != null ? errMsg.message : 'Request failed');
  }

  setLoader(value) {
    if (value) {
      this.loaderRequestCount += 1;
    } else {
      this.loaderRequestCount = Math.max(this.loaderRequestCount - 1, 0);
    }
    this.emitLoaderState();
  }

  getLoader() {
    return this.loader.asObservable();
  }
  resetLoader() {
    this.loaderRequestCount = 0;
    this.emitLoaderState();
  }
  private emitLoaderState() {
    if (this.loaderEmitScheduled) {
      return;
    }
    this.loaderEmitScheduled = true;
    Promise.resolve().then(() => {
      this.loaderEmitScheduled = false;
      this.loader.next(this.loaderRequestCount > 0);
    });
  }
  getAllData(url:any){
    // let headers = this.setHeaders();
    // const options = { headers: headers };
    return this.http.get(this.baseUrl+url)
  }
  patchData(url:any,data:any){
    return this.http.patch(this.baseUrl+ url,data);
  }
  delete(url:any){
    return this.http.delete(this.baseUrl+ url);
  }
}
