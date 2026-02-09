import * as $ from 'jquery';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule,ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutes } from './app.routing';
import { AppComponent } from './app.component';

import { FlexLayoutModule } from '@angular/flex-layout';
import { FullComponent } from './layouts/full/full.component';
import { AppHeaderComponent } from './layouts/full/header/header.component';
import { AppSidebarComponent } from './layouts/full/sidebar/sidebar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DemoMaterialModule } from './demo-material-module';
import { SharedModule } from './shared/shared.module';
import { SpinnerComponent } from './shared/spinner.component';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { AuthGuard } from '../app/guards/auth.guard';
import { environment } from '../environments/environment';
// import { ResetPasswordComponent } from './material-component/reset-password/reset-password.component';
import { ToastrModule } from 'ngx-toastr';
import { StorageModule } from '@ngx-pwa/local-storage';
import { ApiLoaderComponent } from './api-loader/api-loader.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { MatDialogModule } from '@angular/material';
import { ImgCropperComponent } from './starter/img-cropper/img-cropper.component';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { AppBlankComponent } from './layouts/blank/blank.component';
import { LocalStorageService } from 'angular-web-storage';
import { InterceptorsService } from './interceptors.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { PwaComponent } from './layouts/full/pwa/pwa.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
export function tokenGetter() {
  return localStorage.getItem('token');
}

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  wheelSpeed: 2,
  wheelPropagation: true
};

@NgModule({
  declarations: [
    AppComponent,
    FullComponent, 
    LoginComponent,
    AppHeaderComponent,
    SpinnerComponent,
    AppSidebarComponent,
    ImgCropperComponent,
    ResetPasswordComponent,
    ApiLoaderComponent,
    AppBlankComponent,
    PwaComponent,
    ConfirmDialogComponent
   ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass : 'toast-top-right',
      preventDuplicates : false
    }),
    DemoMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    FlexLayoutModule,
    ImageCropperModule,
    PerfectScrollbarModule,
    HttpClientModule,
    SharedModule,
    RouterModule.forRoot(AppRoutes),
  //   JwtModule.forRoot({
  //     config: {
  //         tokenGetter: tokenGetter,
  //         whitelistedDomains: ['localhost:5000'],
  //         blacklistedRoutes: [
  //            'http://localhost:5000/api/v1/user/login',
  //         ]
  //     }
  // }),
    StorageModule.forRoot({ IDBNoWrap: true }),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [
    AuthGuard,
    LocalStorageService,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptorsService,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [ImgCropperComponent,ConfirmDialogComponent]
})
export class AppModule {}
