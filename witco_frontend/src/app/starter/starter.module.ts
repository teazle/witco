import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DemoMaterialModule } from '../demo-material-module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { StarterComponent } from './starter.component';
import { StarterRoutes } from './starter.routing';
import { AddNewUserComponent } from './add-new-user/add-new-user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserJobsComponent } from './user-jobs/user-jobs.component';
import {MatDialogModule} from '@angular/material/dialog';

@NgModule({
  imports: [
    CommonModule,
    DemoMaterialModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    RouterModule.forChild(StarterRoutes)
  ],
  declarations: [StarterComponent,AddNewUserComponent, UserJobsComponent]
})
export class StarterModule {}
