import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'ngx-nums',
  templateUrl: './nums.component.html',
  styleUrls: ['./nums.component.scss']
})
export class NumsComponent implements OnInit {

  constructor(
    ) { 
  }

  @Input() value: string | number;
  @Input() rowData: any;
  @Output() save: EventEmitter<any> = new EventEmitter();
  maximg:number;
  maxAds:number;

  ngOnInit() {
    if(this.value == 'adsNum'){
      this.maxAds = 5
    }else{
      this.maximg = this.rowData.totImgs
    }
  }
}
