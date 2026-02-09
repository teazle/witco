import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatTableDataSource } from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { MatRadioChange } from '@angular/material/radio';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-delivery-submit',
  templateUrl: './delivery-submit.component.html',
  styleUrls: ['./delivery-submit.component.css'],
})
export class DeliverySubmitComponent implements OnInit {
  job_id;
  jobDetails:any; 
  goodsDetails:any;
  checksign:Boolean=true;
  checkproof:boolean=true;
  displayedColumns: string[] = ['sr','name', 'quantity'];

  dataSource =new MatTableDataSource<any>([]);
  signStatus:any;
  proofStatus:any;
  longitude;
  latitude;
  // selectedOption;
  constructor(
    private router:Router,
    private route:ActivatedRoute,
    private authService:AuthService,
    private toastService: ToastrService,
  ){}

ngOnInit(): void {
  this.route.paramMap.subscribe((res:any)=>{
    this.job_id=res.params.id;
    this.getjob(this.job_id);
  });

}

radioButtonChange(data: MatRadioChange) {
  console.log(data.value);
}

getjob(id:any){
  this.authService.setLoader(true);
  this.authService.getData(`jobs/get/${id}`).subscribe((res:any)=>{
    this.jobDetails = res.data.job;
    // this.selectedOption = this.jobDetails.paid == false ? 'unpaid' :'paid'
    this.authService.getData(`goods/get/${this.jobDetails.goods_id}`).subscribe((response:any)=>{
      this.dataSource.data=response.data.goods;
      this.goodsDetails= response.data;
      if(this.jobDetails.sign!=="" ){
        this.checksign=false;
      }
      if( this.jobDetails.photo_proof!==""){
        this.checkproof=false;
      }
      this.authService.setLoader(false);
    })
  })
}

sign(){
  this.router.navigate(['sign'],{relativeTo:this.route})
}
webcam(){
  this.router.navigate(['item-details'],{relativeTo:this.route})
}
submit(){
  let payment;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;

        let data= {
          loc:[this.latitude,this.longitude],
          job_id:this.job_id,
          // paid:this.selectedOption == 'paid' ? true : false
        }
        this.authService.setLoader(true);
        this.authService.postData(`jobs/delivered`,data).subscribe((res:any)=>{
          let id={
            job_id: this.job_id
          }
          this.authService.postData(`jobs/invoice`,id).subscribe((res)=>{},(error) => {
          this.toastService.error('something went worng');
          })
          this.router.navigate(['/my-jobs-Delivered']);
          this.authService.setLoader(false);
        },(error) => {
          this.authService.setLoader(false);
          this.toastService.error(error);
        });
      },
      (error) => {
        this.authService.setLoader(false);
        if(error.code == 1){
          this.toastService.error("Please Enable Location First");
          }
        console.log('Geolocation error:', error);
      }
    );
  } else {
    this.toastService.error("Geolocation is not supported by this browser");
  }
}


// ChangepaymentMethod(event){
//   let data = {
//      jobid:this.job_id,
//      paid: this.selectedOption == 'paid' ? true :false
//   }
//   this.authService.postData(`jobs/payment-satus`,data).subscribe((res:any)=>{
//     this.getjob(this.job_id);
//   })
// }
}
