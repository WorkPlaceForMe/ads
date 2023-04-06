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
  max:number;
  
  ngOnInit() {
    if(this.value == 'adsNum'){
      this.max = 5
    }else{
      this.max = this.rowData.images
    }
  }
}
