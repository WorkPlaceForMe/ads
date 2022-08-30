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
const { v4: uuidv4 } = require('uuid')
const products = db.products
const clothing = db.clothing

exports.readCsv = (publisherId) => {  

  return new Promise(async (resolve, reject) => { 
    let cachedDown = await cache.getAsync(`downloading-${publisherId}`)
    let productAndClothsData = []

    if(cachedDown && cachedDown == 'false'){
      productAndClothsData = await getProductClothData(publisherId)
    }
    
    if (productAndClothsData && productAndClothsData.length > 0) {
      resolve(productAndClothsData)
    } else if (!cachedDown)  {
      await cache.setAsync(`downloading-${publisherId}`, true)     
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
          try {
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
          } catch(err) {
            console.log(`Error downloading csv data site ${publisherId} for provider ${provider.label}`)
            console.log(err)
          } 
        }

        await Promise.all(downloadPromises)
        await cache.setAsync(`downloading-${publisherId}`, false)

        console.log(`Setup completed for site ${publisherId} for all providers`) 

        productAndClothsData = await getProductClothData(publisherId)
        
        resolve(productAndClothsData)
      } catch (err) {
        console.log(`Error downloading and setting up csv data for publisher id ${publisherId}`)
        console.log(err)
        await cache.setAsync(`downloading-${publisherId}`, false)
        reject(err)
      }
    } else {
      cachedDown = await cache.getAsync(`downloading-${publisherId}`)
      
      while (cachedDown == 'true') {
        cachedDown = await cache.getAsync(`downloading-${publisherId}`)
        continue
      }

      productAndClothsData = await getProductClothData(publisherId)
      resolve(productAndClothsData)
    }
  })
}

const download = (url, publisherId, provider) => {
  let csv = ''

  return new Promise((resolve, reject) => {
    const uuid = uuidv4();  
    const csvFileName = `${conf.get('csv_download_folder_location')}/${provider.id}-${publisherId}-${uuid}.csv`
    
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
    let productAndClothsData = await cache.getAsync(`productAndClothsData-${publisherId}`)

    if(productAndClothsData && productAndClothsData != '{}' && productAndClothsData != '[]'){
      return shuffleArray(JSON.parse(productAndClothsData))
    } else {
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
      
      productAndClothsData = flatten(dataValues)

      if (productAndClothsData?.length > 0) {
        console.log(`Saving productAndClothsData for publisher ${publisherId} into cache`)
        cache.setAsync(`productAndClothsData-${publisherId}`, JSON.stringify(productAndClothsData))
      }

      return productAndClothsData
    }
}

const shuffleArray = (arr) => {
  for (let i = arr.length -1; i > 0; i--) {
    j = Math.floor(Math.random() * i)
    k = arr[i]
    arr[i] = arr[j]
    arr[j] = k
  }

  return arr
}
