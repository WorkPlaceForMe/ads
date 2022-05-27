import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';

import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AccessComponent } from './access/access.component';

const routes: Routes = [
    {
  path: '',
  component: PagesComponent,
    children: [
     {
  path: 'access',
  component: AccessComponent
}, 
{
  path: 'dashboard',
  component: DashboardComponent
},
{
  path: 'site',
  component: DashboardComponent
},
{
  path: 'site/image',
  component: DashboardComponent
},
{
  path: 'site/image/ad',
  component: DashboardComponent
},
{ path: '', 
redirectTo: '**',
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
