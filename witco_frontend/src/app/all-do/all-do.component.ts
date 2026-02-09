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
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  options: any[] = [];
  
  driverOption:any[]=[];
  driverDetails:any
  dataSource= new MatTableDataSource<any>();
  selectedVal:any='Delivering';
  fromDate: Date | undefined;
  toDate: Date | undefined;
  length = 0;
  pageSize = 5;
  currentPage = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  displayedColumns: string[] = ['srno','customer', 'invoiceNumber','inv_temp', 'customer_companyName','deliveryAddress','driver','driverEmail','vehicleNumber','Date','action','editJob'];
  displayedColumnsDelivered: string[] = ['srno','invoice_no','customer', 'invoiceNumber','inv_temp', 'customer_companyName', 'deliveryAddress','driver','driverEmail','vehicleNumber','DeliveryDate','action','pdf','invoice'];
  selectedDriver:any;
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
    if (isNaN((this.fromDate && this.fromDate.valueOf()))  && isNaN(this.toDate && this.toDate.valueOf())) {
      this.authService.setLoader(true);
      let qp = {
        pagesize: this.pageSize,
        page: this.currentPage + 1
      }
      this.authService.getData(`jobs/getAll?status=${this.selectedVal}&pagesize=${qp.pagesize}&page=${qp.page}`).subscribe((res:any)=>{
        this.dataSource.data=res.data;
        this.length= res.total;
        this.authService.setLoader(false);
      }, (error)=>{
        this.toastService.error(error);
        this.authService.setLoader(false);
      }
      )
    }
    else{
      this.searchJobs()
    }
  }

  delivered(){
    if ( isNaN(this.fromDate && this.fromDate.valueOf())  && isNaN(this.toDate && this.toDate.valueOf())) {
      this.authService.setLoader(true);
      let qp = {
        pagesize: this.pageSize,
        page: this.currentPage + 1
      }
      this.authService.getData(`jobs/getAll?status=${this.selectedVal}&pagesize=${qp.pagesize}&page=${qp.page}`).subscribe((res:any)=>{
        this.dataSource.data=res.data;
        this.length= res.total;
        this.authService.setLoader(false);

      },
      (error)=>{
        this.toastService.error(error);
        this.authService.setLoader(false);
      }
      )
    }else{
      this.searchJobs();
    }
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
    let qp = {
      pagesize: this.pageSize,
      page: this.currentPage + 1
    }
    if (!this.driverInputValue  && (!this.fromDate || !this.toDate)) {
      if(this.selectedVal == 'Delivering')
      {
        this.deliveringOrder();
      }
      if(this.selectedVal == 'Delivered'){
        this.delivered();
      }
    } else{
      let driver;
      let driverEmail;
      let api;
      let data = {
        fromDate: moment(this.fromDate).format('YYYY-MM-DD'),
        toDate: moment(this.toDate).format('YYYY-MM-DD'),
      };
      if(this.driverInputValue){
        driver = this.driverDetails.filter((res)=>{ 
          return res.firstName == this.driverInputValue.split(' ')[0] && res.lastName == this.driverInputValue.split(' ')[1]
        });
        driverEmail = driver[0].email;
      }
      if(this.driverInputValue && (!this.fromDate || !this.toDate)){
        api = this.authService.getData(`jobs/getAll?status=${this.selectedVal}&driver_email=${driverEmail}&pagesize=${qp.pagesize}&page=${qp.page}`)
      }
      else if(!this.driverInputValue && (this.fromDate || this.toDate)){
        api = this.authService.getData(`jobs/getAll?status=${this.selectedVal}&fromDate=${data.fromDate}&toDate=${data.toDate}&pagesize=${qp.pagesize}&page=${qp.page}`)
      }
      else{
        api = this.authService.getData(`jobs/getAll?status=${this.selectedVal}&fromDate=${data.fromDate}&toDate=${data.toDate}&driver_email=${driverEmail}&pagesize=${qp.pagesize}&page=${qp.page}`)
      }
      
        api.subscribe((res:any)=>{
          this.dataSource.data=res.data;
          this.authService.setLoader(false);
          this.length= res.total;
        },(error)=>{
          this.toastService.error(error);
          this.authService.setLoader(false);
        });
    }
  }

  openlocation(value:any){
    let url = `https://www.google.com/maps/search/?api=1&query=${value[0]},${value[1]}`;
    window.open(url, '_blank');
  }

  resetFilters(){
    if (this.fromInput && this.fromInput.nativeElement) this.fromInput.nativeElement.value = '';
    if (this.toInput && this.toInput.nativeElement) this.toInput.nativeElement.value = '';
    this.driverInputValue = '';
    this.fromDate = undefined;
    this.toDate = undefined;
    this.currentPage = 0;
    if (this.selectedVal === 'Delivering') {
      this.searchJobs();
    }
    if (this.selectedVal === 'Delivered') {
      this.searchJobs();
    }
  }

  editDriver(model){
    this.model.open(model);
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
    const dialogRef = this.model.open(ConfirmDialogComponent,{data:'delete'});
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
