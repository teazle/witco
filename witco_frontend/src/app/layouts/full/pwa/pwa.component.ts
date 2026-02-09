import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItems } from '../../../shared/menu-items/menu-items';
import { ConfirmDialogComponent } from '../../../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-pwa',
  templateUrl: './pwa.component.html',
  styleUrls: ['./pwa.component.css']
})
export class PwaComponent {
  isDeliverySubmit=false;
  constructor(private router: Router, public menuItem: MenuItems, public dialog: MatDialog) {
    router.events.subscribe(value => {
      if(value instanceof NavigationEnd){
        if(
          router.url.indexOf('delivery-submit')!=-1 ||
          router.url.indexOf('my-jobs-Delivering')!=-1
        ){
          this.isDeliverySubmit = true
        }else{
          this.isDeliverySubmit = false
        }
      }
    });
  }

  Logout() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent,{data:'Logout'});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        localStorage.removeItem('token');
        localStorage.removeItem('firstName')
        localStorage.clear();
        this.router.navigate(['/']);
      }
    })
  }
}