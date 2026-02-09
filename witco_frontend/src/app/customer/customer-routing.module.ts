import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CustomerComponent } from './customer.component';
import { AddNewCustomerComponent } from './add-new-customer/add-new-customer.component';


const routes: Routes = [
  {path:'',component:CustomerComponent},
  {path:'addCustomer',component:AddNewCustomerComponent},
  {path:'edit-customer/:id',component:AddNewCustomerComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }
