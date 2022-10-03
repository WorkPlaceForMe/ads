import { ip } from './IpServer';
import { environment } from "../../environments/environment";

// var  url = '/api';
// var  url = 'http://'+ ip +':3310/api';

let url
if (environment.production === false) {
    url = "http://" + ip + ":3300/api";
  } else {
    url = "/api";
  }
  

export var api: string = url;