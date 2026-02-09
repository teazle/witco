import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyJobsRoutingModule } from './my-jobs-routing.module';
import { MyJobsComponent } from './my-jobs.component';
import { MaterialModule } from '../material/material.module';


@NgModule({
  declarations: [MyJobsComponent],
  imports: [
    CommonModule,
    MyJobsRoutingModule,
    MaterialModule
  ]
})
export class MyJobsModule { }
