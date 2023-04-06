import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FacesService } from '../services/faces.service';

@Injectable({
  providedIn: 'root'
})
export class Other1Guard implements CanActivate {
  constructor(
    public router: Router,
    public facesService: FacesService
  ){ }
  canActivate(
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      if(this.facesService.isLoggedIn) {
        return this.router.navigate(['/pages/dashboard'])
    }
    return true;
  }
}
