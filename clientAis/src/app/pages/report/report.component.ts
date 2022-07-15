import { Component, OnInit, ViewChild } from '@angular/core';
import { NbCalendarRange, NbDateService, NbPopoverDirective, NbWindowRef } from '@nebular/theme';
import { FacesService } from '../../services/faces.service';

@Component({
  selector: 'ngx-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  constructor(
    protected dateService: NbDateService<Date>,
    private face: FacesService,
    protected windowRef: NbWindowRef
    ) { }

  calMonths: string[] = ['Jan', 'Feb', 'March', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  showRange: boolean;
  range: NbCalendarRange<Date>;
  selectedDate: Date;
  selectedMonth: Date;
  lastMonths: Date[] = [];
  max: Date;
  fin: Date;
  @ViewChild(NbPopoverDirective) rangeSelector: NbPopoverDirective;

  currentSelection: string  = 'Date';
  show: boolean = false;
  sites: Array<any>;
  site: string;
  option: string;

  colors = {
    option: 'primary',
    sites: 'primary'
  }

  ngOnInit(): void {
    this.max = this.dateService.addDay(this.dateService.today(), 0);
    const a = this.dateService.addDay(this.dateService.today(), 0);
    this.fin = new Date(a.setHours(a.getHours() + 23));
    this.fin = new Date(this.fin.setMinutes(this.fin.getMinutes() + 59));
    this.fin = new Date(this.fin.setSeconds(this.fin.getSeconds() + 59));
    this.range = {
      start: new Date(this.max),
      end: new Date(this.fin),
    };

    this.initMonths();
    this.selectedDate =  this.dateService.addDay(this.dateService.today(), 0);
    this.getPublishers();
    
  }

  getPublishers(){
    this.face.getSites().subscribe(
      res => {
        this.sites = res['publ']
      },
      err => console.error(err)
    )
  }

  siteChoosen(event){
    this.errors.website = false
  }

  loading: boolean = false;
  submitted: boolean = false;
  errors = {
    website: false
  }

  generate(){
    this.submitted = true
    this.loading = true
    if(this.site == null){
      this.colors.sites = 'danger'
    }else{
      this.colors.sites = 'primary'
    }
    if(this.option == null){
      this.colors.option = 'danger'
    }else{
      this.colors.option = 'primary'
    }
    if(this.site != null && this.option != null){
      this.face.report(this.range,this.site,this.option).subscribe(
        res => {
          var blob = new Blob([res], { type: res.type.toString() });
          var url = window.URL.createObjectURL(blob);
          this.goToLink(url)
          this.loading = false
          this.windowRef.close();
        },
        err => {
          this.loading = false
          if(err['error'].size == 39){
            this.errors.website = true
            this.colors.sites = 'danger'
          }
        }
      )
    }else{
      this.loading = false
    }
  }

  goToLink(url: string){
    window.open(url, "_blank");
  }

  setDate(event){
    this.selectedDate = event
    if (this.selectedDate){
      const start = this.selectedDate;
      // Add one data and minus 1 sec to set time to end of the day
      let end = this.dateService.addDay(start, 1);
      end = new Date(end.getTime() - 1000);
      this.range = {
        start: new Date(start),
        end: new Date(end),
      };
      this.showRangeSelector();
    }
  }

  changeRange(event){
    if (event.end !== undefined){
      this.showRange = false;
      event.end = new Date(event.end.setHours(event.end.getHours() + 23));
      event.end = new Date(event.end.setMinutes(event.end.getMinutes() + 59));
      event.end = new Date(event.end.setSeconds(event.end.getSeconds() + 59));
      this.range = {
        start: new Date(event.start),
        end: new Date(event.end),
      };
      this.showRangeSelector();
    }else{
      this.showRange = true;
    }
  }

  setMonth(){
    if (this.selectedMonth){
      const start = this.selectedMonth;
      // Add one month and minus 1 second to go to the end of the month
      let end = this.dateService.addMonth(start, 1);
      end = new Date(end.getTime() - 1000);
      this.range = {
        start: new Date(start),
        end: new Date(end),
      };
      this.showRangeSelector();

    }

  }

  initMonths(){
    let t = this.dateService.today();
    let daysToMinus = t.getDate() - 1;
    daysToMinus *= -1;
    t = this.dateService.addDay(t, daysToMinus);

    this.lastMonths.push(t);
    for (let i = 1; i <= 12; i++){
        const a = -1 * i;
        this.lastMonths.push(this.dateService.addMonth(t, a));
    }
  }

  selectRangeType(type){
    this.currentSelection = type;
  }

  showRangeSelector(){
    this.show = !this.show;
    if (this.show){
      this.rangeSelector.show();
    }else{
      this.rangeSelector.hide();
    }
  }

}
