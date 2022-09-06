import { DatePipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NbCalendarRange, NbDateService, NbPopoverDirective, NbWindowService } from '@nebular/theme';
import { LocalDataSource, ViewCell } from 'ng2-smart-table';
import { FacesService } from '../../services/faces.service';
import { AddComponent } from '../add/add.component';
import { NumsComponent } from '../nums/nums.component';
import { ReportComponent } from '../report/report.component';
import { SliderComponent } from '../slider/slider.component';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(
    public sanitizer: DomSanitizer,
    private face: FacesService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    protected dateService: NbDateService<Date>,
    private windowService: NbWindowService
  ) { }
  single: any;
  colorScheme: any;
  source: any = new LocalDataSource();
  stage: string;
  siteName: string;

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
  rewards: any = {};
  show: boolean = false;

  ngOnInit(): void {
    const params = this.activatedRoute.snapshot.queryParams;
    const path = this.activatedRoute.snapshot.routeConfig.path;
    
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

    if(path === 'dashboard'){
      this.settings['actions'] = {
        position: 'right',
        columnTitle: 'Actions',
        add: true,
        edit: true,
        delete: true,
      }
    }else{
      this.settings['actions'] = false
    }

    if(path === 'site/image'){
      this.stage = 'image'
      this.face.getStatsImg(params.img).subscribe(
      res => {
        this.source = res['table'];
      },
      err => {
        console.error(err);
        this.source = undefined;
      },
    );
    }
    this.checkSite()
  }

  checkSite(){
    const path = this.activatedRoute.snapshot.routeConfig.path;
    if(path === 'site'){
      this.stage = 'site'
      this.settings.columns.url.title = 'Webpage'
      this.initSite()
    }
    if(path === 'dashboard'){
      this.siteName = 'Publisher'
      this.initDash()
    }
  }

  initDash(){
      this.face.getStats(this.range).subscribe(
        res => {
          this.settings['columns']['nickname'] = {
            title: 'Name',
            type: 'string',
            filter: false,
            sort: true
          }
          this.settings['columns']['rewards'] = {
            title: 'Rewards',
            type: 'string',
            filter: false,
          }
          this.settings['columns']['conversions'] = {
            title: 'Conversions',
            type: 'string',
            filter: false,
          }
          this.settings['columns']['id'] = {
            title: 'Secret Code',
            type: 'string',
            filter: false,
          }
          this.settings['columns']['enabled'] = {
            title: 'Enabled',
            type: 'custom',
            filter: false,
            renderComponent: SliderComponent,
            onComponentInitFunction:(instance) => {
              instance.save.subscribe((row: string)  => {
              });
            }
          }
          this.settings = Object.assign({},this.settings)
          this.source = res['table'];
        },
        err => {
          console.error(err);
          this.source = undefined;
        },
      );
  }

  initSite(){
    const params = this.activatedRoute.snapshot.queryParams;
      this.settings.columns.url.title = 'Webpage'
      this.face.getStatsUrl(params.url,this.range).subscribe(
      res => {
        this.settings['columns']['adsNum'] = {
          title: 'Ads per image',
          type: 'custom',
          filter: false,
          valuePrepareFunction: (value, row, cell) => {
            return 'adsNum';
          },
          renderComponent: NumsComponent,
          onComponentInitFunction:(instance) => {
            instance.save.subscribe((row: string)  => {
            });
            }
        }
        this.settings['columns']['imgNum'] = {
          title: 'Images with ads',
          type: 'custom',
          filter: false,        
          valuePrepareFunction: (value, row, cell) => {
            return 'imgNum';
          },
          renderComponent: NumsComponent,
          onComponentInitFunction:(instance) => {
            instance.save.subscribe((row: string)  => {
            });
            }
        }
        this.rewards = res['rewards']
        this.settings = Object.assign({},this.settings)
        this.source = res['table'];
      },
      err => {
        console.error(err);
        this.source = undefined;
      },
    );
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

  goReport(){
    this.windowService.open(ReportComponent, { title: `Report Generation`});
    // this.router.navigateByUrl(`/pages/report`)
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
      this.checkSite()

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
      this.checkSite()
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
      this.checkSite()
    }else{
      this.showRange = true;
    }
  }

  back(stage){
    if(stage == 'site'){
      this.router.navigateByUrl(`/pages/dashboard`)
    }
    if(stage == 'image'){
      this.router.navigateByUrl(`/pages/site?url=${this.activatedRoute.snapshot.queryParams.img.split('/')[0]}`)
    }
    if(stage == 'ad'){
      this.router.navigateByUrl(`/pages/site/image?img=${this.activatedRoute.snapshot.queryParams.site}`)
    }
  }

  updateState:boolean = false
  
  update(){
    const params = this.activatedRoute.snapshot.queryParams;
    this.face.getStatsUrl(params.url,this.range).subscribe(
      res => {       
        this.source = res['table'];
        this.rewards = res['rewards'];
      },
      err => {
        console.error(err);
        this.source = undefined;
      },
    );
  }
  
  create() {
    this.windowService.open(AddComponent, { title: `Add new site`, context: { 
        onChange: changes => {
          this.initDash()
        }
      }
    });
  }

  edit(event) {
    this.windowService.open(AddComponent, { title: `Edit site` , context: { 
        onChange: changes => {
          this.initDash()
        },
         id: event.data.id
      }
    });
  }

  delete(event){
    if(confirm('Do you want to delete this website?')){
      this.face.delSite(event.data.id).subscribe(
        res => this.initDash(),
        err => {
          this.initDash()
          console.error(err)
        }
      )
    }
  }

  settings = {
    mode: 'external',
    // actions: false,
      add: {
          addButtonContent: '<i class="nb-plus"></i>',
          createButtonContent: '<i class="nb-checkmark"></i>',
          cancelButtonContent: '<i class="nb-close"></i>',
          confirmCreate: true,
        },
      edit: {
        editButtonContent: '<i class="nb-edit"></i>',
        saveButtonContent: '<i class="nb-checkmark"></i>',
        cancelButtonContent: '<i class="nb-close"></i>',
        confirmSave: true,
      },
      delete: {
        deleteButtonContent: '<i class="nb-trash"></i>',
        confirmDelete: true,
      },
    pager: {
      display: true,
      perPage: 10,
    },
    noDataMessage: 'Loading...',
    columns: {
      url: {
          title: 'Publisher',
          type: 'custom',
          filter: false,
          renderComponent: ButtonViewComponent,
          onComponentInitFunction(instance) {
            instance.save.subscribe(row => {
              alert(`${row.name} saved!`)
            });
          }
        },
      views: {
        title: 'Total Icon Impression',
        type: 'string',
        filter: false,
      },
      clicks: {
        title: 'Total Ad Clicks',
        type: 'string',
        filter: false,
      },
      ctr: {
        title: 'CTR',
        type: 'string',
        filter: false,
      },
        images: {
        title: 'Total Number of Images',
        type: 'string',
        filter: false,
      },
      ads: {
        title: 'Total Number of Ads',
        type: 'string',
        filter: false,
      },
    },
  };

    settings2 = {
    mode: 'external',
    actions: false,
    edit: {
      editButtonContent: '<i class="fas fa-ellipsis-h"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
    },
    pager: {
      display: true,
      perPage: 10,
    },
    noDataMessage: 'Loading...',
    columns: {
      img: {
          title: 'Image Icon',
          type: 'custom',
          filter: false,
          renderComponent: IconComponent,
          onComponentInitFunction(instance) {
            instance.save.subscribe(row => {
              alert(`${row.name} saved!`)
            });
          }
        },
      title: {
        title: 'Image Title',
        type: 'string',
        filter: false,
      },     
      views: {
        title: 'Image Icon Impressions',
        type: 'string',
        filter: false,
      },
      clicks: {
        title: 'Image Icon Clicks',
        type: 'string',
        filter: false,
      },
      ctr: {
        title: 'CTR',
        type: 'string',
        filter: false,
      },
      ads: {
        title: 'Total Number of Ads',
        type: 'string',
        filter: false,
      },
    },
  };

  settings3 = {
    mode: 'external',
    actions: false,
    edit: {
      editButtonContent: '<i class="fas fa-ellipsis-h"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
    },
    pager: {
      display: true,
      perPage: 10,
    },
    noDataMessage: 'No data found',
    columns: {
      img: {
          title: 'Ad Icon',
          type: 'custom',
          filter: false,
          renderComponent: IconComponent,
          onComponentInitFunction(instance) {
            instance.save.subscribe(row => {
              alert(`${row.name} saved!`)
            });
          }
        },
      title: {
        title: 'Ad Name',
        type: 'string',
        filter: false,
      },
      affiliate: {
        title: 'Affiliate Url',
        type: 'custom',
        filter: false,
        renderComponent: UrlComponent,
        onComponentInitFunction(instance) {
          instance.save.subscribe(row => {
            alert(`${row.name} saved!`)
          });
        }
      },
      views: {
        title: 'Impressions',
        type: 'string',
        filter: false,
      },
      clicks: {
        title: 'Clicks',
        type: 'string',
        filter: false,
      },
      ctr: {
        title: 'CTR',
        type: 'string',
        filter: false,
      },
    },
  };
}

@Component({
  selector: 'button-view',
  template: `
    <button class='btn btn-link play-btn' (click)='onClick()'>{{rowData.url}}</button>
  `,
})
export class ButtonViewComponent implements ViewCell, OnInit {
  renderValue: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    ){
  }

  @Input() value: string | number;
  @Input() rowData: any;

  @Output() save: EventEmitter<any> = new EventEmitter();

  path: string;
  params: string;
  ngOnInit() {
    this.path = this.activatedRoute.snapshot.routeConfig.path;
    this.params = this.activatedRoute.snapshot.queryParams.url;
    this.renderValue = this.value.toString().toUpperCase();
  }

  onClick() {
    if(this.path == 'dashboard'){
      this.router.navigateByUrl(`/pages/site?url=${this.rowData.url}`)
    }
    if(this.path == 'site'){
      this.router.navigateByUrl(`/pages/site/image?img=${this.rowData.url}`)
    }
  }
}

@Component({
  selector: 'button-view',
  template: `
  <button class='btn btn-link play-btn' style='cursor: default'><img [src]="rowData.img" width='60' height='60'></button>
  `,
})
export class IconComponent implements ViewCell, OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    ) {
  }

  @Input() value: string | number;
  @Input() rowData: any;
  @Output() save: EventEmitter<any> = new EventEmitter();
  path: string;
  params: string;
  ngOnInit() {
    this.path = this.activatedRoute.snapshot.routeConfig.path;
    this.params = this.activatedRoute.snapshot.queryParams.img;
  }
}

@Component({
  selector: 'button-view',
  template: `
  <button class='btn btn-link play-btn' (click)='onClick()'>Url Link</button>
  `,
})
export class UrlComponent implements ViewCell, OnInit {

  constructor(
    ) {
  }

  @Input() value: string | number;
  @Input() rowData: any;
  @Output() save: EventEmitter<any> = new EventEmitter();
  ngOnInit() {
  }

  onClick() {
    window.open(this.rowData.affiliate , '_blank');
  }
}