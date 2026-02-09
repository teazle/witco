import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyJobsComponent } from './my-jobs.component';


const routes: Routes = [
  {
    path:'',
    component:MyJobsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyJobsRoutingModule { }
