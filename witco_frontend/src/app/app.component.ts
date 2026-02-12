import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  loader$: Observable<boolean>;

  constructor(private authService: AuthService) {
    this.loader$ = this.authService.getLoader();
  }
}
