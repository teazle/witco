import { Component, OnInit } from '@angular/core';
import { WebcamImage } from 'ngx-webcam';
import { Observable, Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-item-details',
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.css']
})
export class ItemDetailsComponent implements OnInit {

  checkPhoto= false;
  params_id: any;
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastrService,) { }

  ngOnInit() {
    this.route.paramMap.subscribe((res: any) => {
      this.params_id = res.params.id;
    })
  }
  private trigger: Subject<void> = new Subject<void>();

  // latest snapshot
  public webcamImage = null;

  public triggerSnapshot(): void {
    this.checkPhoto =true;
    this.trigger.next();
  }
  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }
  save() {
    let data= {
      id:this.params_id,
      base64:this.webcamImage._imageAsDataUrl,
      type:'proof'
    }
    this.authService.postData('upload/image-add',data).subscribe((res:any)=>{
      this.router.navigate([`delivery-submit/${this.params_id}`]);
    },error => {
      console.log(error.error.error)
      this.authService.setLoader(false);
      this.toastService.error(error.error.error);
    })
  }
  back() {
    this.router.navigate([`delivery-submit/${this.params_id}`]);
  }  
}
