import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FacesService } from '../../services/faces.service';

@Component({
  selector: 'ngx-nums',
  templateUrl: './nums.component.html',
  styleUrls: ['./nums.component.scss']
})
export class NumsComponent implements OnInit {

  constructor(private face: FacesService) { 
  }

  @Input() value: string | number;
  @Input() rowData: any;
  @Output() save: EventEmitter<any> = new EventEmitter();
  minPossibleAdsCount:number;
  maxPossibleAdsCount:number;
  publisherId:string;
  page:string;

  ngOnInit() {
    if(this.value == 'adsperimage'){
      this.minPossibleAdsCount = this.rowData.minPossibleAdsCount
      this.maxPossibleAdsCount = this.rowData.maxPossibleAdsCount
      this.publisherId = this.rowData.publisherId
      this.page = this.rowData.url
    }
  }

  updatePage(){
    if(!this.rowData.adsperimage){
      alert('Max ads per image no cannot be empty')
    } else if(this.rowData.adsperimage < this.minPossibleAdsCount || this.rowData.adsperimage > this.maxPossibleAdsCount){
      alert(`Wrong max ads per image no specified, it should be between ${this.minPossibleAdsCount} to ${this.maxPossibleAdsCount}`)
    } else {
        this.face.updatePage({adsperimage: this.rowData.adsperimage, publisherId: this.publisherId, page: this.page}).subscribe(
        res => {
          console.log('Page updated with latest max ads per image no')
        },
        err => {
          if(err.error.mess){
            alert(err.error.mess)
          } else {
            alert('There is some error in updating max ads per image no')
          }
        }
      )
    }
  }
}
