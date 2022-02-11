import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router'

import { MENU_ITEMSUSER } from './pages-menu';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout [showHeader] = "showHeader" [state] = "state">
      <nb-menu [items]="menuUser"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent {
  hola: string = 'Made By Alex Kaiser';
  contact: string = 'i93kaiser@hotmail.com';
  showHeader: boolean =false;
  state: string = "collapsed";
  menuUser = MENU_ITEMSUSER;

  constructor(private router: Router) {
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        if(val.url == '/pages/graphs'){
          this.showHeader = false;
          this.state = "collapsed";
        }else{
          this.showHeader = true;
          this.state = "compacted";
        }
        if(val.url.split('/').length === 7 ){
          this.state ="collapsed"
          this.showHeader = false;
        }
        
      }
  });
  }
}
