import { Component, OnInit, ViewChild } from '@angular/core';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sign',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.css']
})
export class SignComponent implements OnInit {

  signImage:any;
  signPad: any;
  params_id:any;
  @ViewChild(SignaturePad,{static: false}) signaturePad: SignaturePad;

  private signaturePadOptions: Object = {
    'minWidth': 3,
    'canvasWidth': 370,
    'canvasHeight': 370,
  };

  constructor(
    private authService:AuthService,
    private router: Router,
    private route : ActivatedRoute,
    private toastService: ToastrService,
    ) { }

  ngOnInit() {
    this.route.paramMap.subscribe((res:any)=>{
      this.params_id = res.params.id;
    })
  }
  
  ngAfterViewInit() {
    this.signaturePad.set('minWidth', 1); 
    this.signaturePad.clear();
  }

  drawComplete() {}

  drawStart() {}

  back() {
      this.router.navigate([`delivery-submit/${this.params_id}`]);
  }

  clearSignPad() {
    this.signaturePad.clear();
  }

  saveSignPad() {
    const base64ImageData = this.signaturePad.toDataURL();
    this.signImage = base64ImageData;
    let data= {
      id:this.params_id,
      base64:base64ImageData,
      type:'sign'
    }
    this.authService.postData('upload/image-add',data).subscribe((res:any)=>{
      this.router.navigate([`delivery-submit/${this.params_id}`]);
    },error => {
      console.log(error.error.error)
      this.authService.setLoader(false);
      this.toastService.error(error);
    })
  }

}
