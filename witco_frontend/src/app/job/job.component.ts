import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { event, map } from 'jquery';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.css']
})

export class JobComponent implements OnInit,AfterViewInit {

  @ViewChild('search',{static:false}) searchInput:ElementRef
  filteredItems:any[] =[];
  object = Object
  customerForm: FormGroup;
  searchCustomer= false;
  driverDetails: any;
  saveCustomerDetails: boolean = true;
  changeInputBool:boolean =true;
  changetext = true;
  customer_id: string = '';
  job_id:any;
  goods_id: string = '';
  searchTerm: string = '';
  searchformdisplay:boolean=true;
  jobStatus:any
  goodsForm = this.fb.group({
    inv_temp: [''],
    invoiceNumber: ['',Validators.required],
    zipcode: [null, Validators.pattern(/^[0-9]{6}$/)],
    goods: this.fb.array([])
  });
  previousValues: { [key: string]: any } = {};
  driverForm = new FormControl('');
  formId: any;
  show: boolean;
  title: any
  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastrService,
  ) {

  }

  ngOnInit() {
    this.customerForm = this.fb.group({
      firstName: ['',Validators.compose([Validators.required,Validators.pattern("[a-zA-Z][a-zA-Z ]+")])],
      lastName: ['',Validators.compose([Validators.pattern("[a-zA-Z][a-zA-Z ]+")])],
      companyName: [''],
      email: [null, Validators.compose([Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")])],
      code:["+65",Validators.required],
      phone: [null, Validators.compose([Validators.required,Validators.pattern(/^(\+65)?\d{8}$/)])],
      address: [''],
      deliveryAddress: ['', Validators.required],
      userRole: ['customer']
    });

    

    this.route.paramMap.subscribe(params => {
      var userID = params.get('id');
      this.jobStatus =params.get('job')
      this.job_id=userID
      if (userID) {
        this.formId = userID
        this.show = false;
        this.title = "Edit User Form"
        this.searchformdisplay = false
        this.getCustomerForm(userID);
      }
      else {
        this.show = true;
        this.title = "New Customer"
        this.addGoods();
      }
    })
  }

  ngAfterViewInit(): void {
    if(this.searchformdisplay){
    const searchInput= fromEvent<any>(this.searchInput.nativeElement,'keyup').pipe(
      tap((res) => res),
      debounceTime(300),
      distinctUntilChanged()
    )
    searchInput.subscribe(res=>{
      let search= {
        query:this.searchTerm
      }
      let searchitem = this.searchTerm.trim();
      if(res.code != 'Space' && searchitem.length >= 3 && searchitem != '') {
        this.authService.postData('user/search',search).subscribe((res:any)=>{
          this.filteredItems =res.data
        })
      }
      if(this.searchTerm == '')
      {
        this.filteredItems=[]
      }
    })
  }
  }
  get goods() {
    return this.goodsForm.controls['goods'] as FormArray;
  }

  addGoods() {
    const good = this.fb.group({
      goodsName: ['', Validators.required],
      quantity: ['', Validators.compose([Validators.required,Validators.pattern("^[0-9]*$")])],
      // unitPrice: ['', Validators.compose([Validators.required,Validators.pattern("^[0-9]*$")])],
      // amount: ['']
    })
    this.goods.push(good);
  }
  onSubmit() {
    this.authService.setLoader(true);
    let value = this.customerForm.value;
      let job={
        firstName:value.firstName,
        lastName:value.lastName ,
        companyName:value.companyName,
        email:value.email,
        phone:value.code+value.phone ,
        address:value.address,
        deliveryAddress: value.deliveryAddress,
        userRole:'customer'
      }
    if (!this.formId && !this.searchCustomer) {
      this.authService.postData('customer/add', job).subscribe(response => {
        if (response) {
          this.customer_id = response.data._id;
          this.saveCustomerDetails = false;
          this.toastService.success('Customer Added Successfully...');
        }
        this.authService.setLoader(false);
      }, error => {
        this.authService.setLoader(false);
        this.toastService.error(error);
      }
      );
    }
    else  if (!this.formId && this.searchCustomer) {
      this.authService.setLoader(false);
      this.saveCustomerDetails = false;
    }
    else {  
      let job={
        customer_firstName:value.firstName,
        customer_lastName:value.lastName ,
        customer_companyName:value.companyName,
        customer_email:value.email,
        customer_phone:value.code+value.phone ,
        customer_address:value.address,
        customer_deliveryAddress: value.deliveryAddress,
        userRole:'customer'
      }
      this.authService.patchData(`jobs/edit/${this.job_id}`, job).subscribe((res:any) => {
        this.authService.setLoader(false);
      this.saveCustomerDetails = true;
        if (res) {
          this.previousValues = {
            firstName: res.data.customer_firstName,
            lastName: res.data.customer_lastName,
            companyName: res.data.customer_companyName,
            email: res.data.customer_email,
            code:res.data.customer_phone.slice(0,3),
            phone:res.data.customer_phone.slice(3,),
            address: res.data.customer_address,
            userRole: 'customer'
          }
          this.saveCustomerDetails = false;
          this.toastService.success('Job Updated Successfully...');
          this.changeInputBool = false
        }
      }, error => {
        this.authService.setLoader(false);
        this.toastService.error(error);
      })

    }
  }

  onsubmitGood() {
    
    if (!this.formId) {
      // this.goods.value.forEach((res: any) => {
      //   res.amount = res.quantity * res.unitPrice;
      // })
      this.authService.postData('goods/add', this.goodsForm.value).subscribe((res: any) => {
        this.goods_id = res.data._id;
        let value= this.customerForm.value;
        let data = {
          customer_firstName:value.firstName,
          customer_lastName:value.lastName,
          customer_companyName:value.companyName,
          customer_email:value.email,
          customer_phone:value.code+value.phone,
          customer_address:value.address,
          customer_deliveryAddress: value.deliveryAddress,
          goods_id: this.goods_id
        }
        this.authService.postData('jobs/add', data).subscribe((res: any) => {
          this.toastService.success('Goods Added and Job Created Successfully...');
          this.router.navigate(['/delivery-order'], { relativeTo: this.route })

        },    
        error => {
          this.authService.setLoader(false);
          this.toastService.error(error);
        })
      },
      error => {
        this.authService.setLoader(false);
        this.toastService.error(error);
      })
    }
    else{
      // this.goods.value.forEach((res: any) => {
      //   res.amount = res.quantity * res.unitPrice;
      // })
      this.authService.patchData(`goods/edit/${this.goods_id}`, this.goodsForm.value).subscribe((res: any) => {
        this.goods_id = res.data._id;
        let data = {
          customer_id: this.customer_id,
          goods_id: this.goods_id
        }
        this.authService.patchData(`jobs/edit/${this.formId}`, data).subscribe((res: any) => {
          this.toastService.success('Goods Added and Job Created Successfully...');
          if(this.jobStatus == 'true'){
            this.router.navigate(['/delivery-order'], { relativeTo: this.route })
          }
          else{
              this.router.navigate(['/all-do'], { relativeTo: this.route });
          }
        })
      })
    }
  }
  getCustomerForm(id) {
    this.authService.setLoader(true)
    this.authService.getData(`jobs/get/${id}`).subscribe(res => {
      this.customer_id=res.data.job.customer_id
      this.goods_id = res.data.job.goods_id;
      this.customerForm.patchValue({
        firstName: res.data.job.customer_firstName,
        lastName: res.data.job.customer_lastName,
        companyName: res.data.job.customer_companyName,
        email: res.data.job.customer_email,
        code:res.data.job.customer_phone.slice(0,3),
        phone:res.data.job.customer_phone.slice(3,),
        address: res.data.job.customer_address,
        userRole: 'customer'
      });
      this.authService.getData(`goods/get/${this.goods_id}`).subscribe((response: any) => {
        let good = response.data;
          this.goodsForm.patchValue({
            inv_temp: good.inv_temp,
            invoiceNumber: good.invoiceNumber,
            zipcode:good.zipcode,
            goods: this.setGood(good.goods)
          })
      },(err)=>{
        this.authService.setLoader(false)
      })
      this.saveCustomerDetails = true;
      this.previousValues = {
        firstName: res.data.job.customer_firstName,
        lastName: res.data.job.customer_lastName,
        companyName: res.data.job.customer_companyName,
        email: res.data.job.customer_email,
        code:res.data.job.customer_phone.slice(0,3),
        phone:res.data.job.customer_phone.slice(3,),
        address: res.data.job.customer_address,
        deliveryAddress: res.data.job.customer_deliveryAddress,
        userRole: 'customer'
      }
    },(err)=>{
    });
    this.authService.setLoader(false)
  }
   areFormControlsSame(): boolean {
    if(this.show === false){
      return Object.keys(this.customerForm.controls).every((controlName) => {
        const currentValue = this.customerForm.get(controlName).value;
        const previousValue = this.previousValues[controlName];
        this.changetext = currentValue === previousValue;
        return currentValue === previousValue;
      });
    }
    else {
      return true
    }
  }
  setGood(data: any) {
      data.forEach(res => {
        const good = this.fb.group({
          goodsName: res.goodsName,
          quantity:[res.quantity, Validators.compose([Validators.required,Validators.pattern("^[0-9]*$")])],
          // unitPrice: [res.unitPrice, Validators.compose([Validators.required,Validators.pattern("^[0-9]*$")])],
          // amount: res.amount
        })
        this.goods.push(good);
      })
    }
  removeGood(i){
    this.goods.removeAt(i);
  }

  setForm(data:any){
    this.customerForm.patchValue({
      firstName: data.firstName,
      lastName: data.lastName,
      companyName: data.companyName,
      email: data.email,
      code:data.phone.slice(0,3),
      phone: data.phone.slice(3,),
      address: data.address,
      deliveryAddress: data.deliveryAddress,
      userRole: data.userRole
    });
    this.customer_id= data._id;
    this.filteredItems = [];
    this.searchTerm =''
    this.searchCustomer = true;
    this.saveCustomerDetails= false
  }
}
