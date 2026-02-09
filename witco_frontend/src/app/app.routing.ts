import { Routes } from '@angular/router';

import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './guards/auth.guard';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { LoginComponent } from './login/login.component';
import { RoleGuard } from './guards/role.guard';
import { DriverGuardGuard } from './guards/driver-guard.guard';
import { LoginGuard } from './guards/login.guard';
// import { UserJobsComponent } from './user-jobs/user-jobs.component';
export const AppRoutes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate:[LoginGuard],
    data: { title: 'Login' },
  },
  {
    path: 'forget-password',
    loadChildren: './forget-password/forget-password.module#ForgetPasswordModule',
    data: { title: 'Forget-Password' },
  },
  {
    path: 'new-password',
    loadChildren: './new-password/new-password.module#NewPasswordModule',
    data: { title: 'New-Password' }
  },
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'reset',
        component: ResetPasswordComponent,
        data: { title: 'Reset-password' }
      },
      {
        path: 'starter',
        canActivate: [RoleGuard],
        loadChildren: './starter/starter.module#StarterModule'
      },
      // {
      //   path: 'dashboard',
      //   canActivate: [RoleGuard],
      //   loadChildren: './dashboard/dashboard.module#DashboardModule'
      // },
      // {
      //   path: 'dashboard-driver',
      //   canActivate: [DriverGuardGuard],
      //   loadChildren: './dashboard/dashboard.module#DashboardModule'
      // },
     {
        path: 'icons',
        loadChildren: './icons/mat-icon.module#IconsModule'
      },
      {
        path: 'customer',
        canActivate: [RoleGuard],
        loadChildren: './customer/customer.module#CustomerModule'
      },
      {
        path: 'delivery-order',
        canActivate: [RoleGuard],
        loadChildren: './delivery-order/delivery-order.module#DeliveryOrderModule'
      },
      {
        path: 'job',
        canActivate: [RoleGuard],
        loadChildren: './job/job.module#JobModule'
      },
      {
        path: 'job/:id/:job',
        canActivate: [RoleGuard],
        loadChildren: './job/job.module#JobModule'
      },
      {
        path:'all-do',
        canActivate: [RoleGuard],
        loadChildren: './all-do/all-do.module#AllDoModule'
      },
      {
        path:'profile',
        canActivate: [RoleGuard],
        loadChildren: './profile/profile.module#ProfileModule'
      },
      {
        path: 'userReset',
        component: ResetPasswordComponent,
        data: { title: 'Reset-password' }
      },
      {
        path:'Userprofile',
        canActivate: [DriverGuardGuard],
        loadChildren: './profile/profile.module#ProfileModule'
      },
      {
        path:'my-jobs-Delivering',
        canActivate: [DriverGuardGuard],
        loadChildren: './my-jobs/my-jobs.module#MyJobsModule',
        data: { title: 'My Jobs' },
      },
      {
        path:'my-jobs-Delivered',
        canActivate: [DriverGuardGuard],
        loadChildren: './my-jobs/my-jobs.module#MyJobsModule',
        data: { title: 'My Jobs' },
      },
      {
        path:'delivery-submit/:id',
        canActivate: [DriverGuardGuard],
        loadChildren: './delivery-submit/delivery-submit.module#DeliverySubmitModule',
        data: { title: 'Submit Delivery' },
      },
    ]
  }
];
