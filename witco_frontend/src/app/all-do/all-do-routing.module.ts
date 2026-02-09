import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AllDoComponent } from './all-do.component';


const routes: Routes = [
  {
    path:'',
    component:AllDoComponent,
    pathMatch:"full"
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AllDoRoutingModule { }
