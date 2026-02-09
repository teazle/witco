import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-img-cropper',
  templateUrl: './img-cropper.component.html',
  styleUrls: ['./img-cropper.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ImgCropperComponent implements OnInit {
  
  imageChangedEvent: any = '';
  croppedImage: any;
  constructor(public dialogRef: MatDialogRef<ImgCropperComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) {
      this.imageChangedEvent = data.action;
     }

  ngOnInit() {

  }

  imageCropped(event: ImageCroppedEvent) {
      this.croppedImage = event.base64;
  }
 
  onCloseDialog(){
    let crop = this.dataURLtoFile(this.croppedImage, 'logo');
    this.dialogRef.close([this.croppedImage, crop]);
  }

  imageLoaded() {}
  cropperReady() {}
  loadImageFailed () {}

  dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  dataURItoBlob(dataURI) {
    let binary = atob(dataURI.split(',')[1]);
    let array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {
      type: 'image/png'
    });
  }

}
