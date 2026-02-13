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
  savedPhotoCount = 0;
  isSaving = false;
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastrService,) { }

  ngOnInit() {
    this.route.paramMap.subscribe((res: any) => {
      this.params_id = res.params.id;
      this.loadExistingProofCount();
    })
  }
  private trigger: Subject<void> = new Subject<void>();

  // latest snapshot
  public webcamImage = null;

  public triggerSnapshot(): void {
    this.trigger.next();
  }
  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.checkPhoto = true;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }
  save() {
    if (!this.webcamImage || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.authService.setLoader(true);
    let data= {
      id:this.params_id,
      base64:this.webcamImage._imageAsDataUrl,
      type:'proof'
    }
    this.authService.postData('upload/image-add',data).subscribe((res:any)=>{
      this.savedPhotoCount += 1;
      this.webcamImage = null;
      this.checkPhoto = false;
      this.toastService.success('Proof photo saved');
      this.isSaving = false;
      this.authService.setLoader(false);
    },error => {
      console.log(error.error.error)
      this.isSaving = false;
      this.authService.setLoader(false);
      this.toastService.error(error.error.error);
    })
  }
  back() {
    this.router.navigate([`delivery-submit/${this.params_id}`]);
  }

  private loadExistingProofCount() {
    if (!this.params_id) return;
    this.authService.getData(`jobs/get/${this.params_id}`).subscribe((res: any) => {
      const job = res && res.data && res.data.job ? res.data.job : null;
      this.savedPhotoCount = this.extractProofCount(job);
    });
  }

  private extractProofCount(job: any): number {
    if (!job) return 0;
    if (Array.isArray(job.photo_proof_images)) {
      const photos = job.photo_proof_images.filter((item: any) => Boolean(item));
      if (photos.length > 0) {
        return photos.length;
      }
    }
    return job.photo_proof ? 1 : 0;
  }
}
