import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material';
import * as moment from 'moment';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';

interface DispatchJob {
  _id: string;
  invoiceNumber?: string;
  inv_temp?: string;
  customer_firstName?: string;
  customer_lastName?: string;
  customer_companyName?: string;
  customer_deliveryAddress?: string;
  customer_address?: string;
  deliveryAddress?: string;
  createdAt?: string;
  etaMinutes?: number;
  etaTime?: string;
}

interface DriverColumn {
  id: string;
  title: string;
  driverId?: string;
  driverEmail?: string;
  jobs: DispatchJob[];
}

@Component({
  selector: 'app-delivery-order',
  templateUrl: './delivery-order.component.html',
  styleUrls: ['./delivery-order.component.css']
})
export class DeliveryOrderComponent implements OnInit {

  columns: DriverColumn[] = [];
  unassigned: DriverColumn = { id: 'unassigned', title: 'Unassigned', jobs: [] };
  driverDetails: any[] = [];
  fromDate: Date | undefined;
  toDate: Date | undefined;
  toDay = new Date();
  pageSizeOptions = [25, 50, 100];
  pageSize = 50;
  length = 0;
  page = 0;
  totalJobsCount = 0;
  aiMode = false;
  etaPerStopMinutes = 15;
  aiBaseTime = new Date();
  dispatchPlanId: string | null = null;
  lastDispatchPlanKey = 'lastDispatchPlanId';
  depotAddress = '';
  etaSource = '';

  @ViewChild('fromInput', { static: false }) fromInput: ElementRef;
  @ViewChild('toInput', { static: false }) toInput: ElementRef;

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

  loadJobs() {
    this.authService.setLoader(true);
    const qp: string[] = [`page=${this.page + 1}`, `pagesize=${this.pageSize}`, `status=Created`];
    if (this.fromDate && this.toDate) {
      qp.push(`fromDate=${moment(this.fromDate).format('YYYY-MM-DD')}`);
      qp.push(`toDate=${moment(this.toDate).format('YYYY-MM-DD')}`);
    }
    const url = `jobs/getAll?${qp.join('&')}`;
    this.authService.getData(url).subscribe((res: any) => {
      const jobs = (res.data || []) as DispatchJob[];
      this.length = Number(res.total) || 0;
      this.unassigned.jobs = jobs;
      this.aiMode = false;
      this.refreshColumns();
      this.recountTotalJobs();
      this.authService.setLoader(false);
    }, (error) => {
      this.toastService.error(error);
      this.authService.setLoader(false);
    });
  }

  getAllDriver() {
    this.authService.getData('driver/getSelectAll').subscribe((res: any) => {
      this.driverDetails = res.data || [];
      this.refreshColumns();
    });
  }

  refreshColumns() {
    const driverColumns = (this.driverDetails || []).map((driver) => ({
      id: driver._id,
      title: `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email,
      driverId: driver._id,
      driverEmail: driver.email,
      jobs: []
    }));
    this.columns = [this.unassigned, ...driverColumns];
    this.recountTotalJobs();
  }

  applyAiSuggestions() {
    const jobIds = this.unassigned.jobs.map((job) => job._id);
    if (!jobIds.length) {
      this.toastService.error('No unassigned jobs to suggest.');
      return;
    }
    const driverIds = (this.driverDetails || []).map((driver) => driver._id);
    this.authService.setLoader(true);
    this.authService.postData('jobs/suggest-dispatch', {
      jobIds,
      driverIds,
      perStopMinutes: this.etaPerStopMinutes,
      saveDraft: true,
      depotAddress: this.depotAddress || undefined
    }).subscribe((res: any) => {
      const assignments = (res.data && res.data.assignments) || [];
      this.dispatchPlanId = res.data && res.data.planId ? res.data.planId : null;
      this.etaSource = (res.data && res.data.assumptions && res.data.assumptions.routing) || 'heuristic';
      const jobMap = new Map<string, DispatchJob>();
      this.unassigned.jobs.forEach((job) => jobMap.set(job._id, job));

      this.aiBaseTime = new Date();
      this.aiMode = true;

      this.columns.forEach((col) => {
        if (col.id !== 'unassigned') col.jobs = [];
      });

      assignments.forEach((assignment) => {
        const column = this.columns.find((col) => col.driverId === assignment.driver_id);
        if (!column) return;
        const assignedJobs: DispatchJob[] = [];
        (assignment.jobs || []).forEach((jobSuggestion) => {
          const job = jobMap.get(jobSuggestion.job_id);
          if (job) {
            assignedJobs.push({
              ...job,
              etaMinutes: jobSuggestion.etaMinutes,
              etaTime: jobSuggestion.etaTime
            });
            jobMap.delete(jobSuggestion.job_id);
          }
        });
        column.jobs = assignedJobs;
      });

      this.unassigned.jobs = Array.from(jobMap.values());
      this.recountTotalJobs();
      this.authService.setLoader(false);
    }, (error) => {
      this.toastService.error(error);
      this.authService.setLoader(false);
    });
  }

  clearAssignments() {
    const allJobs: DispatchJob[] = [];
    this.columns.forEach((col) => {
      allJobs.push(...col.jobs);
    });
    this.unassigned.jobs = allJobs;
    this.columns.forEach((col) => {
      if (col.id !== 'unassigned') col.jobs = [];
    });
    this.aiMode = false;
    this.etaSource = '';
    this.dispatchPlanId = null;
    this.recountTotalJobs();
  }

  drop(event: CdkDragDrop<DispatchJob[]>, column: DriverColumn) {
    if (event.previousContainer === event.container) {
      moveItemInArray(column.jobs, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.updateEtaForColumn(column);
    if (event.previousContainer !== event.container) {
      const prevColumn = this.columns.find((col) => col.jobs === event.previousContainer.data);
    if (prevColumn) this.updateEtaForColumn(prevColumn);
    this.recountTotalJobs();
  }
  }

  updateEtaForColumn(column: DriverColumn) {
    if (!this.aiMode || column.id === 'unassigned') return;
    column.jobs = column.jobs.map((job, index) => {
      const etaMinutes = this.etaPerStopMinutes * (index + 1);
      const etaTime = new Date(this.aiBaseTime.getTime() + etaMinutes * 60000).toISOString();
      return { ...job, etaMinutes, etaTime };
    });
  }

  dispatchAll() {
    if (this.dispatchPlanId) {
      this.authService.setLoader(true);
      this.authService.postData(`jobs/dispatch-plan/${this.dispatchPlanId}/apply`, {}).subscribe(() => {
        this.toast.success('Dispatch applied.');
        localStorage.setItem(this.lastDispatchPlanKey, this.dispatchPlanId);
        this.dispatchPlanId = null;
        this.authService.setLoader(false);
        this.router.navigate(['/all-do'], { relativeTo: this.route });
        this.loadJobs();
      }, (error) => {
        this.authService.setLoader(false);
        this.toast.error(error);
      });
      return;
    }

    const payloads = this.columns
      .filter((col) => col.driverId && col.jobs.length > 0)
      .map((col) => ({
        driver_id: col.driverId,
        jobs: col.jobs.map((job) => job._id)
      }));

    if (!payloads.length) {
      this.toastService.error('Assign at least one job to a driver before dispatch.');
      return;
    }

    this.authService.setLoader(true);
    forkJoin(payloads.map((payload) => this.authService.postData('jobs/add-delivery', payload))).subscribe(() => {
      this.toast.success('Delivery Created Successfully...');
      this.authService.setLoader(false);
      this.router.navigate(['/all-do'], { relativeTo: this.route });
      this.loadJobs();
    }, (error) => {
      this.authService.setLoader(false);
      this.toast.error(error);
    });
  }

  undoLastDispatch() {
    const planId = localStorage.getItem(this.lastDispatchPlanKey);
    if (!planId) {
      this.toastService.error('No dispatch plan found to undo.');
      return;
    }
    this.authService.setLoader(true);
    this.authService.postData(`jobs/dispatch-plan/${planId}/undo`, {}).subscribe(() => {
      this.toast.success('Dispatch undone.');
      localStorage.removeItem(this.lastDispatchPlanKey);
      this.authService.setLoader(false);
      this.loadJobs();
    }, (error) => {
      this.authService.setLoader(false);
      this.toast.error(error);
    });
  }

  recountTotalJobs() {
    this.totalJobsCount = this.columns.reduce((sum, col) => sum + col.jobs.length, 0);
  }

  searchJobs() {
    this.page = 0;
    this.loadJobs();
  }

  resetFilters() {
    if (this.fromInput && this.fromInput.nativeElement) this.fromInput.nativeElement.value = '';
    if (this.toInput && this.toInput.nativeElement) this.toInput.nativeElement.value = '';
    this.fromDate = undefined;
    this.toDate = undefined;
    this.page = 0;
    this.loadJobs();
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
    this.router.navigate(['/job'], { relativeTo: this.route });
  }

  deleteJob(id) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { data: 'delete', panelClass: 'center-dialog' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.setLoader(true);
        this.authService.delete(`jobs/delete/${id}`).subscribe(() => {
          this.authService.setLoader(false);
          this.toastService.success('Job Deleted successfully');
          this.loadJobs();
        }, err => {
          this.authService.setLoader(false);
          this.toastService.error(err);
        });
      }
      else {
        this.authService.setLoader(false);
      }
    });
  }
}
