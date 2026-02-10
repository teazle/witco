import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-new-customer',
  templateUrl: './add-new-customer.component.html',
  styleUrls: ['./add-new-customer.component.css']
})
export class AddNewCustomerComponent implements OnInit {
  formId:any;
  customerForm:FormGroup;
  show:boolean;
  title:any

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute, 
    private formBuilder: FormBuilder, 
    private toastService: ToastrService, 
    private authService: AuthService, 
    ) {
    this.activatedRoute.paramMap.subscribe(params => {
      this.formId = params.get('id');
    });
   }

  ngOnInit() {
      this.customerForm = this.formBuilder.group({
        firstName: ['',Validators.compose([Validators.required,Validators.pattern("[a-zA-Z][a-zA-Z ]+")])],
        lastName: ['',Validators.compose([Validators.pattern("[a-zA-Z][a-zA-Z ]+")])],
        companyName: [''],
        email: [null, Validators.compose([Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")])],
        code:["+65",Validators.required],
        phone: [null, Validators.compose([Validators.required,Validators.pattern(/^(\+65)?\d{8}$/)])],
        address: [''],
        deliveryAddress: [''],
        userRole: ['customer']
      });


     this.activatedRoute.paramMap.subscribe(params => {
      var userID = params.get('id');
      if (userID) {
        this.show = false;
        this.title = "Edit Customer"
        this.getCustomerForm(userID);
      }
      else {
        this.show = true;
        this.title = "New Customer"
      }
    })
  }
  get f() {
    return this.customerForm.controls;
  }

  onSubmit() {
    let value = this.customerForm.value;
    this.authService.setLoader(true);
      let data= {
        firstName: value.firstName,
        lastName: value.lastName,
        companyName:value.companyName, 
        email: value.email,
        phone: value.code+ value.phone,
        address:value.address,
        deliveryAddress: value.deliveryAddress,
        userRole:value.userRole
    }
    if (!this.formId) {
        this.authService.postData('customer/add', data).subscribe(response => {
          this.authService.setLoader(false);
          if (response) {
            this.authService.sendUserData(response);
            this.router.navigate(['/customer'], { relativeTo: this.activatedRoute });
            this.toastService.success('Customer Added Successfully...');
          }
        }, error => {
          this.authService.setLoader(false);
          this.toastService.error(error);
        }
        );
     }
    else {
        this.authService.patchData(`customer/edit/${this.formId}`,data).subscribe(res => {
          this.authService.setLoader(false);
          if (res) {
            this.router.navigate(['/customer'], { relativeTo: this.activatedRoute });
            this.toastService.success('Customer Updated Successfully...');
           }
        }, error => {
          this.authService.setLoader(false);
          this.toastService.error(error);
        })
     
    }
  }
  getCustomerForm(id) {
    this.authService.setLoader(true)
    this.authService.getData(`customer/get/${id}`).subscribe(res => {
      let data= res.data;
        this.customerForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          companyName:data.companyName, 
          email: data.email,
          code:data.phone.slice(0,3),
          phone: data.phone.slice(3,),
          address:data.address,
          deliveryAddress: data.deliveryAddress,
          userRole:data.userRole
        })
      this.authService.setLoader(false)
    })
  }

}
