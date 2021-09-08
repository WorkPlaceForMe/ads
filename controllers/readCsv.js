const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const fs = require('fs');
const cache = require('../helper/cacheManager')
const http = require('http');
const { parse } = require('url')
const parseCsv = require('csv-parse');
const objetos = require('../csv/objetos2.json');
const e = require('express');
const arrObjetos = Object.keys(objetos)


exports.readCsv = async function(idPbl){
  if (fs.existsSync(`./csv/${idPbl}.csv`)){
    //const results = await readCsv(`./csv/${idPbl}.csv`,idPbl)

    return new Promise( (resolve, reject) =>{
    let res = require(`../csv/${idPbl}.json`);
    resolve(res)
      //resolve(results)

      // fs.readFile(`./csv/${idPbl}.csv`, async (err, data) => {
      //   if (err) throw err;
      //   const arr = await csvToArray(data)
      //   const results = JSON.parse(arr);
      //   resolve(results)
      // });
    }) 
  }
  let cachedDown = await cache.getAsync(`downloading-${idPbl}`);
  if(cachedDown == 'false' || !cachedDown){
    await cache.setAsync(`downloading-${idPbl}`, true);
    return new Promise(function(resolve, reject){
      // const ids = {
      //     //lazada : 520,
      //     //trueShopping : 594,
      //     shopee : 677
      // }
      // let result = []
          aff.getAff.then(async function(credentials){
              const token = jwt.sign(
                  { sub: credentials.userUid},
                  credentials.secretKey,
                  {
                  algorithm: "HS256"
                  }
              )
              // for(const id in ids){
              // const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${idPbl}/campaigns/${ids[id]}/productfeed/url`
                let affiliateEndpoint = `http://gurkha.accesstrade.in.th/publishers/site/${idPbl}/campaign/677/productfeed/csv/071bb6b4d95e1402cec6a61383481e1a`

                try{
                    console.log(`Downloading shopee`)

                    // const affiliateResponse = await axios.get(affiliateEndpoint, {
                    //         headers: {
                    //             'Authorization': `Bearer ${token}`,
                    //             'X-Accesstrade-User-Type': 'publisher'
                    //         }
                    // })

                    await download(affiliateEndpoint,idPbl)
                    
                    await cache.setAsync(`downloading-${idPbl}`, false);
                    console.log(`Done with shopee`)

                    const results = await readCsv(`./csv/${idPbl}.csv`,idPbl)

                    resolve(results)

                } catch(err) {
                    console.error(err)
                }
              // }
              // fs.promises.createWriteStream(`./csv/${idPbl}.csv`, JSON.stringify(result, null, 2) , 'utf-8');
              // resolve(result)
          }).catch((err)=>{
            console.error(err)
            reject(err)})
    })
  }
  else{
    cachedDown = await cache.getAsync(`downloading-${idPbl}`)
    while(cachedDown == 'true'){
      cachedDown = await cache.getAsync(`downloading-${idPbl}`)
      continue;
    }
    return new Promise( (resolve, reject) =>{
      let res = require(`../csv/${idPbl}.json`);
      resolve(res)
      // fs.readFile(`./csv/${idPbl}.csv`, async (err, data) => {
      //   if (err) throw err;
      //   const arr = await csvToArray(data)
      //   const results = JSON.parse(arr);
      //   resolve(results)
      // });
    }) 
  }
}

async function csvToArray(str, delimiter = ",") {
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

  const rows = str.slice(str.indexOf("\n") + 1).split("\n");

  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  return arr;
}

async function download(url, path) {
  const TIMEOUT = 100000
  const uri = parse(url)
  if (!path) {
    path = basename(uri.path)
  }
  let id = path
  path = `./csv/${path}_temp.csv`
  const file = fs.createWriteStream(path)

  return new Promise(function(resolve, reject) {
    const request = http.get(uri.href).on('response', function(res) {
      const len = parseInt(res.headers['content-length'], 10)
      let downloaded = 0
      res
        .on('data', function(chunk) {
          file.write(chunk)
          downloaded += chunk.length
          process.stdout.write(`Downloading ${downloaded} bytes\r`)
        })
        .on('end', function() {
          file.end()
          fs.rename(path, `./csv/${id}.csv`, function (err) {
            if (err) throw err;
            console.log('File Renamed.');
          });
          console.log(`${uri.path} downloaded to: ${path}`)
          resolve()
        })
        .on('error', function (err) {
          console.error(err)
          reject(err)
        })
    })

    request.setTimeout(TIMEOUT, function() {
      request.abort()
      reject(new Error(`request timeout after ${TIMEOUT / 1000.0}s`))
    })
  })
}

async function readCsv(path,id){
  return new Promise( (resolve, reject) =>{
  var csvData=[];
  fs.createReadStream(path)
      .pipe(parseCsv({delimiter: ','}))
      .on('data', function(csvrow) {
        
        // aqui mandar a vista cada row
        for(const element of arrObjetos){
          if(csvrow[15].toLowerCase().includes(" "+element) || csvrow[15].toLowerCase().includes(element) || csvrow[15].toLowerCase().includes(element.split('_').join(' '))){
            objetos[element].push(csvrow)
        }else if(csvrow[17].toLowerCase().includes(" "+element) || csvrow[15].toLowerCase().includes(element) || csvrow[17].toLowerCase().includes(element.split('_').join(' '))){
          objetos[element].push(csvrow)
        }else if(csvrow[13].toLowerCase().includes(" "+element) || csvrow[15].toLowerCase().includes(element) || csvrow[13].toLowerCase().includes(element.split('_').join(' '))){
          objetos[element].push(csvrow)
        }
      }
        csvData.push(csvrow);
      })
      .on('end', async function() {
        await fs.promises.writeFile(`./csv/${id}.json`, JSON.stringify(objetos, null, 2) , 'utf-8');
        resolve(objetos)
      });
  })
}
