import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeliveryOrderRoutingModule } from './delivery-order-routing.module';
import { DeliveryOrderComponent } from './delivery-order.component';
import { MaterialModule } from '../material/material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [DeliveryOrderComponent],
  imports: [
    CommonModule,
    DeliveryOrderRoutingModule,
    MaterialModule,
    DragDropModule
  ],
  exports:[MaterialModule]
})
export class DeliveryOrderModule { }
