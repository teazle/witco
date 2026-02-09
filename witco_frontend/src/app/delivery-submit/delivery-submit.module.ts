import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeliverySubmitRoutingModule } from './delivery-submit-routing.module';
import { DeliverySubmitComponent } from './delivery-submit.component';
import { MaterialModule } from '../material/material.module';
import { SignComponent } from './sign/sign.component';
import {WebcamModule} from 'ngx-webcam';
import { ItemDetailsComponent } from './webcam/webcam.component';
import { SignaturePadModule } from 'angular2-signaturepad';
import {MatRadioModule} from '@angular/material/radio';

@NgModule({
  declarations: [DeliverySubmitComponent, SignComponent,ItemDetailsComponent],
  imports: [
    CommonModule,
    DeliverySubmitRoutingModule,
    WebcamModule,
    MaterialModule,
    SignaturePadModule,
    MatRadioModule
  ]
})
export class DeliverySubmitModule { }
