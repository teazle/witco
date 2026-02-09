import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeliverySubmitComponent } from './delivery-submit.component';
import { SignComponent } from './sign/sign.component';
import { ItemDetailsComponent } from './webcam/webcam.component';


const routes: Routes = [
  {
    path:'',
    component:DeliverySubmitComponent
  },
  {
    path:'sign',
    component:SignComponent
  },
  {
    path:'item-details',
    component:ItemDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeliverySubmitRoutingModule { }
