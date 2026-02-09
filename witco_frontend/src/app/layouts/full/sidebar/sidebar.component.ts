import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  ViewChild,
  HostListener,
  Directive,
  AfterViewInit
} from '@angular/core';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { MediaMatcher } from '@angular/cdk/layout';
import { MenuItems } from '../../../shared/menu-items/menu-items';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { throwToolbarMixedModesError } from '@angular/material';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: []
})
export class AppSidebarComponent implements OnDestroy {
  public config: PerfectScrollbarConfigInterface = {};
  mobileQuery: MediaQueryList;
  userName;

  private _mobileQueryListener: () => void;
  status: boolean = true;
  
  itemSelect:number[]=[]

  subclickEvent() {
    this.status = true;
  }
  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private authservice : AuthService,
    public menuItems: MenuItems,
    private router : Router
  ) {
    this.mobileQuery = media.matchMedia('(min-width: 768px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.userName = localStorage.getItem('firstName');
  }

  Logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('firstName');
    localStorage.removeItem('email');
    localStorage.removeItem('userIdAdmin');
    localStorage.removeItem('pass');
    this.router.navigate(['/']);
  }

  change(){
    this.router.navigate(['/reset']);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
}
