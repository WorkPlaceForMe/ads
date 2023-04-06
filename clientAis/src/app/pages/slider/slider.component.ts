import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ViewCell } from 'ng2-smart-table';
import { FacesService } from '../../services/faces.service';

@Component({
  selector: 'ngx-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements ViewCell, OnInit {

  constructor(
    private face: FacesService,
    ) {
  }

  @Input() value: string | number;
  @Input() rowData: any;
  @Output() save: EventEmitter<any> = new EventEmitter()
  checked: boolean

  ngOnInit() {
    this.checked = (this.rowData.enabled == 'true')
  }

  change(){
    this.face.disableEnable(this.rowData.id, this.checked).subscribe(
      res => {
      },
      err => {
        console.error(err)
      }
    );
  }


}