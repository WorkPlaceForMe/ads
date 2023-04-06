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
  minPossibleAdsCountPerPage:number;
  publisherId:string;
  page:string;

  ngOnInit() {
    if(this.value == 'adsperpage'){
      this.minPossibleAdsCountPerPage = this.rowData.minPossibleAdsCountPerImage
      this.publisherId = this.rowData.publisherId
      this.page = this.rowData.url
    }
  }

  updatePage(){
    if(!this.rowData.adsperpage){
      alert('Max ads per page no cannot be empty')
    } else if(this.rowData.adsperpage < this.minPossibleAdsCountPerPage){
      alert(`Wrong max ads per page no specified, it should be greater or equal to ${this.minPossibleAdsCountPerPage}`)
    } else {
        this.face.updatePage({adsperpage: this.rowData.adsperpage, publisherId: this.publisherId, page: this.page}).subscribe(
        res => {
          console.log('Page updated with latest max ads per page no')
        },
        err => {
          if(err.error.mess){
            alert(err.error.mess)
          } else {
            alert('There is some error in updating max ads per page no')
          }
        }
      )
    }
  }
}
