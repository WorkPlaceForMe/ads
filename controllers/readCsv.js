const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const fs = require('fs');
const cache = require('../helper/cacheManager')
const parseCsv = require('csv-parse');
const objetos = require('../csv/objetos2.json');
const arrObjetos = Object.keys(objetos[0])
const WomenClothes = Object.keys(objetos[1]['Women Clothes'])
const MenClothes = Object.keys(objetos[1]["Men Clothes"])
const { Readable } = require("stream");
const db = require('../campaigns-db/database')
const products = db.products
const clothing = db.clothing

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
      const ids = {
        //lazada : 520,
        //trueShopping : 594,
        shopee: 677
      }
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
  return new Promise((resolve) => {
    path
      .pipe(parseCsv({ delimiter: ',', from_line: 2, headers: true }))
      .on('data', async function (csvrow) {
        // aqui mandar a vista cada row
        for (const element of arrObjetos) {
          if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase() == element) {
            objetos[0][element].push(csvrow)
            await products.create({
              Merchant_Product_Name: csvrow[1],
              Image_URL: csvrow[2],
              Product_URL_Web_encoded: csvrow[4],
              Product_URL_Mobile_encoded: csvrow[5],
              Description: csvrow[6],
              Price: csvrow[7],
              Descount: csvrow[8],
              Available: csvrow[9],
              Main_Category_Name: csvrow[13],
              Category_Name: csvrow[15],
              Sub_Category_Name: csvrow[17],
              Price_Unit: csvrow[18],
              label: element
            }).catch((err) => {
              console.error('algo fallo', err)
            })
          } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase() == element) {
            objetos[0][element].push(csvrow)
            await products.create({
              Merchant_Product_Name: csvrow[1],
              Image_URL: csvrow[2],
              Product_URL_Web_encoded: csvrow[4],
              Product_URL_Mobile_encoded: csvrow[5],
              Description: csvrow[6],
              Price: csvrow[7],
              Descount: csvrow[8],
              Available: csvrow[9],
              Main_Category_Name: csvrow[13],
              Category_Name: csvrow[15],
              Sub_Category_Name: csvrow[17],
              Price_Unit: csvrow[18],
              label: element
            }).catch((err) => {
              console.error('algo fallo', err)
            })
          } else if (csvrow[13].toLowerCase().includes(" " + element) || csvrow[13].toLowerCase() == element) {
            objetos[0][element].push(csvrow)
            await products.create({
              Merchant_Product_Name: csvrow[1],
              Image_URL: csvrow[2],
              Product_URL_Web_encoded: csvrow[4],
              Product_URL_Mobile_encoded: csvrow[5],
              Description: csvrow[6],
              Price: csvrow[7],
              Descount: csvrow[8],
              Available: csvrow[9],
              Main_Category_Name: csvrow[13],
              Category_Name: csvrow[15],
              Sub_Category_Name: csvrow[17],
              Price_Unit: csvrow[18],
              label: element
            }).catch((err) => {
              console.error('algo fallo', err)
            })
          }
        }
        if (csvrow[15] == 'Mobile') {
          objetos[0]['cell_phone'].push(csvrow)
          await products.create({
            Merchant_Product_Name: csvrow[1],
            Image_URL: csvrow[2],
            Product_URL_Web_encoded: csvrow[4],
            Product_URL_Mobile_encoded: csvrow[5],
            Description: csvrow[6],
            Price: csvrow[7],
            Descount: csvrow[8],
            Available: csvrow[9],
            Main_Category_Name: csvrow[13],
            Category_Name: csvrow[15],
            Sub_Category_Name: csvrow[17],
            Price_Unit: csvrow[18],
            label: 'cell_phone'
          }).catch((err) => {
            console.error('algo fallo', err)
          })
        }
        if (csvrow[13] == 'Women Clothes' || csvrow[15] == 'Women Sportswear') {
          for (const Garment of WomenClothes) {
            if (csvrow[15].toLowerCase().includes(" " + Garment) || csvrow[15].toLowerCase().includes(Garment)) {
              objetos[1]['Women Clothes'][Garment].push(csvrow)
              await clothing.create({
                Merchant_Product_Name: csvrow[1],
                Image_URL: csvrow[2],
                Product_URL_Web_encoded: csvrow[4],
                Product_URL_Mobile_encoded: csvrow[5],
                Description: csvrow[6],
                Price: csvrow[7],
                Descount: csvrow[8],
                Available: csvrow[9],
                Main_Category_Name: csvrow[13],
                Category_Name: csvrow[15],
                Sub_Category_Name: csvrow[17],
                Price_Unit: csvrow[18],
                label: {
                  gender: 'Female',
                  garment: Garment
                }
              }).catch((err) => {
                console.error('algo fallo con la ropa ', err)
              })
            } else if (csvrow[17].toLowerCase().includes(" " + Garment) || csvrow[17].toLowerCase().includes(Garment)) {
              objetos[1]['Women Clothes'][Garment].push(csvrow)
              await clothing.create({
                Merchant_Product_Name: csvrow[1],
                Image_URL: csvrow[2],
                Product_URL_Web_encoded: csvrow[4],
                Product_URL_Mobile_encoded: csvrow[5],
                Description: csvrow[6],
                Price: csvrow[7],
                Descount: csvrow[8],
                Available: csvrow[9],
                Main_Category_Name: csvrow[13],
                Category_Name: csvrow[15],
                Sub_Category_Name: csvrow[17],
                Price_Unit: csvrow[18],
                label: {
                  gender: 'Female',
                  garment: Garment
                }
              }).catch((err) => {
                console.error('algo fallo con la ropa ', err)
              })

            }
          }
        }
        if (csvrow[13] == 'Men Clothes' || csvrow[15] == 'Men Sportswear') {
          for (const Garment of MenClothes) {
            if (csvrow[15].toLowerCase().includes(" " + Garment) || csvrow[15].toLowerCase().includes(Garment)) {
              objetos[1]['Men Clothes'][Garment].push(csvrow)
              await clothing.create({
                Merchant_Product_Name: csvrow[1],
                Image_URL: csvrow[2],
                Product_URL_Web_encoded: csvrow[4],
                Product_URL_Mobile_encoded: csvrow[5],
                Description: csvrow[6],
                Price: csvrow[7],
                Descount: csvrow[8],
                Available: csvrow[9],
                Main_Category_Name: csvrow[13],
                Category_Name: csvrow[15],
                Sub_Category_Name: csvrow[17],
                Price_Unit: csvrow[18],
                label: {
                  gender: 'Male',
                  garment: Garment
                }
              }).catch((err) => {
                console.error('algo fallo con la ropa ', err)
              })
            } else if (csvrow[17].toLowerCase().includes(" " + Garment) || csvrow[17].toLowerCase().includes(Garment)) {
              objetos[1]['Men Clothes'][Garment].push(csvrow)
              await clothing.create({
                Merchant_Product_Name: csvrow[1],
                Image_URL: csvrow[2],
                Product_URL_Web_encoded: csvrow[4],
                Product_URL_Mobile_encoded: csvrow[5],
                Description: csvrow[6],
                Price: csvrow[7],
                Descount: csvrow[8],
                Available: csvrow[9],
                Main_Category_Name: csvrow[13],
                Category_Name: csvrow[15],
                Sub_Category_Name: csvrow[17],
                Price_Unit: csvrow[18],
                label: {
                  gender: 'Male',
                  garment: Garment
                }
              }).catch((err) => {
                console.error('algo fallo con la ropa ', err)
              })
            }
          }
        }
      })
      .on('end', async function () {
        await fs.promises.writeFile(`./csv/${id}.json`, JSON.stringify(objetos, null, 2), 'utf-8');
        console.log(`Done with shopee`)
        const objetos_json = objetos
        console.log("uploading to Mysql")
        await cache.setAsync(`downloading-${id}`, false);
        resolve(objetos)
      });
  })
}