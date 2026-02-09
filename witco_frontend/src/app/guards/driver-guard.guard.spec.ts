import { TestBed, async, inject } from '@angular/core/testing';

import { DriverGuardGuard } from './driver-guard.guard';

describe('DriverGuardGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DriverGuardGuard]
    });
  });

  it('should ...', inject([DriverGuardGuard], (guard: DriverGuardGuard) => {
    expect(guard).toBeTruthy();
  }));
});
