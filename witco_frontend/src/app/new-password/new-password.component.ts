import { Component, OnInit } from '@angular/core';
import{FormGroup,FormBuilder, Validators} from '@angular/forms';
import { PasswordValidator } from '../../shared/password.validators';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute,Router } from '@angular/router';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css']
})
export class NewPasswordComponent implements OnInit {
  newPasswordForm: FormGroup;
  newPasswordFormErrors: any;

  constructor(private router: Router, private route: ActivatedRoute,private formBuilder: FormBuilder,private authService: AuthService,private toast: ToastrService) {
    this.newPasswordFormErrors = {
      NewPassword: [''],
      NewConfirmPassword: ['']
    };
   }

  ngOnInit() {
    this.newPasswordForm = this.formBuilder.group({
      NewPassword: ['', [Validators.required]],
      NewConfirmPassword: ['', [Validators.required]]
    }, { validator: PasswordValidator });
  }
  onLoginFormValuesChanged() {
    for (const field in this.newPasswordFormErrors) {
      if (!this.newPasswordFormErrors.hasOwnProperty(field)) {
        continue;
      }

      this.newPasswordFormErrors[field] = {};

      const control = this.newPasswordForm.get(field);

      if (control && control.dirty && !control.valid) {
        this.newPasswordFormErrors[field] = control.errors;
      }
    }
  }
  save(data){
    let value= {
      password: data.NewPassword,
      verifypassword:data.NewConfirmPassword 
    }
    this.authService.postData('user/newpassword',value).subscribe(response => {
      this.authService.setLoader(false);
      if (response.status == "success") {
        this.toast.success('Password Changed Successfully...');
        localStorage.clear()
        this.router.navigate(['/login'])
      }
    }, error => {
        this.authService.setLoader(false);
        this.toast.error(error);
      });

  }

}
