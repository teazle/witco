import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';

@Component({
  selector: 'app-add-new-user',
  templateUrl: './add-new-user.component.html',
  styleUrls: ['./add-new-user.component.css']
})
export class AddNewUserComponent implements OnInit {

  data = [];
  userForm: FormGroup;
  userFormErrors: any;
  formId;
  title;
  show;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private formBuilder: FormBuilder, private toastService: ToastrService, private authService: AuthService, private route: ActivatedRoute) {
    this.activatedRoute.paramMap.subscribe(params => {
      this.formId = params.get('id');
    });
  }

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      firstName: ['', Validators.compose([Validators.required,Validators.pattern("[a-zA-Z][a-zA-Z ]+")])],
      lastName: ['', Validators.compose([Validators.pattern("[a-zA-Z][a-zA-Z ]+")])],
      email: ['', Validators.compose([Validators.required,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")])],
      password: ['',Validators.required],
      code:["+65",Validators.required],
      phone: ['', Validators.compose([Validators.required,Validators.pattern(/^(\+65)?\d{8}$/)])],
      // address:['',Validators.required],
      vehicleNumber:[''],
      // licenceNumber:['',Validators.required],
      governmentIDs:['']
    });

    this.userForm.valueChanges.subscribe(() => {
      this.onUserFormValuesChanged();
    });

    this.activatedRoute.paramMap.subscribe(params => {
      var userID = params.get('id');
      if (userID) {
        this.show = false;
        this.title = "Edit Driver"
        this.getUserForm(userID);
      }
      else {
        this.show = true;
        this.title = "Driver"
      }
    });
  }

  get f() {
    return this.userForm.controls;
  }

  onSubmit() {
    let value = this.userForm.value;
    this.authService.setLoader(true);
    let data= {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      password:value.password,
      phone: value.code+ value.phone,
      // address:value.address,
      vehicleNumber:value.vehicleNumber,
      // licenceNumber:value.licenceNumber,
      governmentIDs:value.governmentIDs
    }
    if (!this.formId) {
        this.authService.postData('driver/add', data).subscribe(response => {
          this.authService.setLoader(false);
          if (response) {
            this.authService.sendUserData(response);
            this.router.navigate(['/starter'], { relativeTo: this.route });
            this.toastService.success('Driver Added Successfully...');
          }
        }, error => {
          this.authService.setLoader(false);
          this.toastService.error(error);
        }
        );
     }
    else {
        this.authService.patchData(`driver/edit/${this.formId}`,data).subscribe(res => {
          this.authService.setLoader(false);
          if (res) {
            this.router.navigate(['/starter'], { relativeTo: this.route });
            this.toastService.success('Driver Updated Successfully...');
           }
        }, error => {
          this.authService.setLoader(false);
          this.toastService.error(error);
        })
     
    }
  }



  getUserForm(id) {
    this.authService.setLoader(true)
    this.authService.getData(`driver/get/${id}`).subscribe(res => {
      let data= res.data;
      this.userForm.patchValue({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password:data.password,
        code:data.phone.slice(0,3),
        phone: data.phone.slice(3,),
        // address:data.address,
        vehicleNumber:data.vehicleNumber,
        // licenceNumber:data.licenceNumber,
        governmentIDs:data.governmentIDs
      })
      this.authService.setLoader(false)
    })
  }

  onUserFormValuesChanged() {
    for (const field in this.userFormErrors) {
      if (!this.userFormErrors.hasOwnProperty(field)) {
        continue;
      }

      // Clear previous errors
      this.userFormErrors[field] = {};

      // Get the control
      const control = this.userForm.get(field);

      if (control && control.dirty && !control.valid) {
        this.userFormErrors[field] = control.errors;
      }
    }
  }
}
