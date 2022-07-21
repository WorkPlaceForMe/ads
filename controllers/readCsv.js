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

exports.readCsv = async (publisherId) => {  
  let cachedDown = await cache.getAsync(`downloading-${publisherId}`)
  const sampleProductClothList = await Promise.all([products.findOne({ where: { Page_ID: publisherId } }), 
    clothing.findOne({ where: { Page_ID: publisherId } })])
  
  if (sampleProductClothList[0] && sampleProductClothList[1] ) {
    return getProductClothData(publisherId)
  } else if (!cachedDown)  {

    return new Promise(async (resolve, reject) => {   
      const downloadPromises = []
      await cache.setAsync(`downloading-${publisherId}`, true)
      const providers = [       
        {
          id: 308,
          label: 'Big C',
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
          label: 'Tops Online', 
          csvReader: topsCsvReader
        },
        { 
          id: 722, 
          label: 'JD Central', 
          csvReader: jdCentralCsvReader
        },
        { 
          id: 730, 
          label: 'Central Online',
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
            )}/v1/publishers/me/sites/${publisherId}/campaigns/${provider.id}/productfeed/url`

          console.log(`Downloading data for site ${publisherId} for provider ${provider.label} affiliateEndpoint ${affiliateEndpoint}`)
          
          const affiliateResponse = await axios.get(affiliateEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Accesstrade-User-Type': 'publisher',
            },
          })          

          downloadPromises.push(download(affiliateResponse.data.baseUrl, publisherId, provider))            
        }

        await Promise.all(downloadPromises)
        await cache.setAsync(`downloading-${publisherId}`, false)

        console.log(`Setup completed for site ${publisherId} for all providers`)
        
        resolve(getProductClothData(publisherId))
      } catch (err) {
        console.log(err)
        reject(err)
      }
    })
  } else {
    cachedDown = await cache.getAsync(`downloading-${publisherId}`)
    
    while (cachedDown == 'true') {
      cachedDown = await cache.getAsync(`downloading-${publisherId}`)
      continue
    }
    
    return getProductClothData(publisherId)
  }
}

const download = (url, publisherId, provider) => {
  let csv = ''

  return new Promise((resolve, reject) => {  
    try {
      var sendDate = new Date().getTime()
      console.log(`Downloading csv data for site ${publisherId} for provider ${provider.label}`)
      const csvFileName = `${provider.id}-${publisherId}.csv`
      
      progress(request(url))
        .on('error', error => reject(error))
        .on('end', async () => {
          console.log(`Response received for csv data for site ${publisherId} for provider ${provider.label}`)      
          var readStream = fs.createReadStream(csvFileName)     
          const data = Readable.from(readStream)
          var receiveDate = new Date().getTime()
          var responseTimeMs = receiveDate - sendDate
          console.log(`Downloading csv data for site ${publisherId} for provider ${provider.label} completed in ${responseTimeMs}ms` )
          csv = await provider.csvReader.readCsv(data, publisherId)
          fs.unlinkSync(csvFileName)
          resolve(csv)
        })
        .pipe(fs.createWriteStream(csvFileName))
        
      } catch(err) {
        console.log(`Downloading csv data for site ${publisherId} for provider ${provider.label} failed`)
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

const getProductClothData = async (publisherId) => {
  const Clothing = clothing.findAll({
    raw: true,
    where: { Page_ID: publisherId },
    limit: 5000,
    order: db.sequelize.random()
  })
  
  const Products = products.findAll({
    raw: true,
    where: { Page_ID: publisherId },
    limit: 5000,
    order: db.sequelize.random()
  })
  
  const dataValues = await Promise.all([Clothing, Products])
  
  return flatten(dataValues)
}
