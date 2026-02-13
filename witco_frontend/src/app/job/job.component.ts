import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, fromEvent, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, switchMap } from 'rxjs/operators';
import { event, map } from 'jquery';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.css']
})

export class JobComponent implements OnInit,AfterViewInit {

  @ViewChild('search',{static:false}) searchInput:ElementRef
  @ViewChild('docInput', { static: false }) docInput: ElementRef;
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
  inventorySuggestions: any[] = [];
  inventoryLoading = false;
  private inventorySearch$ = new Subject<string>();
  documentFile: File | null = null;
  parseWarnings: string[] = [];
  isParsing = false;
  isDragOver = false;
  parsedDraft: any = null;
  draftOptions = {
    customer: true,
    contact: true,
    delivery: true,
    invoice: true,
    goods: true
  };
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

    this.inventorySearch$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          const query = (term || '').trim();
          if (!query || query.length < 2) {
            this.inventorySuggestions = [];
            this.inventoryLoading = false;
            return of({ data: [] });
          }
          this.inventoryLoading = true;
          return this.authService.getData(`inventory/search?query=${encodeURIComponent(query)}&limit=20`);
        })
      )
      .subscribe((res: any) => {
        this.inventoryLoading = false;
        this.inventorySuggestions = res && res.data ? res.data : [];
      }, () => {
        this.inventoryLoading = false;
        this.inventorySuggestions = [];
      });
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

  onGoodsNameInput(index: number) {
    const goodsControl = this.goods.at(index).get('goodsName');
    const value = goodsControl ? (goodsControl.value || '') : '';
    this.inventorySearch$.next(value);
  }

  onDocumentSelected(event: any) {
    const file = event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    this.handleDocument(file);
  }

  triggerBrowse() {
    if (this.docInput && this.docInput.nativeElement) {
      this.docInput.nativeElement.click();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) return;
    this.handleDocument(file);
  }

  handleDocument(file: File) {
    this.documentFile = file;
    this.parseDocument(file);
    if (this.docInput && this.docInput.nativeElement) {
      this.docInput.nativeElement.value = '';
    }
  }

  parseDocument(file: File) {
    const formData = new FormData();
    formData.append('document', file);
    this.isParsing = true;
    this.authService.postData('jobs/parse-document', formData).subscribe((res: any) => {
      const data = res.data || {};
      this.parsedDraft = data;
      this.parseWarnings = data.warnings || [];
      this.isParsing = false;
      this.toastService.success('Document parsed. Review the draft before applying.');
    }, error => {
      this.isParsing = false;
      this.toastService.error(error);
    });
  }

  getGoodsDisplayName(item: any): string {
    if (!item) return '';
    return item.parsedName || item.goodsName || item.rawName || '';
  }

  getGoodsConfidencePercent(item: any): number {
    const confidence = Number(item && item.extractionConfidence);
    if (!Number.isFinite(confidence)) return 0;
    return Math.max(0, Math.min(100, Math.round(confidence * 100)));
  }

  isLowConfidenceGoods(item: any): boolean {
    const flags = item && Array.isArray(item.flags) ? item.flags : [];
    return flags.includes('low_extraction_confidence') || flags.includes('low_match_confidence');
  }

  hasLowConfidenceGoods(data: any): boolean {
    if (!data || !Array.isArray(data.goods)) return false;
    return data.goods.some((item) => this.isLowConfidenceGoods(item));
  }

  applyParsedData(data: any, options?: any) {
    const selected = options || this.draftOptions;
    const name = (data.customerName || '').trim();
    let firstName = '';
    let lastName = '';
    if (name) {
      const parts = name.split(/\s+/);
      firstName = parts.shift();
      lastName = parts.join(' ');
    }

    const phoneDigits = (data.customerPhone || '').replace(/\D/g, '');
    const phone = phoneDigits ? phoneDigits.slice(-8) : '';

    if (selected.customer) {
      this.customerForm.patchValue({
        firstName: firstName || this.customerForm.get('firstName').value,
        lastName: lastName || this.customerForm.get('lastName').value,
        companyName: data.customerCompany || this.customerForm.get('companyName').value,
      });
    }

    if (selected.contact) {
      this.customerForm.patchValue({
        email: data.customerEmail || this.customerForm.get('email').value,
        phone: phone || this.customerForm.get('phone').value,
      });
    }

    if (selected.delivery) {
      this.customerForm.patchValue({
        deliveryAddress: data.deliveryAddress || this.customerForm.get('deliveryAddress').value,
      });
    }

    if (selected.invoice) {
      this.goodsForm.patchValue({
        invoiceNumber: data.invoiceNumber || this.goodsForm.get('invoiceNumber').value,
        inv_temp: data.poNumber || this.goodsForm.get('inv_temp').value,
      });
    }

    if (selected.goods && Array.isArray(data.goods) && data.goods.length) {
      while (this.goods.length) {
        this.goods.removeAt(0);
      }
      data.goods.forEach((item) => {
        const good = this.fb.group({
          goodsName: [this.getGoodsDisplayName(item) || '', Validators.required],
          quantity: [item.quantity || '', Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
        });
        this.goods.push(good);
      });
    }
  }

  applyDraft() {
    if (!this.parsedDraft) return;
    this.applyParsedData(this.parsedDraft, this.draftOptions);
    const hasLowConfidence = this.hasLowConfidenceGoods(this.parsedDraft);
    this.parsedDraft = null;
    if (hasLowConfidence) {
      this.toastService.warning('Draft applied with low-confidence goods. Please review before submit.');
    } else {
      this.toastService.success('Draft applied.');
    }
  }

  discardDraft() {
    this.parsedDraft = null;
    this.toastService.warning('Draft discarded.');
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
      const deliveryAddress = value.deliveryAddress || value.address || '';
      let job={
        customer_firstName:value.firstName,
        customer_lastName:value.lastName ,
        customer_companyName:value.companyName,
        customer_email:value.email,
        customer_phone:value.code+value.phone ,
        customer_address:value.address,
        customer_deliveryAddress: deliveryAddress,
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
            deliveryAddress: res.data.customer_deliveryAddress || res.data.customer_address || '',
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
        const customerValue = this.customerForm.value;
        const deliveryAddress = customerValue.deliveryAddress || customerValue.address || '';
        let data = {
          customer_id: this.customer_id,
          goods_id: this.goods_id,
          customer_address: customerValue.address || '',
          customer_deliveryAddress: deliveryAddress
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
        deliveryAddress: res.data.job.customer_deliveryAddress || res.data.job.customer_address || '',
        userRole: 'customer'
      });
      this.authService.getData(`goods/get/${this.goods_id}`).subscribe((response: any) => {
        let good = response.data;
          this.goodsForm.patchValue({
            inv_temp: good.inv_temp,
            invoiceNumber: good.invoiceNumber,
            zipcode:good.zipcode,
            goods: this.setGood(good.goods)
          });
          const deliveryAddressFallback =
            this.customerForm.get('deliveryAddress').value ||
            good.deliveryAddress ||
            this.customerForm.get('address').value ||
            '';
          this.customerForm.patchValue({
            deliveryAddress: deliveryAddressFallback
          });
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
        deliveryAddress: res.data.job.customer_deliveryAddress || res.data.job.customer_address || '',
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
    const phoneRaw = String(data.phone || '');
    const phoneDigits = phoneRaw.replace(/\D/g, '');
    const localPhone = phoneDigits.length >= 8 ? phoneDigits.slice(-8) : '';
    const deliveryAddress = data.deliveryAddress || data.address || '';
    const hasPersistedCustomer = !!data._id && !data.fromHistory;
    this.customerForm.patchValue({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      companyName: data.companyName || '',
      email: data.email || null,
      code: '+65',
      phone: localPhone,
      address: data.address || '',
      deliveryAddress,
      userRole: data.userRole || 'customer'
    });
    this.customer_id = hasPersistedCustomer ? data._id : '';
    this.filteredItems = [];
    this.searchTerm =''
    this.searchCustomer = hasPersistedCustomer;
    this.saveCustomerDetails= false
  }
}
