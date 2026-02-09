import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AllDoRoutingModule } from './all-do-routing.module';
import { AllDoComponent } from './all-do.component';
import { MaterialModule } from '../material/material.module';


@NgModule({
  declarations: [AllDoComponent],
  imports: [
    CommonModule,
    AllDoRoutingModule,
    MaterialModule
  ]
})
export class AllDoModule { }
