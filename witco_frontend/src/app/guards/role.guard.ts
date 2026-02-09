import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private route:ActivatedRoute
  ){}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    let user= localStorage.getItem('userData');
    let userData = user && JSON.parse(user);
    if(userData.userRole == 'admin') {
      return true;
    }
    else{
      this.router.navigate(['/my-jobs-Delivering'])
    }
    return false
  }
}
