import { Routes } from '@angular/router';

import { MatIconComponent } from './mat-icon.component';

export const IconsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'icons',
        component: MatIconComponent
      }
    ]
  }
];
