import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material';
import { AuthService } from '../services/auth.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name', 'category', 'keywords', 'status', 'action'];
  dataSource: any = [];
  pageSizeOptions = [5, 10, 25, 50];
  pageSize = 10;
  length = 0;
  page = 0;
  searchTerm = '';
  private searchTimer: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastrService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.getInventory();
  }

  getInventory() {
    this.authService.setLoader(true);
    const page = this.page + 1;
    const query = this.searchTerm ? `&query=${encodeURIComponent(this.searchTerm.trim())}` : '';
    this.authService.getData(`inventory/getAll?page=${page}&pagesize=${this.pageSize}${query}`).subscribe((res: any) => {
      this.dataSource = res.data;
      this.length = res.total || 0;
      this.authService.setLoader(false);
    }, err => {
      this.authService.setLoader(false);
      this.toastService.error(err);
    });
  }

  addItem() {
    this.router.navigate(['./add'], { relativeTo: this.route });
  }

  editItem(id) {
    this.router.navigate(['./edit', id], { relativeTo: this.route });
  }

  deleteItem(id) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { data: 'Delete' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.setLoader(true);
        this.authService.delete(`inventory/delete/${id}`).subscribe(res => {
          if (res) {
            this.authService.setLoader(false);
            this.toastService.success('Inventory Item Deleted successfully');
            this.getInventory();
          }
        }, err => {
          this.authService.setLoader(false);
          this.toastService.error(err);
        });
      }
    });
  }

  pageChange(event) {
    this.pageSize = event.pageSize;
    this.page = event.pageIndex;
    this.getInventory();
  }

  onSearchInput() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 0;
      this.getInventory();
    }, 300);
  }
}
