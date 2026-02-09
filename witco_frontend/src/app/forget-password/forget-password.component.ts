import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup,Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent implements OnInit {
  otpInput:boolean=false;
  mobileNo=new FormControl();
  otp = new FormControl();
  constructor(private router: Router,private authService: AuthService, private toast: ToastrService,private route: ActivatedRoute) { }

  ngOnInit() {
  }
  getOtp(){
    const mobileNo = this.mobileNo.value;
    if(mobileNo){
      this.authService.postData('user/generateOtp',{"phone":mobileNo}).subscribe(response => {
        this.authService.setLoader(false);
        if (response.data.otp) {
          this.otpInput=true;
          this.toast.success('Otp Send Successfully...');
        }
      }, error => {
          this.authService.setLoader(false);
          this.toast.error(error);
        });
    }
  }
  
  login(){
    this.router.navigate(['/login']);
  }
  submitOtp(){
      if(this.otp.value){
      this.authService.postData('user/verifyotp',{"otp":this.otp.value}).subscribe(response => {
        this.authService.setLoader(false);
        localStorage.setItem('token', response.token);
        localStorage.setItem('userData',JSON.stringify(response.data.user));
        this.router.navigate(['/new-password']);
        this.toast.success('Otp Verified Successfully...');


      }, error => {
          this.authService.setLoader(false);
          this.toast.error(error);
        });
    }
  }
}
