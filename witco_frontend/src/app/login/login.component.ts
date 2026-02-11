import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material'
import { AuthService } from '../services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {

  loginForm: FormGroup;
  loginFormErrors: any;
  latitude:any;
  longitude:any
  @ViewChild('bgVideo', { static: false }) bgVideo: ElementRef<HTMLVideoElement>;
  showPassword:boolean = false; 
  constructor(private router: Router, private authService: AuthService, private formBuilder: FormBuilder, private toast : ToastrService) {
    this.loginFormErrors = {
      email: {},
      password: {}
    };
  } 

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.loginForm.valueChanges.subscribe(() => {
      this.onLoginFormValuesChanged(); 
    });
  }

  ngAfterViewInit() {
    this.ensureVideoPlayback();
  }

  private ensureVideoPlayback() {
    if (!this.bgVideo || !this.bgVideo.nativeElement) {
      return;
    }
    const video = this.bgVideo.nativeElement;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('playsinline', 'true');
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Keep poster visible if autoplay is blocked.
      });
    }
  }

   onSubmit(data) {
    this.authService.setLoader(true);
    this.authService.postData('user/check',{"email":data.email}).subscribe(response => {
      this.authService.setLoader(false);
      if(response.data == true){
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                this.latitude = position.coords.latitude;
                this.longitude = position.coords.longitude;
               let value= {
                  email: data.email,
                  password:data.password,
                  loc:[this.latitude,this.longitude]
                }
                this.authService.postData('user/login',value).subscribe(response => {
                  this.authService.setLoader(false);
                  if (response.data) {
                    const res = response;
                    localStorage.setItem('token', res.token);
                    localStorage.setItem('userData',JSON.stringify(res.data.user));
                    let user= localStorage.getItem('userData');
                    let userData = user && JSON.parse(user);
                    
                    if(userData.userRole == 'driver'){
                    this.router.navigateByUrl('/my-jobs-Delivering');
                    }
                    if(userData.userRole == 'admin')
                    {
                      this.router.navigateByUrl('/starter');
                    }
                  }
                }, error => {
                    this.authService.setLoader(false);
                    const msg = typeof error === 'string' ? error : (error && error.error && error.error.message) || (error && error.message) || 'Login failed';
                    this.toast.error(msg);
                  });
              },
              (error) => {
                this.authService.setLoader(false);
              if(error.code == 1){
               this.toast.error("Please Enable Location First");
               }
               console.log('Geolocation error:', error);  
              }
            );
          } else {
            this.toast.error("Geolocation is not supported by this browser");
          }
      }else{

        let value= {
          email: data.email,
          password:data.password,
        }
        this.authService.postData('user/login',value).subscribe(response => {
          this.authService.setLoader(false);
          if (response.data) {
            const res = response;
            localStorage.setItem('token', res.token);
            localStorage.setItem('userData',JSON.stringify(res.data.user));
            let user= localStorage.getItem('userData');
            let userData = user && JSON.parse(user);
            
            if(userData.userRole == 'driver'){
            this.router.navigateByUrl('/my-jobs-Delivering');
            }
            if(userData.userRole == 'admin')
            {
              this.router.navigateByUrl('/starter');
            }
          }
        }, error => {
            this.authService.setLoader(false);
            const msg = typeof error === 'string' ? error : (error && error.error && error.error.message) || (error && error.message) || 'Login failed';
            this.toast.error(msg);
          });

      }
    }, error => {
      this.authService.setLoader(false);
      const msg = typeof error === 'string' ? error : (error && error.error && error.error.message) || (error && error.message) || 'Request failed';
      this.toast.error(msg);
    });
}

onLoginFormValuesChanged() {
  for (const field in this.loginFormErrors) {
    if (!this.loginFormErrors.hasOwnProperty(field)) {
      continue;
    }

    // Clear previous errors
    this.loginFormErrors[field] = {};

    // Get the control
    const control = this.loginForm.get(field);

    if (control && control.dirty && !control.valid) {
      this.loginFormErrors[field] = control.errors;
    }
  }
}
togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}
}
