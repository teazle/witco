import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material/material.module';
import { JobComponent } from './job.component';
import { JobRoutingModule } from './job-routing.module';

@NgModule({
  declarations: [JobComponent],
  imports: [
    CommonModule,
    JobRoutingModule,
    MaterialModule
  ],
  exports:[MaterialModule]
})
export class JobModule { }