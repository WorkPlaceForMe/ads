import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PagesComponent } from './pages.component';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ReportComponent } from './report/report.component';
import { LoginComponent } from './login/login.component';
import { Other1Guard } from '../guard/other1.guard';
import { OtherGuard } from '../guard/other.guard';

const routes: Routes = [
{
  path: '',
  component: PagesComponent,
    children: [
{
  path: 'sign-in',
  component: LoginComponent,
  canActivate: [Other1Guard],
},
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [OtherGuard],
},
{
  path: 'site',
  component: DashboardComponent,
  canActivate: [OtherGuard],
},
{
  path: 'site/image',
  component: DashboardComponent,
  canActivate: [OtherGuard],
},
{
  path: 'site/image/ad',
  component: DashboardComponent,
  canActivate: [OtherGuard],
},
{
  path: 'report',
  component: ReportComponent,
  canActivate: [OtherGuard],
},
{ path: '', 
redirectTo: '*',
pathMatch: 'full',
},
{
path: '**',
component: PagenotfoundComponent
},
]},
    

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
