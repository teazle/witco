import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeliveryOrderRoutingModule } from './delivery-order-routing.module';
import { DeliveryOrderComponent } from './delivery-order.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [DeliveryOrderComponent],
  imports: [
    CommonModule,
    DeliveryOrderRoutingModule,
    MaterialModule
  ],
  exports:[MaterialModule]
})
export class DeliveryOrderModule { }
