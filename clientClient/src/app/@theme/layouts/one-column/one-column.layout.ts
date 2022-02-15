import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-one-column-layout',
  styleUrls: ['./one-column.layout.scss'],
  template: `
    <nb-layout windowMode>
      <nb-layout-header display = "none" fixed *ngIf='showHeader'>
        <ngx-header *ngIf = "showHeader"></ngx-header>
      </nb-layout-header>



      <nb-layout-column  [ngClass]="{'no-padding': !showHeader}" >
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>
    </nb-layout>
  `,
})
export class OneColumnLayoutComponent {
  @Input() showHeader: true;
  @Input() state: true;
constructor(){}
}
