import { Component, OnInit } from '@angular/core';
import { MatDialog, MatTableDataSource } from '@angular/material';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { event } from 'jquery';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-my-jobs',
  templateUrl: './my-jobs.component.html',
  styleUrls: ['./my-jobs.component.css']
})
export class MyJobsComponent implements OnInit {
  dataSource= new MatTableDataSource<any>();
  selectedVal:any='Delivering';
  length = 50;
  pageSize = 5;
  currentPage = 0;
  pageSizeOptions: number[] = [5, 10, 15, 50];
  displayedColumns: string[] = ['srno','customer', 'invoiceNumber', 'deliveryAddress','action'];
  currentRoute:any;
  selectedSignImage = '';
  selectedProofImages: string[] = [];
  constructor(
    private authService: AuthService,
    private toastService: ToastrService,
    private model:MatDialog,
    private route:ActivatedRoute,
    public router: Router
    ) { }

  ngOnInit() {
    if(this.router.url.includes('Delivering')){
      this.deliveringOrder();
    }
    if(this.router.url.includes('Delivered')){
      this.delivered();
    }
  }
  deliveringOrder(){
    this.authService.setLoader(true);
    const status = 'Delivering';
    this.authService.getData(`jobs/getAll?status=${status}&page=${this.currentPage + 1}&pagesize=${this.pageSize}`).subscribe((res: any) => {
      this.dataSource.data = res.data || [];
      this.length = Number(res.total) || 0;
      this.authService.setLoader(false);
    }, (error) => {
      this.toastService.error(error);
      this.authService.setLoader(false);
    });
  }

  delivered(){
    this.authService.setLoader(true);
    const status = 'Delivered';
    this.authService.getData(`jobs/getAll?status=${status}&page=${this.currentPage + 1}&pagesize=${this.pageSize}`).subscribe((res: any) => {
      this.dataSource.data = res.data || [];
      this.length = Number(res.total) || 0;
      this.authService.setLoader(false);
    }, (error) => {
      this.toastService.error(error);
      this.authService.setLoader(false);
    });
  }
  handlePageEvent(event:any){
    this.pageSize= event.pageSize;
    this.currentPage=event.pageIndex;
    if(this.router.url.includes('Delivering')){
      this.deliveringOrder();
    }
    if(this.router.url.includes('Delivered')){
      this.delivered();
    }
  }
  completeOrder(data:any){
      this.router.navigate([`/delivery-submit/${data._id}`],{relativeTo:this.route})
  }
  showAddress(model){
    this.model.open(model)
  }
  showProofSign(model: any, job: any) {
    this.selectedSignImage = this.resolveUploadUrl(job && job.sign ? job.sign : '');
    this.selectedProofImages = this.getProofPaths(job)
      .map((item) => this.resolveUploadUrl(item))
      .filter((item) => Boolean(item));
    this.model.open(model);
  }
  profile(){
    this.router.navigate(['/Userprofile']);
  }

  openlocation(zipcode:any){
    const win = window.open(`https://www.google.com/maps/search/${zipcode}`+' '+'singapore', '_top');
    return win.focus();
    
    // let url = `https://www.google.com/maps/search/${zipcode}`+' '+'singapore';
    // window.open(url, '_blank');
  }

  private getProofPaths(job: any): string[] {
    if (!job) return [];
    if (Array.isArray(job.photo_proof_images)) {
      const photos = job.photo_proof_images.filter((item: any) => Boolean(item));
      if (photos.length > 0) {
        return photos;
      }
    }
    return job.photo_proof ? [job.photo_proof] : [];
  }

  private resolveUploadUrl(filePath: string): string {
    const raw = String(filePath || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    const normalizedPath = raw.replace(/^\/+/, '');
    return `${this.authService.baseUrl}upload/file?path=${encodeURIComponent(normalizedPath)}`;
  }
}
