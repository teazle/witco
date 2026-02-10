import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog, MatTableDataSource } from '@angular/material';
import * as moment from 'moment';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-delivery-order',
  templateUrl: './delivery-order.component.html',
  styleUrls: ['./delivery-order.component.css']
})
export class DeliveryOrderComponent implements OnInit {

  displayedColumns: string[] = ['select', 'customer', 'invioceNumber','inv_temp', 'customer_companyName','deliveryAddress', 'createdAt', 'action'];
  dataSource = new MatTableDataSource<any>([]);
  selectedDriver: any;
  driverDetails: any;
  driverOption: any[] = [];
  selectJob: any[] = [];
  fromDate: Date | undefined;
  toDate: Date | undefined;
  toDay = new Date();
  pageSizeOptions = [5, 10, 25, 50];
  pageSize = 5;
  length = 0;
  page = 0;


  @ViewChild('fromInput', { static: false }) fromInput: ElementRef;
  @ViewChild('toInput', { static: false }) toInput: ElementRef
  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastrService,
    private toastService: ToastrService,
    private model: MatDialog,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadJobs();
    this.getAllDriver();
  }

  /** Build and run the jobs API call with current page, pageSize, and optional date range. */
  loadJobs() {
    this.authService.setLoader(true);
    const qp: string[] = [`page=${this.page + 1}`, `pagesize=${this.pageSize}`, `status=Created`];
    if (this.fromDate && this.toDate) {
      qp.push(`fromDate=${moment(this.fromDate).format('YYYY-MM-DD')}`);
      qp.push(`toDate=${moment(this.toDate).format('YYYY-MM-DD')}`);
    }
    const url = `jobs/getAll?${qp.join('&')}`;
    this.authService.getData(url).subscribe((res: any) => {
      this.dataSource.data = res.data || [];
      this.length = Number(res.total) || 0;
      this.authService.setLoader(false);
    }, (error) => {
      this.toastService.error(error);
      this.authService.setLoader(false);
    });
  }

  getAllDriver() {
    this.authService.getData('driver/getSelectAll').subscribe((res: any) => {
      res.data.forEach((response: any) => {
        this.driverOption.push(response.email);
      })
      this.driverDetails = res.data;
    })
  }

  searchJobs() {
    this.page = 0;
    this.loadJobs();
  }

  deleteJob(id) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent,{data:'delete', panelClass: 'center-dialog'});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.setLoader(true);
        this.authService.delete(`jobs/delete/${id}`).subscribe(res => {
          if (res) {
            this.authService.setLoader(false);
            this.toastService.success('Job Deleted successfully');
            this.loadJobs();
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

  resetFilters() {
    if (this.fromInput && this.fromInput.nativeElement) this.fromInput.nativeElement.value = '';
    if (this.toInput && this.toInput.nativeElement) this.toInput.nativeElement.value = '';
    this.fromDate = undefined;
    this.toDate = undefined;
    this.page = 0;
    this.loadJobs();
  }

  checkBoxvalue(event, data) {
    if (event.checked) {
      if (this.selectJob.indexOf(data._id) == -1) {
        this.selectJob.push(data._id);
      }
    }
    if (!event.checked) {
      let index = this.selectJob.indexOf(data._id);
      if (index > -1) {
        this.selectJob.splice(index, 1);
      }
    }
  }
  openModel(model) {
    this.model.open(model, { panelClass: 'center-dialog' });
  }
  onSubmit() {
    if (this.selectedDriver) {
      let driver = this.driverDetails.find((res: any) => res.email == this.selectedDriver)
      let job = {
        driver_id: driver._id,
        jobs: this.selectJob
      }
      this.authService.postData('jobs/add-delivery', job).subscribe((res: any) => {
        if (res.status == "success") {
          this.toast.success('Delivery Created Successfully...');
          this.router.navigate(['/all-do'], { relativeTo: this.route })
        }
        this.loadJobs();
      }, error => {
        this.authService.setLoader(false);
        this.toast.error(error);
      })
    }

  }
  pageChange(event) {
    this.pageSize = event.pageSize;
    this.page = event.pageIndex;
    this.loadJobs();
  }
  editJob(id) {
    this.router.navigate([`/job/${id}/true`], { relativeTo: this.route });
  }
  addJob() {
    this.router.navigate(['/job'], { relativeTo: this.route })
  }
  myisNaN() {
    if (isNaN(this.fromDate && this.fromDate.valueOf()) || isNaN(this.toDate && this.toDate.valueOf())) {
      return true
    }
    else {
      return false
    }
  }
}
