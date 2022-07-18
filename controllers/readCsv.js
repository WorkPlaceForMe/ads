const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const cache = require('../helper/cacheManager')
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

exports.readCsv = async function (idPbl) {
  let cachedDown = await cache.getAsync(`downloading-${idPbl}`)
  const val1 = products.findOne({ where: { Page_ID: idPbl } })
  const val2 = clothing.findOne({ where: { Page_ID: idPbl } })
  const enter = await Promise.all([val1, val2])
  if (enter[0] && enter[1]) {
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
      const providers = [
        {
          id: 308,
          label: "bigc",
          csvReader: bigcCsvReader
        },
        { 
          id: 520, 
          label: "lazada", 
          csvReader: lazadaCsvReader
        },
        { 
          id: 594, 
          label: "trueshopping", 
          csvReader: trueShoppingCsvReader
        },
        { 
          id: 704, 
          label: "tops", 
          csvReader: topsCsvReader
        },
        { 
          id: 722, 
          label: "jdcentral", 
          csvReader: jdCentralCsvReader
        },
        { 
          id: 730, 
          label: "central",
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
            )}/v1/publishers/me/sites/${idPbl}/campaigns/${provider.id}/productfeed/url`

          console.log(`Downloading data for site ${idPbl} for provider ${provider.label} affiliateEndpoint ${affiliateEndpoint} `)
          
          const affiliateResponse = await axios.get(affiliateEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Accesstrade-User-Type': 'publisher',
            },
          })
          
          const rs = await download(affiliateResponse.data.baseUrl, idPbl, provider.label)
          const affiliateResult = await provider.csvReader.readCsv(rs, idPbl)

          if(affiliateResult){
            results.push(...affiliateResult)
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

const flatten = (ary) => {
  return ary.reduce((a, b) => {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}
