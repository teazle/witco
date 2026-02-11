import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryComponent } from './inventory.component';
import { AddInventoryItemComponent } from './add-inventory-item/add-inventory-item.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [InventoryComponent, AddInventoryItemComponent],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    MaterialModule
  ],
  exports: [MaterialModule]
})
export class InventoryModule { }
