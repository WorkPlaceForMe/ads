import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { api } from '../models/API';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

const AUTH_API = `${environment.api}/`;
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class FacesService {
  API_URI = environment.api
  public now_user;
  constructor(private http: HttpClient) {
        this.now_user = JSON.parse(localStorage.getItem('usr'))
   }
  
  getStats(range){
    return this.http.get(`${this.API_URI}/stats?init=${range.start}&fin=${range.end}`);
  }
  getStatsUrl(site,range){
    return this.http.get(`${this.API_URI}/stats/url?url=${site}&init=${range.start}&fin=${range.end}`);
  }
  getStatsImg(site){
    return this.http.get(`${this.API_URI}/stats/url/img?imgs=${site}`);
  }
  getStatsAd(img,site){
    return this.http.get(`${this.API_URI}/stats/url/img/ad?ad=${img}&url=${site}`);
  }
  disableEnable(id,status){
    return this.http.get(`${this.API_URI}/modify/status/${id}/${status}`);
  }
  updatePages(body,id){
    return this.http.post(`${this.API_URI}/adsNum/${id}`,body);
  }
  getVersion(){
    return this.http.get(`${this.API_URI}/version`);
  }
  saveSite(body){
    return this.http.post(`${this.API_URI}/register/`,body);
  }
  updateSite(body){
    return this.http.put(`${this.API_URI}/update/`,body);
  }
  getSite(id){
    return this.http.get(`${this.API_URI}/site/${id}`);
  }
  getSites(){
    return this.http.get(`${this.API_URI}/sites/`);
  }
  delSite(id){
    return this.http.delete(`${this.API_URI}/del/${id}`);
  }
  getServer(){
    return this.http.get(`${this.API_URI}/server`);
  }
  report(range,id,option){
    return this.http.get(`${this.API_URI}/report?init=${range.start}&fin=${range.end}&id=${id}&option=${option}`,{
      responseType: 'blob'
    });
  }
  login(credentials): Observable<any> {
    return this.http.post(AUTH_API + 'login', {
      username: credentials.username,
      password: credentials.password
    }, httpOptions);
  }
  get isLoggedIn(): boolean {
    return (this.now_user !== null) ? true : false;
  }
  signOff(){
   const us = JSON.parse(localStorage.getItem('usr'))['username']
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.reload()
  }

}
