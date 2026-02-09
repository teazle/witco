import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDoComponent } from './all-do.component';

describe('AllDoComponent', () => {
  let component: AllDoComponent;
  let fixture: ComponentFixture<AllDoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllDoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllDoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
