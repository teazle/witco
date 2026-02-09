import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatTableDataSource } from '@angular/material';
import { AuthService } from '../services/auth.service';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-all-do',
  templateUrl: './all-do.component.html',
  styleUrls: ['./all-do.component.css']
})
export class AllDoComponent implements OnInit {

  driverInputValue;
  doNumberInputValue = '';
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  options: any[] = [];
  
  driverOption:any[]=[];
  driverDetails:any
  dataSource= new MatTableDataSource<any>();
  selectedVal:any='Delivering';
  fromDate: Date | undefined;
  toDate: Date | undefined;
  toDay = new Date();
  length = 0;
  pageSize = 5;
  currentPage = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  displayedColumns: string[] = ['srno','customer', 'invoiceNumber','inv_temp', 'customer_companyName','deliveryAddress','driver','driverEmail','vehicleNumber','Date','action','editJob'];
  displayedColumnsDelivered: string[] = ['srno','invoice_no','customer', 'invoiceNumber','inv_temp', 'customer_companyName', 'deliveryAddress','driver','driverEmail','vehicleNumber','DeliveryDate','action','pdf','invoice'];
  selectedDriver:any;
  sortField = 'delivery_time';
  sortType: 'ASCE' | 'DESC' = 'DESC';
  searchField = 'invoiceNumber';
  searchValue = '';
  sortFieldOptions = [
    { label: 'Delivery Date', value: 'delivery_time' },
    { label: 'DO Number', value: 'invoiceNumber' },
    { label: 'PO Number', value: 'inv_temp' },
    { label: 'Company Name', value: 'customer_companyName' },
    { label: 'Customer First Name', value: 'customer_firstName' },
    { label: 'Driver First Name', value: 'driver_firstName' },
    { label: 'Invoice Number', value: 'invoice_no' },
  ];
  searchFieldOptions = [
    { label: 'DO Number', value: 'invoiceNumber' },
    { label: 'PO Number', value: 'inv_temp' },
    { label: 'Invoice Number', value: 'invoice_no' },
    { label: 'Company Name', value: 'customer_companyName' },
    { label: 'Customer First Name', value: 'customer_firstName' },
    { label: 'Customer Last Name', value: 'customer_lastName' },
    { label: 'Driver First Name', value: 'driver_firstName' },
    { label: 'Driver Last Name', value: 'driver_lastName' },
    { label: 'Driver Email', value: 'driver_email' },
    { label: 'Delivery Address', value: 'deliveryAddress' },
  ];
  @ViewChild('fromInput', {static: false}) fromInput:ElementRef;
  @ViewChild('toInput', {static: false}) toInput:ElementRef
  drivername: any =[];
  constructor(
    private authService: AuthService,
    private toastService:ToastrService,
    private model:MatDialog,
    private router:Router,
    private route : ActivatedRoute,
  ) {}

    ngOnInit(): void {
      this.deliveringOrder();
      this.getAllDriver();
    }

  invoiceUpdate(invoice_no: string, job_id: string) {
    console.log("job_id", job_id);
    let data = { invoice_no, job_id };
    this.authService.postData('jobs/updateInvoice', data).subscribe(
      (res: any) => {
        console.log("updated", res);
      },
      error => {
        console.log(error);
      }
    );
  }
    deliveringOrder(){
    this.currentPage = 0;
    this.sortField = 'updatedAt';
    this.sortType = 'DESC';
    this.searchJobs();
  }

  delivered(){
    this.currentPage = 0;
    this.sortField = 'delivery_time';
    this.sortType = 'DESC';
    this.searchJobs();
  }
  handlePageEvent(event:any){
    this.pageSize=event.pageSize;
    this.currentPage=event.pageIndex;

    if(this.selectedVal == 'Delivering')
    {
      this.searchJobs();
    }
    if(this.selectedVal == 'Delivered')
    {
      this.searchJobs();
    }
    
  }
  searchJobs() {
    this.authService.setLoader(true);
    const qp: string[] = [
      `status=${this.selectedVal}`,
      `pagesize=${this.pageSize}`,
      `page=${this.currentPage + 1}`,
    ];

    if (this.fromDate && this.toDate) {
      qp.push(`fromDate=${moment(this.fromDate).format('YYYY-MM-DD')}`);
      qp.push(`toDate=${moment(this.toDate).format('YYYY-MM-DD')}`);
    }

    if (this.driverInputValue) {
      const driver = (this.driverDetails || []).find((res: any) => {
        return res.firstName == this.driverInputValue.split(' ')[0] && res.lastName == this.driverInputValue.split(' ')[1];
      });
      if (!driver) {
        this.toastService.error('Driver not found');
        this.authService.setLoader(false);
        return;
      }
      qp.push(`driver_email=${encodeURIComponent(driver.email)}`);
    }

    if (this.doNumberInputValue && this.doNumberInputValue.trim()) {
      qp.push(`invoiceNumber=${encodeURIComponent(this.doNumberInputValue.trim())}`);
    }

    if (this.sortField && this.sortField !== 'None') {
      qp.push(`field=${encodeURIComponent(this.sortField)}`);
      qp.push(`type=${encodeURIComponent(this.sortType)}`);
    }
    if (this.searchField && this.searchValue && this.searchValue.trim()) {
      qp.push(`searchField=${encodeURIComponent(this.searchField)}`);
      qp.push(`searchValue=${encodeURIComponent(this.searchValue.trim())}`);
    }

    this.authService.getData(`jobs/getAll?${qp.join('&')}`).subscribe((res:any)=>{
      this.dataSource.data=res.data;
      this.authService.setLoader(false);
      this.length= res.total;
    },(error)=>{
      this.toastService.error(error);
      this.authService.setLoader(false);
    });
  }

  openlocation(value:any){
    let url = `https://www.google.com/maps/search/?api=1&query=${value[0]},${value[1]}`;
    window.open(url, '_blank');
  }

  resetFilters(){
    if (this.fromInput && this.fromInput.nativeElement) this.fromInput.nativeElement.value = '';
    if (this.toInput && this.toInput.nativeElement) this.toInput.nativeElement.value = '';
    this.driverInputValue = '';
    this.doNumberInputValue = '';
    this.fromDate = undefined;
    this.toDate = undefined;
    this.searchField = 'invoiceNumber';
    this.searchValue = '';
    this.sortField = this.selectedVal === 'Delivered' ? 'delivery_time' : 'updatedAt';
    this.sortType = 'DESC';
    this.currentPage = 0;
    if (this.selectedVal === 'Delivering') {
      this.searchJobs();
    }
    if (this.selectedVal === 'Delivered') {
      this.searchJobs();
    }
  }

  isSearchDisabled() {
    if (this.doNumberInputValue && this.doNumberInputValue.trim()) {
      return false;
    }
    return (this.fromDate && !this.toDate) || (!this.fromDate && this.toDate);
  }

  editDriver(model){
    this.model.open(model, { panelClass: 'center-dialog' });
  }
  getAllDriver(){
    this.authService.setLoader(true);
    this.authService.getData('driver/getSelectAll').subscribe((res:any)=>{
      res.data.forEach((response:any)=>{
        this.driverOption.push(response.email);
        this.drivername.push(response.firstName+" "+response.lastName)
      });
      this.driverDetails=res.data;
      this.authService.setLoader(false);
    },(error)=>{
      this.toastService.error(error);
      this.authService.setLoader(false);
    })
  }
  onEditDriver(element){
    this.authService.setLoader(true);
    let driver= this.driverDetails.find((res:any)=> res.email == this.selectedDriver);
    let data= {
      driver_id:driver._id,
      job_id:element._id
    }
    this.authService.postData('jobs/change-driver',data).subscribe((res:any)=>{
      this.toastService.success('Driver Update Successfully');
      this.authService.setLoader(false);
      this.deliveringOrder();
    },(error)=>{
      this.toastService.error(error);
      this.authService.setLoader(false);
    }) 
  }

  openPdf(data){
    let url = `${this.authService.pdfUrl}/uploads/pdfs/${encodeURIComponent(data)}.pdf`;
    window.open(url, '_blank');
  }

  openInvoice(element){
    let url = `${this.authService.pdfUrl}/uploads/invoice/invoice-${encodeURIComponent(element.do_number)}.pdf`;
    window.open(url, '_blank');
  }
  filterByDriver(){
    this.options.push(this.drivername);
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value: any) => this._filter(value))
    );
  }

  private _filter(value: string): any {
    const filterValue = value.toLowerCase();
    let data: string | any[];
    if(filterValue){
      data= this.options[0].filter((option: any) =>
      option.toLowerCase().includes(filterValue)
      );
    }
    if(data && data.length){
      return data
    }
    if(value && value.length){
      return ['No Data Found']
    }
  }

  editJob(id) {
    this.router.navigate([`/job/${id}/false`], { relativeTo: this.route });
  }

  deleteJob(id) {
    const dialogRef = this.model.open(ConfirmDialogComponent,{data:'delete', panelClass: 'center-dialog'});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.setLoader(true);
        this.authService.delete(`jobs/delete/${id}`).subscribe(res => {
          if (res) {
            this.authService.setLoader(false);
            this.toastService.success('Job Deleted successfully');
            this.deliveringOrder();
          }
        }, err => {
          this.authService.setLoader(false);
          this.toastService.error(err);
        });
      }
      else {
        this.authService.setLoader(false);
      }
    })
  }
}
