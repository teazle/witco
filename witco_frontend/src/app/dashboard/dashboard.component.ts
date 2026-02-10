import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  status: any = null;
  loading = false;
  error = '';

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.loadStatus();
  }

  loadStatus() {
    this.loading = true;
    this.authService.getData('jobs/dispatch-status').subscribe((res: any) => {
      this.status = res.data || null;
      this.error = '';
      this.loading = false;
    }, (err) => {
      this.error = err;
      this.loading = false;
    });
  }
}
