import { Routes } from '@angular/router';

import { StarterComponent } from './starter.component';
import { AddNewUserComponent } from './add-new-user/add-new-user.component';
import { UserJobsComponent } from './user-jobs/user-jobs.component';

export const StarterRoutes: Routes = [
  {
    path: '',
    component: StarterComponent
  },
  {
    path: 'add-user',
    component: AddNewUserComponent
  },
  {
    path: 'edit-user/:id',
    component: AddNewUserComponent
  },
  {
    path: 'user-jobs/:id',
    component: UserJobsComponent
  }
];

