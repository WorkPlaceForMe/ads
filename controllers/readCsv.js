const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const cache = require('../helper/cacheManager')
const parseCsv = require('csv-parse')
const objetos = require('../csv/objetos2.json')
const { Readable } = require('stream')
const db = require('../campaigns-db/database')
const products = db.products
const clothing = db.clothing

exports.readCsv = async function (idPbl) {
  let cachedDown = await cache.getAsync(`downloading-${idPbl}`)
  const val1 = products.findOne({ where: { Page_ID: idPbl } })
  const val2 = clothing.findOne({ where: { Page_ID: idPbl } })
  const enter = await Promise.all([val1, val2])
  if (enter[0] != null && enter[1] != null) {
    const Clothing = clothing.findAll({
      raw: true,
      where: { Page_ID: idPbl },
    })
    const Products = products.findAll({
      raw: true,
      where: { Page_ID: idPbl },
    })
    const dataValues = await Promise.all([Clothing, Products])
    const flat = flatten(dataValues)
    return flat
  } else {
    if (!cachedDown) {
      await cache.setAsync(`downloading-${idPbl}`, true)
      const results = []
      const providerIds = {
        bigc:   308,
        lazada: 520,
        trueshopping: 594,
        tops:   704,
        jdcentral: 722,
        central: 730
      }
      
      try {
        const credentials = await aff.getAff()
        const token = jwt.sign(
          { sub: credentials.userUid },
          credentials.secretKey,
          {
            algorithm: 'HS256',
          },
        )        

        for (const providerId of Object.keys(providerIds)){
          let affiliateEndpoint = ''

          try {
            affiliateEndpoint = `${conf.get(
              'accesstrade_endpoint',
            )}/v1/publishers/me/sites/${idPbl}/campaigns/${providerIds[providerId]}/productfeed/url`

            console.log(`Downloading data for site ${idPbl} for provider ${providerId} affiliateEndpoint ${affiliateEndpoint} `)
            
            const affiliateResponse = await axios.get(affiliateEndpoint, {
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Accesstrade-User-Type': 'publisher',
              },
            })
            
            const rs = await download(affiliateResponse.data.baseUrl, idPbl, providerId)
            const affiliateResult = await readCsv(rs, idPbl, providerId, results)

            if(affiliateResult){
              results.push(...affiliateResult)
            }
          } catch (err) {
            console.log(`Downloading data for site ${idPbl} for provider ${providerId} affiliateEndpoint ${affiliateEndpoint} failed`)
            console.log(err)
          }
        }

        await cache.setAsync(`downloading-${idPbl}`, false)

        return results
      } catch (err) {
        console.log(err)
      }
    } else {
      cachedDown = await cache.getAsync(`downloading-${idPbl}`)
      while (cachedDown == 'true') {
        cachedDown = await cache.getAsync(`downloading-${idPbl}`)
        continue
      }
      const Clothing = clothing.findAll({
        raw: true,
      })
      const Products = products.findAll({
        raw: true,
      })
      const dataValues = await Promise.all([Clothing, Products])
      const flat = flatten(dataValues)
      return flat
    }
  }
}

async function readCsv(Readable, id, providerName) {
  const promises = []
  console.log('piping')
  var sendDate = new Date().getTime()
  
  Readable.pipe(parseCsv({ delimiter: ',', from_line: 2, headers: true }))
    .on('data', function (csvrow) {
      try { 
        for (const element of objetos['Products']) {
          if (csvrow[15] && 
            csvrow[15].toLowerCase().toLowerCase().includes(element)
          ) {
            const product = create_products(csvrow, element, id)
            promises.push(product)
          } else if (csvrow[17] &&
            csvrow[17].toLowerCase().includes(element)
          ) {
            const product = create_products(csvrow, element, id)
            promises.push(product)
          } else if (csvrow[13] &&
            csvrow[13].toLowerCase().toLowerCase().includes(element)
          ) {
            const product = create_products(csvrow, element, id)
            promises.push(product)
          }
        }
        
        if (csvrow[13] && csvrow[13] == 'Women Clothes') {
          const gender = 'Female'
          const garment = create_clothing(csvrow, id, gender)
          promises.push(garment)
        }
        
        if (csvrow[13] && csvrow[13] == 'Men Clothes') {
          const gender = 'Male'
          const garment = create_clothing(csvrow, id, gender)
          promises.push(garment)
        }
        
        if (
          csvrow[13] && csvrow[13].toLowerCase().includes('sport') &&
          !csvrow[15].toLowerCase().includes('sportswear')
        ) {
          const product = create_products(csvrow, 'sport', id)
          promises.push(product)
        }
        
        if (csvrow[13] && csvrow[13].toLowerCase().includes('beauty')){
          const product = create_products(csvrow, 'makeup', id)
          promises.push(product)
        }
        
        if (csvrow[15] && csvrow[15].toLowerCase().includes('mobile')) {
          const product = create_products(csvrow, 'cell_phone', id)
          promises.push(product)
        }
      } catch(e) {
        console.log('Error in reading csv row')
        console.log(e)
      }
    })
    .on('end', async () => {
      const todo = await Promise.all(promises)
      console.log(`done with provider ${providerName}`)
      var receiveDate = new Date().getTime()
      var responseTimeMs = receiveDate - sendDate
      console.log(responseTimeMs)      
      const dataValues = todo.map((objects) => objects.dataValues)

      return dataValues
    })
}

const download = async (url, idPbl, providerName) => {
  let Csv = ''

  try {
    var sendDate = new Date().getTime()
    console.log(`Downloading ${idPbl} provider ${providerName}`)
    const resp = await axios.get(url)
    Csv = Readable.from(resp.data)
    var receiveDate = new Date().getTime()
    var responseTimeMs = receiveDate - sendDate
    console.log(`Downloading ${idPbl} provider ${providerName} completed in ${responseTimeMs}ms` )
  } catch(e) {
    console.log(`Downloading ${idPbl} provider ${providerName} failed`)
    console.log(e)
  }

  return Csv
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
    Type: 'products',
  })
  return objects
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
    Type: 'clothing',
  })
  return garment
}

const flatten = (ary) => {
  return ary.reduce((a, b) => {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}
