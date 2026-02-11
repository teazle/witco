import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryComponent } from './inventory.component';
import { AddInventoryItemComponent } from './add-inventory-item/add-inventory-item.component';

const routes: Routes = [
  { path: '', component: InventoryComponent },
  { path: 'add', component: AddInventoryItemComponent },
  { path: 'edit/:id', component: AddInventoryItemComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
