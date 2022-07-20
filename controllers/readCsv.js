const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const cache = require('../helper/cacheManager')
const fs = require('fs');
const request = require('request');
var progress = require('request-progress');
const { Readable } = require('stream')
const  bigcCsvReader  = require('./provider/bigcCsvReader')
const  lazadaCsvReader  = require('./provider/lazadaCsvReader')
const  trueShoppingCsvReader  = require('./provider/trueShoppingCsvReader')
const  topsCsvReader  = require('./provider/topsCsvReader')
const  jdCentralCsvReader  = require('./provider/jdCentralCsvReader')
const  centralCsvReader  = require('./provider/centralCsvReader')
const db = require('../campaigns-db/database')
const products = db.products
const clothing = db.clothing

exports.readCsv = async (siteId) => {  
  let cachedDown = await cache.getAsync(`downloading-${siteId}`)
  const val1 = products.findOne({ where: { Page_ID: siteId } })
  const val2 = clothing.findOne({ where: { Page_ID: siteId } })
  const enter = await Promise.all([val1, val2])
  
  if (enter[0] && enter[1]) {
    return getProductClothData()
  } else if (!cachedDown)  {

    return new Promise(async (resolve, reject) => {   
      const downloadPromises = []
      await cache.setAsync(`downloading-${siteId}`, true)
      const providers = [       
        {
          id: 308,
          label: 'Bigc',
          csvReader: bigcCsvReader
        },
        { 
          id: 520, 
          label: 'Lazada', 
          csvReader: lazadaCsvReader
        },
        { 
          id: 594, 
          label: 'True Shopping', 
          csvReader: trueShoppingCsvReader
        },
        { 
          id: 704, 
          label: 'Tops', 
          csvReader: topsCsvReader
        },
        { 
          id: 722, 
          label: 'JD Central', 
          csvReader: jdCentralCsvReader
        },
        { 
          id: 730, 
          label: 'Central',
          csvReader: centralCsvReader
        }
      ]
      
      try {
        for (const provider of providers){
          const credentials = await aff.getAff()
          const token = jwt.sign(
            { sub: credentials.userUid },
            credentials.secretKey,
            {
              algorithm: 'HS256',
            },
          )   

          let affiliateEndpoint = `${conf.get(
              'accesstrade_endpoint',
            )}/v1/publishers/me/sites/${siteId}/campaigns/${provider.id}/productfeed/url`

          console.log(`Downloading data for site ${siteId} for provider ${provider.label} affiliateEndpoint ${affiliateEndpoint}`)
          
          const affiliateResponse = await axios.get(affiliateEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Accesstrade-User-Type': 'publisher',
            },
          })          

          downloadPromises.push(download(affiliateResponse.data.baseUrl, siteId, provider))            
        }

        await Promise.all(downloadPromises)
        await cache.setAsync(`downloading-${siteId}`, false)

        console.log(`Setup completed for site ${siteId} for all providers`)
        
        resolve(getProductClothData())
      } catch (err) {
        console.log(err)
        reject(err)
      }
    })
  } else {
    cachedDown = await cache.getAsync(`downloading-${siteId}`)
    
    while (cachedDown == 'true') {
      cachedDown = await cache.getAsync(`downloading-${siteId}`)
      continue
    }
    
    return getProductClothData()
  }
}

const download = (url, siteId, provider) => {
  let csv = ''

  return new Promise((resolve, reject) => {  
    try {
      var sendDate = new Date().getTime()
      console.log(`Downloading csv data for site ${siteId} for provider ${provider.label}`)
      const csvFileName = `${provider.label}.csv`
      
      progress(request(url))
        .on('error', error => reject(error))
        .on('end', async () => {
          console.log(`Response received for csv data for site ${siteId} for provider ${provider.label}`)      
          var readStream = fs.createReadStream(csvFileName)     
          const data = Readable.from(readStream)
          var receiveDate = new Date().getTime()
          var responseTimeMs = receiveDate - sendDate
          console.log(`Downloading csv data for site ${siteId} for provider ${provider.label} completed in ${responseTimeMs}ms` )
          csv = await provider.csvReader.readCsv(data, siteId)
          fs.unlinkSync(csvFileName)
          resolve(csv)
        })
        .pipe(fs.createWriteStream(csvFileName))
        
      } catch(err) {
        console.log(`Downloading csv data for site ${siteId} for provider ${provider.label} failed`)
        console.log(err)
        fs.unlinkSync(csvFileName)
        reject(err)
      }
  })
}

const flatten = (ary) => {
  return ary.reduce((a, b) => {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}

const getProductClothData = async () => {
  const Clothing = clothing.findAll({
    raw: true,
    where: { Page_ID: siteId },
    limit: 5000,
    order: db.sequelize.random()
  })
  
  const Products = products.findAll({
    raw: true,
    where: { Page_ID: siteId },
    limit: 5000,
    order: db.sequelize.random()
  })
  
  const dataValues = await Promise.all([Clothing, Products])
  
  return flatten(dataValues)
}
