import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NewPasswordRoutingModule } from './new-password-routing.module';
import { NewPasswordComponent } from './new-password.component';
import { MaterialModule } from '../material/material.module';


@NgModule({
  declarations: [NewPasswordComponent],
  imports: [
    CommonModule,
    NewPasswordRoutingModule,
    MaterialModule
  ]
})
export class NewPasswordModule { }
