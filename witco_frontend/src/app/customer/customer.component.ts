import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  displayedColumnsDesktop: string[] = ['position', 'firstName', 'email', 'companyName', 'phone', 'address', 'action'];
  displayedColumnsTablet: string[] = ['position', 'firstName', 'email', 'phone', 'address', 'action'];
  displayedColumnsMobile: string[] = ['position', 'firstName', 'phone', 'address', 'action'];
  displayedColumns: string[] = [];
  dataSource: any;
  pageSizeOptions = [5, 10, 25, 50];
  pageSize = 5;
  length = 0;
  page = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastrService,
    public dialog: MatDialog

  ) { }

  ngOnInit() {
    this.updateDisplayedColumns();
    this.getCustomers()
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.updateDisplayedColumns();
  }

  updateDisplayedColumns() {
    const width = window.innerWidth;
    if (width >= 1366) {
      this.displayedColumns = this.displayedColumnsDesktop;
      return;
    }
    if (width >= 1100) {
      this.displayedColumns = this.displayedColumnsTablet;
      return;
    }
    this.displayedColumns = this.displayedColumnsMobile;
  }
  getCustomers() {
    this.authService.setLoader(true);
    let qp = {
      pageSize: this.pageSize,
      page: this.page + 1
    }
    this.authService.getData(`customer/getAll?page=${qp.page}&pagesize=${qp.pageSize}`).subscribe((res: any) => {
      this.dataSource = res.data;
      this.length = res.total;
      this.authService.setLoader(false);
    }, err => {
      this.authService.setLoader(false);
      this.toastService.error(err);
    })
  }
  addCustomer() {
    this.router.navigate(['./addCustomer'], { relativeTo: this.route });
  }
  editUser(id) {
    this.router.navigate(['./edit-customer', id], { relativeTo: this.route });
  }
  deleteUser(id) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent,{data:'Delete'});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.setLoader(true);
        this.authService.delete(`customer/delete/${id}`).subscribe(res => {
          if (res) {
            this.authService.setLoader(false);
            this.toastService.success('User Deleted successfully');
            this.getCustomers();
          }
        }, err => {
          this.authService.setLoader(false);
          this.toastService.error(err);
        });
      }
    })
  }
  pageChange(event) {
    this.pageSize = event.pageSize;
    this.page = event.pageIndex;
    this.getCustomers();
  }
}
