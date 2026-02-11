import { Component, AfterViewInit, ViewChild, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatPaginator, PageEvent, MatTableDataSource, MatSort, MatDialog } from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { PasswordValidator } from '../../shared/password.validators';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

@Component({
  selector: 'app-starter',
  templateUrl: './starter.component.html',
  styleUrls: ['./starter.component.scss']
})

export class StarterComponent implements OnInit {
  displayedColumnsDesktop: string[] = ['srNo', 'first_name', 'email', 'phone', 'location', 'visibility', 'Action'];
  displayedColumnsTablet: string[] = ['srNo', 'first_name', 'email', 'location', 'visibility', 'Action'];
  displayedColumnsMobile: string[] = ['srNo', 'first_name', 'email', 'Action'];
  displayedColumns: string[] = [];
  object = Object;
  dataSource: MatTableDataSource<PeriodicElement>;
  query: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  pageI = 0;
  show = false;
  selectedDriver: any;
  driverOption: any[] = [];
  pageSizeOptions = [5, 10, 25, 50];
  pageSize = 5;
  length = 0;
  page = 0;
  dialogRef
  changePasswordForm: FormGroup;
  changePasswordFormErrors: any;

  constructor(private router: Router,
    private toastService: ToastrService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private formBuilder:FormBuilder,
    private Model:MatDialog,
    public dialog: MatDialog,
    private toast: ToastrService) {
      this.changePasswordFormErrors = {
        NewPassword: [''],
        NewConfirmPassword: ['']
      };
     }

  ngOnInit() {
    this.updateDisplayedColumns();
    this.changePasswordForm = this.formBuilder.group({
      NewPassword: ['', [Validators.required]],
      NewConfirmPassword: ['', [Validators.required]]
    }, { validator: PasswordValidator });
    this.getDriver();
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
  onLoginFormValuesChanged() {
    for (const field in this.changePasswordFormErrors) {
      if (!this.changePasswordFormErrors.hasOwnProperty(field)) {
        continue;
      }

      this.changePasswordFormErrors[field] = {};

      const control = this.changePasswordForm.get(field);

      if (control && control.dirty && !control.valid) {
        this.changePasswordFormErrors[field] = control.errors;
      }
    }
  }
  getDriver() {
    this.authService.setLoader(true);
    let qp = {
      pageSize: this.pageSize,
      page: this.page + 1
    }
    this.authService.getData(`driver/getAll?page=${qp.page}&pagesize=${qp.pageSize}`).subscribe((res: any) => {
      res.data.forEach((response: any) => {
        this.driverOption.push(response.email);
      });
      this.length = res.total;
      this.dataSource = res.data;
      this.authService.setLoader(false);
    },
      (error) => {
        console.log(error);
        this.authService.setLoader(false);
      })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  adduser() {
    this.router.navigate(['./add-user'], { relativeTo: this.route });
  }

  editUser(id) {
    this.router.navigate(['./edit-user', id], { relativeTo: this.route });
  }

  deleteUser(id) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent,{data:'Delete'});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.setLoader(true);
        this.authService.delete(`driver/delete/${id}`).subscribe(res => {
          if (res) {
            this.authService.setLoader(false);
            this.toastService.success('Driver Deleted successfully');
            this.getDriver();
          }
        }, err => {
          this.authService.setLoader(false);
          this.toastService.error(err);
        });
      }
    })
  }
  openDriverDetails(model: any) {
    this.dialog.open(model)
  }
  pageChange(event) {
    this.pageSize = event.pageSize;
    this.page = event.pageIndex;
    this.getDriver();
  }

  openlocation(value: any) {
    let url = `https://www.google.com/maps/search/?api=1&query=${value[0]},${value[1]}`;
    window.open(url, '_blank');
  }

  model(changePassword){
    this.dialogRef = this.Model.open(changePassword,{
      width:'300px'
    })
  }
  save(data,id){
    let value= {
      driver_id:id,
      password: data.NewPassword,
      verifypassword:data.NewConfirmPassword 
    }
    this.authService.postData('user/newpassword',value).subscribe(response => {
      if (response.status == "success") {
        this.toast.success('Password Changed Successfully');
        this.changePasswordForm.reset();
        this.dialogRef.close(this.changePasswordForm.value)
      }
      this.authService.setLoader(false);
    }, error => {
        this.authService.setLoader(false);
        this.toast.error(error);
      });

  }
}

export interface PeriodicElement {
  srNo: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  due_date: string;
  Action: string;
}
