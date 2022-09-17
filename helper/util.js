const cache = require('./cacheManager')
const db = require('../campaigns-db/database')
const readCsv = require('../controllers/readCsv')
const products = db.products
const clothing = db.clothing
const publishers = db.publishers

const getStrippedURL = exports.getStrippedURL = url => {
    let newURL = decodeURIComponent(url)

    if(newURL.includes('?')){
      newURL = newURL.split('?').shift()
    }

    if(newURL.endsWith('/')){
      newURL = newURL.substring(0, newURL.length - 1)
    }

    return newURL
}

exports.getHostname = url => {
  let newURL = getStrippedURL(url)

  if (newURL.includes('://')) {
    newURL = newURL.split('://')[1]
  }
  
  if (newURL.includes('www.')) {
    newURL = newURL.split('www.')[1]
  }

  if (newURL.includes('/')) {
    newURL = newURL.split('/')[0]
  }

  return newURL
}

exports.shuffleArray = (arr) => {
    for (let i = arr.length -1; i > 0; i--) {
      j = Math.floor(Math.random() * i)
      k = arr[i]
      arr[i] = arr[j]
      arr[j] = k
    }
  
    return arr
}

const deleteRedisData = exports.deleteRedisData = async (pattern) => {

    return new Promise(async (resolve, reject) => {
      try {
        cache.keys('*', (err, keys) => {
          for (const key of keys) {
            if(key.includes(pattern)){
              cache.del(key)
            }
          }
  
          resolve()
        })      
      } catch (err) {
        console.log(err)
        reject(err)
      }
    })
}
  
exports.reloadPublisher = async (publisher) => {
    const publisherUpdateInProgress = await cache.getAsync(`downloading-${publisher.dataValues.publisherId}`)
    
    if (publisherUpdateInProgress == 'true') {
      return
    }

    console.log(`Publisher: ${publisher.dataValues.name} will be reloaded with data`)

    const productClothPromises = [];

    productClothPromises.push(clothing.destroy({
      where: { Page_ID: publisher.dataValues.publisherId }
    }))
    
    productClothPromises.push(products.destroy({
      where: { Page_ID: publisher.dataValues.publisherId }
    }))
    
    Promise.all(productClothPromises).then(() => {
      console.log(`All products and cloths deleted for publisher: ${publisher.dataValues.name}`)

      cache.del(`downloading-${publisher.dataValues.publisherId}`)
      cache.del(`saving-productAndClothsData-${publisher.dataValues.publisherId}`)
      cache.del(`productAndClothsData-${publisher.dataValues.publisherId}`)  
      readCsv.readCsv(publisher.dataValues.publisherId).then(() => {
        
        //Need to update updatedAt time
        publishers.update(
          {
            publisherId: publisher.dataValues.publisherId
          },
          {
            where: {
              publisherId: publisher.dataValues.publisherId
            }
          }).then(() => {
            console.log(`Publisher ${publisher.dataValues.name} updated with latest products and cloths`) 

            deleteRedisData(publisher.dataValues.hostname).then(() => {                 
              console.log(`All redis cache data deleted for publisher ${publisher.dataValues.hostname}`)
            }).catch(error => {
              console.error(error, `Error deleting redis cachec data for publisher ${publisher.dataValues.hostname}`)
            })
        })                  
      }).catch(error => {
        console.log(`Error downloading and setting up csv data for publisher ${publisher.dataValues.hostname}`)
        console.log(error)
        cache.setAsync(`downloading-${publisher.dataValues.publisherId}`, false)
      })
    })
} 