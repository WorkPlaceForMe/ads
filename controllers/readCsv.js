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
  const val1 = await db.sequelize.query(`SELECT EXISTS (SELECT 1 FROM ${conf.get('database')}.products);`)
  const val2 = await db.sequelize.query(`SELECT EXISTS (SELECT 1 FROM ${conf.get('database')}.clothings);`)
  let cachedDown = await cache.getAsync(`downloading-${idPbl}`);
  if (Object.values(val1[0][0])[0] == 1 && Object.values(val2[0][0])[0] == 1) {
    const Clothing = await clothing.findAll({
      raw: true,
      where: { Page_ID: idPbl },
    })
    const Products = await products.findAll({
      raw: true,
      where: { Page_ID: idPbl },
    })
    const dataValues = Clothing.concat(Products)
    
    return dataValues
  }else {
    console.log(cachedDown)
    if (cachedDown == 'false' || !cachedDown) {
      await cache.setAsync(`downloading-${idPbl}`, true);
      // return new Promise((resolve, reject) => {
        const ids = {
          shopee: 677
        }
        try{
          const credentials = await aff.getAff()
          const token = jwt.sign(
            { sub: credentials.userUid },
            credentials.secretKey,
            {
              algorithm: "HS256"
            }
          )
          let affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${idPbl}/campaigns/677/productfeed/url`
          axios.get(affiliateEndpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Accesstrade-User-Type': 'publisher'
            }
          }).then((affiliateResponse) => {
            console.log(`Downloading ${idPbl}`)
            download(affiliateResponse.data.baseUrl, idPbl)
              .then((rs) => {
                readCsv(rs, idPbl)
                  .then((results) =>{
                    return(results)}).catch((err) => {
                      console.error(err)
                      return(err)
                    })
              })
          })
        }catch(err){
          console.log(err)
        }
    }else {
      cachedDown = await cache.getAsync(`downloading-${idPbl}`)
      while (cachedDown == 'true') {
        cachedDown = await cache.getAsync(`downloading-${idPbl}`)
        continue;
      }
      const Clothing = await clothing.findAll({
        raw: true,
        where: { Page_ID: idPbl },
      })
      const Products = await products.findAll({
        raw: true,
        where: { Page_ID: idPbl },
      })
      const dataValues = Clothing.concat(Products)
      return dataValues
    }
  }
}

async function readCsv(path, id) {
  const promises = []
  path
    .pipe(parseCsv({ delimiter: ',', from_line: 2, headers: true }))
    .on('data', async function (csvrow) {
      for (const element of objetos['Products']) {
        if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase() == element) {
          const product = create_products(csvrow, element, id)
          // dataValues['products'].push(product.dataValues)
          promises.push(product)
        } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase() == element) {
          const product = create_products(csvrow, element, id)
          // dataValues['products'].push(product.dataValues)
          promises.push(product)
        } else if (csvrow[13].toLowerCase().includes(" " + element) || csvrow[13].toLowerCase() == element) {
          const product = create_products(csvrow, element, id)
          // dataValues['products'].push(product.dataValues)
          promises.push(product)
        }
      }
      if (csvrow[13] == 'Women Clothes') {
        const gender = "Female"
        const garment = create_clothing(csvrow, id, gender)
        // dataValues['clothing'].push(garment.dataValues)
        promises.push(garment)
      }
      if (csvrow[13] == 'Men Clothes') {
        const gender = 'Male'
        const garment = create_clothing(csvrow, id, gender)
        // dataValues['clothing'].push(garment.dataValues)
        promises.push(garment)
      }
      if (csvrow[13] == 'Sports & Outdoors' && !csvrow[15].includes('Sportswear')) {
        const product = create_products(csvrow, 'sport', id)
        promises.push(product)
      }
      if (csvrow[13] == 'Beauty & Personal Care') {
        const product = create_products(csvrow, 'makeup', id)
        promises.push(product)
      }
      if (csvrow[15] == 'Mobile') {
        const product = create_products(csvrow, 'cell_phone', id)
        promises.push(product)
      }
    })
    .on('end', async () => {
      const todo = await Promise.all(promises)
      const dataValues = todo.map(objects => objects.dataValues)
      console.log('done with shopee')
      await cache.setAsync(`downloading-${id}`, false);
      return dataValues
    });
}

const create_products = (csvrow, element, id) => {
  const objects = products.create({
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
    Type: "products"
  })
  return (objects)
}

const create_clothing = (csvrow, id, gender) => {
  const garment = clothing.create({
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
    Type: 'clothing'
  })
  return (garment)
}

const download = async (url) => {
  const resp = await axios.get(url)
  const Csv = Readable.from(resp.data)
  return (Csv)
}

exports.download = async function (idPbl) {
  await cache.setAsync(`downloading-${idPbl}`, true);
  try{
    const credentials = await aff.getAff()
    const token = jwt.sign(
      { sub: credentials.userUid },
      credentials.secretKey,
      {
        algorithm: "HS256"
      }
    )
    let affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${idPbl}/campaigns/677/productfeed/url`
    axios.get(affiliateEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Accesstrade-User-Type': 'publisher'
      }
    }).then((affiliateResponse) => {
      console.log(`Downloading ${idPbl}`)
      download(affiliateResponse.data.baseUrl, idPbl)
        .then((rs) => {
          readCsv(rs, idPbl)
            .then((results) =>{
              return(results)}).catch((err) => {
                console.error(err)
                return(err)
              })
        })
    })
  }catch(err){
    console.log(err)
    return err
  }
}

exports.read = async function (idPbl){
    const Clothing = await clothing.findAll({
      raw: true,
      where: { Page_ID: idPbl },
    })
    const Products = await products.findAll({
      raw: true,
      where: { Page_ID: idPbl },
    })
    const dataValues = Clothing.concat(Products)
    return dataValues
}