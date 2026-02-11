import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-inventory-item',
  templateUrl: './add-inventory-item.component.html',
  styleUrls: ['./add-inventory-item.component.css']
})
export class AddInventoryItemComponent implements OnInit {
  formId: any;
  inventoryForm: FormGroup;
  show: boolean;
  title: any;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private toastService: ToastrService,
    private authService: AuthService,
  ) {
    this.activatedRoute.paramMap.subscribe(params => {
      this.formId = params.get('id');
    });
  }

  ngOnInit() {
    this.inventoryForm = this.formBuilder.group({
      name: ['', Validators.required],
      category: [''],
      keywordsText: [''],
      isActive: [true]
    });

    this.activatedRoute.paramMap.subscribe(params => {
      const itemId = params.get('id');
      if (itemId) {
        this.show = false;
        this.title = 'Edit Inventory Item';
        this.getInventoryItem(itemId);
      } else {
        this.show = true;
        this.title = 'New Inventory Item';
      }
    });
  }

  get f() {
    return this.inventoryForm.controls;
  }

  onSubmit() {
    const value = this.inventoryForm.value;
    const keywords = String(value.keywordsText || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    const data: any = {
      name: value.name,
      category: value.category,
      keywords,
      isActive: value.isActive
    };

    this.authService.setLoader(true);
    if (!this.formId) {
      this.authService.postData('inventory/add', data).subscribe(response => {
        this.authService.setLoader(false);
        if (response) {
          this.router.navigate(['/inventory'], { relativeTo: this.activatedRoute });
          this.toastService.success('Inventory Item Added Successfully...');
        }
      }, error => {
        this.authService.setLoader(false);
        this.toastService.error(error);
      });
    } else {
      this.authService.patchData(`inventory/edit/${this.formId}`, data).subscribe(res => {
        this.authService.setLoader(false);
        if (res) {
          this.router.navigate(['/inventory'], { relativeTo: this.activatedRoute });
          this.toastService.success('Inventory Item Updated Successfully...');
        }
      }, error => {
        this.authService.setLoader(false);
        this.toastService.error(error);
      });
    }
  }

  goBack() {
    this.router.navigate(['/inventory'], { relativeTo: this.activatedRoute });
  }

  getInventoryItem(id) {
    this.authService.setLoader(true);
    this.authService.getData(`inventory/get/${id}`).subscribe(res => {
      const data = res.data;
      this.inventoryForm.patchValue({
        name: data.name,
        category: data.category,
        keywordsText: data.keywords ? data.keywords.join(', ') : '',
        isActive: data.isActive !== false
      });
      this.authService.setLoader(false);
    }, err => {
      this.authService.setLoader(false);
      this.toastService.error(err);
    });
  }
}
