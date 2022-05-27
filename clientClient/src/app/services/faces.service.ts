import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { api } from '../models/API';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FacesService {
  API_URI = environment.api
  constructor(private http: HttpClient) { }
  
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
  logIn(code){
    return this.http.get(`${this.API_URI}/log/${code}`);
  }
  updatePages(body,id){
    return this.http.post(`${this.API_URI}/adsNum/${id}`,body);
  }
  getVersion(){
    return this.http.get(`${this.API_URI}/version`);
  }
}
