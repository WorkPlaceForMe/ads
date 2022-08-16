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
    await cache.setAsync(`downloading-${publisherId}`, true)

    return new Promise(async (resolve, reject) => {   
      const downloadPromises = []      
      const providers = [       
        {
          id: conf.get('bigc.campaign_id'),
          label: 'Big C',
          csvReader: bigcCsvReader
        },
        { 
          id: conf.get('lazada.campaign_id'), 
          label: 'Lazada', 
          csvReader: lazadaCsvReader
        },
        { 
          id: conf.get('topsOnline.campaign_id'), 
          label: 'Tops Online', 
          csvReader: topsCsvReader
        },
        { 
          id: conf.get('jdCentral.campaign_id'), 
          label: 'JD Central', 
          csvReader: jdCentralCsvReader
        },
        { 
          id: conf.get('centralOnline.campaign_id'), 
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
        console.log(`Error downloading and setting up csv data for publisher id ${publisherId}`)
        console.log(err)
        cache.setAsync(`downloading-${publisherId}`, false)
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
    const csvFileName = `csv/${provider.id}-${publisherId}.csv`
    
    try {
      var sendDate = new Date().getTime()
      console.log(`Downloading csv data for site ${publisherId} for provider ${provider.label}`)
      
      progress(request(url))
        .on('error', error => {
          console.log(`Downloading csv data for site ${publisherId} for provider ${provider.label} failed`)
          console.log(error)
          fs.unlinkSync(csvFileName)
          reject(error)          
        })
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
  const maleClothing = clothing.findAll({
    raw: true,
    where: { Page_ID: publisherId, Gender: 'Male' },
    limit: 5000,
    order: db.sequelize.random()
  })

  const femaleClothing = clothing.findAll({
    raw: true,
    where: { Page_ID: publisherId, Gender: 'Female' },
    limit: 5000,
    order: db.sequelize.random()
  })
  
  const items = products.findAll({
    raw: true,
    where: { Page_ID: publisherId },
    limit: 10000,
    order: db.sequelize.random()
  })
  
  const dataValues = await Promise.all([maleClothing, femaleClothing, items])
  
  return flatten(dataValues)
}
