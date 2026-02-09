import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { CustomerComponent } from './customer.component';
import { MaterialModule } from '../material/material.module';
import { AddNewCustomerComponent } from './add-new-customer/add-new-customer.component';

@NgModule({
  declarations: [CustomerComponent, AddNewCustomerComponent],
  imports: [
    CommonModule,
    CustomerRoutingModule,
    MaterialModule
  ],
  exports:[MaterialModule]
})
export class CustomerModule { }
