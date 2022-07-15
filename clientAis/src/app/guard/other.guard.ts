import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FacesService } from '../services/faces.service';

@Injectable({
  providedIn: 'root'
})
export class OtherGuard implements CanActivate {
  constructor(
    public router: Router,
    public facesService: FacesService
  ){ }
  canActivate(
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      if(this.facesService.isLoggedIn !== true) {
            // window.location.reload()
            return this.router.navigate(['/pages/sign-in'])
      } 
    return true;
    }
}
