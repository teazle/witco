import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms'
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { PasswordValidator } from '../../shared/password.validators';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  loginForm: FormGroup;
  loginFormErrors: any;

  constructor(private router: Router, private formBuilder: FormBuilder, private authService: AuthService, private toast: ToastrService) {
    this.loginFormErrors = {
      OldPassword: [''],
      NewPassword: [''],
      NewConfirmPassword: ['']
      
    };
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      OldPassword: ['', Validators.required],
      NewPassword: ['', [Validators.required]],
      NewConfirmPassword: ['', [Validators.required]]
    }, { validator: PasswordValidator });
  }

  onLoginFormValuesChanged() {
    for (const field in this.loginFormErrors) {
      if (!this.loginFormErrors.hasOwnProperty(field)) {
        continue;
      }

      this.loginFormErrors[field] = {};

      const control = this.loginForm.get(field);

      if (control && control.dirty && !control.valid) {
        this.loginFormErrors[field] = control.errors;
      }
    }
  }

  save(data) {  
    this.authService.postData('user/reset-password',data).subscribe(response => {
      this.authService.setLoader(false);
      if (response.status == "success") {
        this.toast.success('Password reset Successfully...');
        this.router.navigate(['/Userprofile']);
      }
    }, error => {
        this.authService.setLoader(false);
        this.toast.error(error);
      });
  }

}


