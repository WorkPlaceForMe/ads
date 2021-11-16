const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const cache = require('../helper/cacheManager')
const parseCsv = require('csv-parse');
const objetos = require('../csv/objetos2.json');
const { Readable } = require("stream");
const db = require('../campaigns-db/database');
const products = db.products
const clothing = db.clothing


exports.readCsv = async function (idPbl) {
  const val1 = await db.sequelize.query(`SELECT EXISTS (SELECT 1 FROM ${conf.get('database')}.products );`)
  const val2 = await db.sequelize.query(`SELECT EXISTS (SELECT 1 FROM ${conf.get('database')}.clothings);`)
  let cachedDown = await cache.getAsync(`downloading-${idPbl}`);
  console.log(Object.values(val1[0][0])[0], Object.values(val2[0][0])[0])
  if (Object.values(val1[0][0])[0] == 1 && Object.values(val2[0][0])[0] == 1) {
    console.log('=====================')
     let dataValues = {
          products: [],
          clothing: []
        }
        const Clothing = await clothing.findAll({
          raw: true
        })
        dataValues.clothing = Clothing
        const Products = await products.findAll({
          raw: true
        })
        dataValues.products = Products
        dataValues.clothing = Clothing
        return dataValues

  }
  else{
    console.log(cachedDown)
    if (cachedDown == 'false' || !cachedDown) {
    await cache.setAsync(`downloading-${idPbl}`, true);
    return new Promise(function (resolve, reject) {
      const ids = {
        shopee: 677
      }
      aff.getAff.then(async function (credentials) {
        const token = jwt.sign(
          { sub: credentials.userUid },
          credentials.secretKey,
          {
            algorithm: "HS256"
          }
        )
        let affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${idPbl}/campaigns/677/productfeed/url`

        try {
          const affiliateResponse = await axios.get(affiliateEndpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Accesstrade-User-Type': 'publisher'
            }
          })
          const rs = await download(affiliateResponse.data.baseUrl, idPbl)
          const results = await readCsv(rs, idPbl)
          resolve(results)

        } catch (err) {
          console.error(err)
        }

      }).catch((err) => {
        console.error(err)
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
    let dataValues = {
      products: [],
      clothing: []
    }
    const Clothing = await clothing.findAll({
      raw: true
    })
    dataValues.clothing = Clothing
    const Products = await products.findAll({
      raw: true
    })
    dataValues.products = Products
    return (dataValues)
  }
}
}

async function download(url) {
  console.log(`Downloading shopee`)
  const resp = await axios.get(url)
  const Csv = Readable.from(resp.data)
  return (Csv)
}

async function readCsv(path, id) {
  const dataValues = {
    products: [],
    clothing: []
  };
  path
    .pipe(parseCsv({ delimiter: ',', from_line: 2, headers: true }))
    .on('data', async function (csvrow) {
      for (const element of objetos['Products']) {
        if (csvrow[15] == 'Mobile') {
          const product = await products.create({
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
          })
          dataValues['products'].push(product.dataValues)
        }
         else if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase() == element) {
          const product = await create_products(csvrow, element, id)
          console.log(product.dataValues)
          dataValues['products'].push(product.dataValues)
        } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase() == element) {
          const product = await create_products(csvrow, element, id)
          console.log(product)
          dataValues['products'].push(product.dataValues)
        } else if (csvrow[13].toLowerCase().includes(" " + element) || csvrow[13].toLowerCase() == element) {
          const product = await create_products(csvrow, element, id)
          dataValues['products'].push(product.dataValues)
        }
      }
      if (csvrow[13] == 'Women Clothes') {
        const gender = "Female"
        const garment = await create_clothing(csvrow,id,gender)
        dataValues['clothing'].push(garment.dataValues)
      }
      if (csvrow[13] == 'Men Clothes') {
        const gender = 'Male'
        const garment = await create_clothing(csvrow,id,gender)
        dataValues['clothing'].push(garment.dataValues)
      }
    })
    .on('end', async function () {
      console.log(`Done with shopee`)
      await cache.setAsync(`downloading-${id}`, false);
      return (dataValues)
    });
}

const create_products = async (csvrow, element, id) => {
  const objects = await products.create({
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
    Page_ID: id,
    label: element,
  })
  return (objects)
}

const create_clothing = async (csvrow,id,gender) => {
  const garment = await clothing.create({
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
    Page_ID: id,
    Gender: gender,
  })
  return (garment)
}
