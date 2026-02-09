import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userDetails:any;
  profileForm: FormGroup | any;
  constructor(
    private formBuilder: FormBuilder,
    private router:Router,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    let user = localStorage.getItem('userData');
    this.userDetails = user && JSON.parse(user);
    this.profileForm = this.formBuilder.group({
      firstName: [this.userDetails.firstName,[Validators.required]],
      lastName: [this.userDetails.lastName,[Validators.required]],
      email: [this.userDetails.email, [Validators.required]],
      address: [this.userDetails.address, [Validators.required]],
      phone:[this.userDetails.phone,[Validators.required]],
      licenceNumber:[this.userDetails.licenceNumber,[Validators.required]],
      governmentIDs:[this.userDetails.governmentIDs,[Validators.required]]

    });
  }
  Logout(){
    const dialogRef = this.dialog.open(ConfirmDialogComponent,{data:'Logout'});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
          localStorage.removeItem('token');
          localStorage.removeItem('firstName')
          localStorage.clear();
          this.router.navigate(['/']);
      }
    });
}
forgetPassword(){
this.router.navigate(['/userReset'])
}
  async updateData(value: any) {
      // this.loginService.updateData(`user/loginUpdate`, value).subscribe(
      //   (data) => {
      //     for (const [key1, value1] of Object.entries(this.userDetails)) {
      //       for (const [key2, value2] of Object.entries(value)) {
      //         if (key1 === key2) {
      //           this.userDetails[key1] = value2;
      //         }
      //       }
      //     }
      //     if (value.userImage) {
      //       this.loginService.userImage.next(value.userImage);
      //     }
      //     localStorage.setItem('userData', JSON.stringify(this.userDetails));
      //     this.loginService.setSuccess('User Profile Updated..');
      //   },
      //   (err) => {
      //     this.loginService.setError(err);
      //   }
      // );
    }
}
