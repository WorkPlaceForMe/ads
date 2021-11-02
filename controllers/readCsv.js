const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const fs = require('fs');
const cache = require('../helper/cacheManager')
const https = require('https');
const { parse } = require('url')
const parseCsv = require('csv-parse');
const objetos = require('../csv/objetos2.json');
const { trace, Console } = require('console');
const products = require('../campaigns-db/models/products');
const { stringify } = require('uuid');
const clothing = require('../campaigns-db/models/clothing');
const { resolve } = require('path');
const arrObjetos = Object.keys(objetos[0])
const WomenClothes = Object.keys(objetos[1]['Women Clothes'])
const MenClothes = Object.keys(objetos[1]["Men Clothes"])
const { Readable } = require("stream");
const sequelize = require('../campaigns-db/database')

exports.readCsv = async function (idPbl) {
  if (fs.existsSync(`./csv/${idPbl}.json`)) {
    return new Promise((resolve, reject) => {
      let res = require(`../csv/${idPbl}.json`);
      resolve(res)
    })
  }
  let cachedDown = await cache.getAsync(`downloading-${idPbl}`);
  if (cachedDown == 'false' || !cachedDown) {
    await cache.setAsync(`downloading-${idPbl}`, true);
    return new Promise(function (resolve, reject) {
      // const ids = {
      //     //lazada : 520,
      //     //trueShopping : 594,
      //     shopee : 677
      // }
      // let result = []
      aff.getAff.then(async function (credentials) {
        const token = jwt.sign(
          { sub: credentials.userUid },
          credentials.secretKey,
          {
            algorithm: "HS256"
          }
        )
        // for(const id in ids){
        let affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${idPbl}/campaigns/677/productfeed/url`
        try {
          const affiliateResponse = await axios.get(affiliateEndpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Accesstrade-User-Type': 'publisher'
            }
          })
          console.log(`Downloading shopee`)
          const rs = await download(affiliateResponse.data.baseUrl, idPbl)

          const results = await readCsv(rs, idPbl)
          resolve(results)

        } catch (err) {
          console.error(err)
        }
      }).catch((err) => {
        reject(err)
      })
    })
  }
  else {
    cachedDown = await cache.getAsync(`downloading-${idPbl}`)
    while (cachedDown == 'true') {
      cachedDown = await cache.getAsync(`downloading-${idPbl}`)
      continue;
    }
    return new Promise((resolve, reject) => {
      let res = require(`../csv/${idPbl}.json`);
      resolve(res)
    })
  }
}

async function download(url) {
  return new Promise((resolve, reject) => {
    axios.get(url).then(resp => {
      const Csv = Readable.from(resp.data)
      resolve(Csv)
    }).catch(err => {
      reject(console.error(err))
    })
  })
}

async function readCsv(path, id) {
  return new Promise((resolve, reject) => {

    path
      .pipe(parseCsv({ delimiter: ',', from_line: 2, headers: true }))
      .on('data', function (csvrow) {
        // aqui mandar a vista cada row
        for (const element of arrObjetos) {
          if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase() === element) {
            objetos[0][element].push(csvrow)
          } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase() === element) {
            objetos[0][element].push(csvrow)
          } else if (csvrow[13].toLowerCase().includes(" " + element) || csvrow[13].toLowerCase() === element) {
            objetos[0][element].push(csvrow)
          }
        }
        if (csvrow[15] == 'Mobile') {
          objetos[0]['cell_phone'].push(csvrow)
        }
        if (csvrow[13] == 'Women Clothes') {
          for (const element of WomenClothes) {
            if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase().includes(element)) {
              objetos[1]['Women Clothes'][element].push(csvrow)
            } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase().includes(element)) {
              objetos[1]['Women Clothes'][element].push(csvrow)
            }
          }
        }
        if (csvrow[13] == 'Men Clothes') {
          for (const element of MenClothes) {
            if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase().includes(element)) {
              objetos[1]['Men Clothes'][element].push(csvrow)
            } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase().includes(element)) {
              objetos[1]['Men Clothes'][element].push(csvrow)
            }
          }
        }
      })
      .on('end', async function () {
        await fs.promises.writeFile(`./csv/${id}.json`, JSON.stringify(objetos, null, 2), 'utf-8');
        await cache.setAsync(`downloading-${id}`, false);
        console.log(`Done with shopee`)
        const objetos_json = objetos
        console.log(typeof (objetos_json))
        console.log("uploading to Mysql")
        await sequelize.sync().then(()=>{
          for (obj in objetos_json[0]) {
            objetos_json[0][obj].forEach((element) => {
              if (element != null) {
                products.create({
                  Merchant_Product_Name: element[1],
                  Image_URL: element[2],
                  Product_URL_Web_encoded: element[4],
                  Product_URL_Mobile_encoded: element[5],
                  Description: element[6],
                  Price: element[7],
                  Descount: element[8],
                  Available: element[9],
                  Main_Category_Name: element[13],
                  Category_Name: element[15],
                  Sub_Category_Name: element[17],
                  Price_Unit: element[18],
                  lable: obj
                }).catch((err) => {
                  console.error('algo fallo', err)
                  console.trace(err)
                })
              }
            })
          }
          for (const Garment of WomenClothes) {
            if (objetos_json[1]['Women Clothes'][Garment] != null) {
              objetos_json[1]['Women Clothes'][Garment].forEach(element => {
                clothing.create({
                  Merchant_Product_Name: element[1],
                  Image_URL: element[2],
                  Product_URL_Web_encoded: element[4],
                  Product_URL_Mobile_encoded: element[5],
                  Description: element[6],
                  Price: element[7],
                  Descount: element[8],
                  Available: element[9],
                  Main_Category_Name: element[13],
                  Category_Name: element[15],
                  Sub_Category_Name: element[17],
                  Price_Unit: element[18],
                  lable: {
                    gender: 'Woman',
                    garment: Garment
                  }
                }).catch((err) => {
                  console.error('algo fallo con la ropa ', err)
                  console.trace(err)
                })
              });
            }
          }
          for (const Garment of MenClothes) {
            if (objetos_json[1]['Men Clothes'][Garment] != null) {
              objetos_json[1]['Men Clothes'][Garment].forEach(element => {
                clothing.create({
                  Merchant_Product_Name: element[1],
                  Image_URL: element[2],
                  Product_URL_Web_encoded: element[4],
                  Product_URL_Mobile_encoded: element[5],
                  Description: element[6],
                  Price: element[7],
                  Descount: element[8],
                  Available: element[9],
                  Main_Category_Name: element[13],
                  Category_Name: element[15],
                  Sub_Category_Name: element[17],
                  Price_Unit: element[18],
                  lable: {
                    gender: 'Men',
                    garment: Garment
                  }
                }).catch((err) => {
                  console.error('algo fallo con la ropa de hombre', err)
                  console.trace(err)
                })
              });
            }
          }
        })
        resolve(objetos)
      });
  })
}