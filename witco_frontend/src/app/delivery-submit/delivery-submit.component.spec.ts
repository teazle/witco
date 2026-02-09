import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverySubmitComponent } from './delivery-submit.component';

describe('DeliverySubmitComponent', () => {
  let component: DeliverySubmitComponent;
  let fixture: ComponentFixture<DeliverySubmitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeliverySubmitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliverySubmitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
