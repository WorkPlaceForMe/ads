import { NgModule } from '@angular/core';
import { NbMenuModule, NbPopoverModule, NbWindowModule } from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { PagesComponent } from './pages.component';
import { PagesRoutingModule } from './pages-routing.module';

import { HttpClientModule } from '@angular/common/http';
import { FacesService } from '../services/faces.service';
import { TrustedUrlPipe } from '../pipes/trusted-url.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileUploadModule } from 'ng2-file-upload';
import { UrlPipe } from '../pipes/url.pipe';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';
import { TrustedStylePipe } from '../pipes/trusted-style.pipe';
import { FormsModule as ngFormsModule } from '@angular/forms';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule, NbAccordionModule, NbButtonModule, NbListModule,NbRouteTabsetModule,
  NbStepperModule,
  NbTabsetModule, NbUserModule,    NbActionsModule,
  NbCheckboxModule,
  NbRadioModule,
  NbDatepickerModule,
  NbFormFieldModule,
  NbSelectModule, NbSpinnerModule,
  NbContextMenuModule } from '@nebular/theme';

import {A11yModule} from '@angular/cdk/a11y';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {PortalModule} from '@angular/cdk/portal';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {CdkTableModule} from '@angular/cdk/table';
import {CdkTreeModule} from '@angular/cdk/tree';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ChartModule } from 'angular2-chartjs';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxEchartsModule } from 'ngx-echarts';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SliderComponent } from './slider/slider.component';
import { NumsComponent } from './nums/nums.component';
import { AddComponent } from './add/add.component';
import { ReportComponent } from './report/report.component';
import { LoginComponent } from './login/login.component';

@NgModule({
  imports: [
    NgxEchartsModule,
    NgxChartsModule,
    ChartModule,
    Ng2SmartTableModule,
    NbSpinnerModule,
    NbContextMenuModule,
    NbActionsModule,
    NbCheckboxModule,
    NbRadioModule,
    NbDatepickerModule,
    NbSelectModule,
    ngFormsModule,
    NbAccordionModule,
    NbButtonModule,
    NbListModule,
    NbRouteTabsetModule,
    NbStepperModule,
    NbFormFieldModule,
    NbTabsetModule, NbUserModule,
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    PagesRoutingModule,
    ThemeModule,
    NbMenuModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FileUploadModule,
    OwlDateTimeModule, 
    OwlNativeDateTimeModule,
    A11yModule,
    CdkStepperModule,
    CdkTableModule,
    CdkTreeModule,
    DragDropModule,
    PortalModule,
    ScrollingModule,
    NbPopoverModule
  ],
  declarations: [
    PagesComponent,
    TrustedUrlPipe,
    UrlPipe,
    PagenotfoundComponent,
    TrustedStylePipe,
    DashboardComponent,
    SliderComponent,
    NumsComponent,
    AddComponent,
    ReportComponent,
    LoginComponent
  ],
  providers: [
    FacesService,
  ],
})
export class PagesModule {
}
