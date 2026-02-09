import { Component, OnInit, ViewChild, Input } from '@angular/core';
// import { MatPaginator } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
// import { JobService } from '../job.service';
import { LocalStorageService } from 'angular-web-storage';
// import { constants } from 'zlib';
import * as Constants from '../../utils/Constants';
import { MatPaginator, PageEvent, MatTableDataSource, MatSort } from '@angular/material';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { DialogComponent } from '../dialog/dialog.component';
import { FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-jobs',
  templateUrl: './user-jobs.component.html',
  styleUrls: ['./user-jobs.component.css']
})

export class UserJobsComponent implements OnInit {

  userID;
  dialogRef: any;
  dataSource: MatTableDataSource<PeriodicElement>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns: string[] = ['id', 'title', 'reporting_to', 'team', 'purpose', 'folder', 'about_organization', 'Action'];
  constructor(private router: Router, public dialog: MatDialog, public toast: ToastrService, private auth: AuthService, public local: LocalStorageService, private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      this.userID = params.get('id');
    });
  }

  ngOnInit() {
    this.getAllJob();
  }

  getAllJob() {
    this.auth.setLoader(true);
    const jobs = [];
    this.auth.getData('jobs/jobUserLibrary/' + this.userID).subscribe(response => {
      this.auth.setLoader(false);
      if (response.data) {
        for (let i = 0; i < response.data.length; i++) {
          for (let j = 0; j < response.data[i].job.length; j++) {
            // response.data[i].job[j].folderName = response.data[i].name;
            jobs.push(response.data[i].job[j]);
          }
        }
      }
      this.dataSource = new MatTableDataSource(jobs);
      this.paginator.pageSize = 10;
      this.dataSource.paginator = this.paginator;
      // this.dataSource = jobs;
    }, err => {
      this.auth.setLoader(false);
      this.toast.error(err);
    });
  }

  edit(id) {
    this.auth.setUserId({ normalUserId: this.userID });
    this.router.navigate(['../../../job/edit-job', id], { relativeTo: this.route });
  }
}

export interface PeriodicElement {
  id: string;
  title: string;
  reporting_to: string;
  team: string;
  purpose: string;
  folder: string;
  about_organization: string;
  Action: string;
}
