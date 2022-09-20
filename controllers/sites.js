const Controller = require('../helper/controller')
const Sequelize = require('sequelize')
const db = require('../campaigns-db/database')
const publishers = db.publishers
const adsPage = db.adsPage
const imgsPage = db.imgsPage
const impressions = db.impressions
const { v4: uuidv4 } = require('uuid')
const conf = require('../middleware/prop')
const cache = require('../helper/cacheManager')
const { deleteRedisData, reloadPublisher, getHostname } = require('../helper/util')
const website = require('../helper/website')
const readCsv = require('./readCsv')

exports.register = Controller(async(req, res) => {
    const locId = uuidv4();
    const data = req.body
    const minPossibleAdsCount = conf.get('min_possible_ads_count') || 1
    const maxPossibleAdsCount = conf.get('max_possible_ads_count') || 4
    
    try{       
        let publisherId = ''
        
        if(data.adsperimage < minPossibleAdsCount || data.adsperimage > maxPossibleAdsCount){
            return res.status(500).json({success: false, mess: `Wrong max ads per image no specified, it should be between ${minPossibleAdsCount} to ${maxPossibleAdsCount}`})
        }

        console.log(`Trying to register a new site ${data.name}`) 
        const websiteResponse = await website.getWebsites()                                   

        if(websiteResponse){
            const currentSite = websiteResponse.filter( item => item.name == data.name)
            publisherId = currentSite[0] ? currentSite[0].id : ''
        }

        if(!publisherId){
            console.log(`${data.name} does not exist at Accesstrade, creating a new site there`) 
            publisherId = await website.createWebsite(data.name, null)
        }

        console.log(`Adding site ${data.name} to system`)
        
        if(publisherId) {
            const newPublisher = await createPublisher(locId, data.name, getHostname(data.name), data.nickname, publisherId, data.adsperimage)
            cache.setAsync(`${newPublisher.dataValues.hostname}-publisher`, JSON.stringify(newPublisher))

            readCsv.readCsv(publisherId).then(() => {
                console.log(`Data populated for new publisher with publisher id: ${publisherId}`)
            }).catch(error => {
                console.log(`Error in populating data in new publisher with publisher id: ${publisherId}`)
                console.log(error)
            })
            
            return res.status(200).json({success: true});
        } else {
            console.log(`Cannot add site ${data.name} to system`)
            return res.status(500).json({success: false, mess: `Cannot add site ${data.name} to system`})
        }       
    } catch(err){
        console.log(`Cannot add site ${data.name} to system`)
        return res.status(500).json({success: false, mess: 'Unknow error occurred, please contact site Administrator'})
    }
})

exports.update = Controller(async(req, res) => {
    const minPossibleAdsCount = conf.get('min_possible_ads_count') || 1
    const maxPossibleAdsCount = conf.get('max_possible_ads_count') || 4
    const data = req.body
    
    try{
        if(data.adsperimage < minPossibleAdsCount || data.adsperimage > maxPossibleAdsCount){
            return res.status(500).json({success: false, mess: `Wrong max ads per image no specified, it should be between ${minPossibleAdsCount} to ${maxPossibleAdsCount}`})
        }

        let oldAdsPerImage = 0
        const oldPublisher = await publishers.findOne({
            where: { id: data.id }
        })

        oldAdsPerImage = oldPublisher.adsperimage

        const newPublisher = await updatePublisher(data)
        cache.setAsync(`${newPublisher.dataValues.hostname}-publisher`, JSON.stringify(newPublisher))

        if(newPublisher && oldAdsPerImage > 0 && newPublisher.dataValues.adsperimage != oldAdsPerImage){
            deleteRedisData(newPublisher.dataValues.hostname).then(() => {                 
                console.log(`All redis cache data deleted for publisher ${newPublisher.dataValues.hostname}`)
              }).catch(error => {
                console.error(error, `Error deleting redis cachec data for publisher ${newPublisher.dataValues.hostname}`)
              })
        }

        return res.status(200).json({success: true});
    } catch(err){
        return res.status(500).json({success: false, mess: 'Unknow error occurred in website deletion, please contact site Administrator'})
    }
})

exports.get = Controller(async(req, res) => {
    const publ = await publishers.findOne({
        where: { id: req.params.id }
    })

    const minPossibleAdsCount = conf.get('min_possible_ads_count') || 1
    const maxPossibleAdsCount = conf.get('max_possible_ads_count') || 4

    return res.status(200).json({success: true, publ: publ, minPossibleAdsCount: minPossibleAdsCount, maxPossibleAdsCount: maxPossibleAdsCount});
})

exports.getAll = Controller(async(req, res) => {
    const publ = await publishers.findAll()
    
    res.status(200).json({success: true, publ: publ});
})

exports.reloadPublisher = Controller(async(req, res) => {
  
    try{
        const publisher = await publishers.findOne({
            where: { id: req.params.id }
        })

        const publisherUpdateInProgress = await cache.getAsync(`downloading-${publisher.dataValues.publisherId}`)
    
        if (publisherUpdateInProgress && publisherUpdateInProgress == 'true') {
            return res.status(500).json({success: false, mess: 'Website is reloading products, cannot be reloaded for now, please wait'})
        }

        if(!publisher){
            return res.status(500).json({success: false, mess: 'Could not reload as website does not exist'})
        }
        
        reloadPublisher(publisher)

        return res.status(200).json({success: true});
    } catch(err){
        return res.status(500).json({success: false, mess: 'Unknow error occurred in website product reload, please contact site Administrator'})
    }
})

exports.getServer = Controller(async(req, res) => {
    const server = conf.get('server')
    const minPossibleAdsCount = conf.get('min_possible_ads_count') || 1
    const maxPossibleAdsCount = conf.get('max_possible_ads_count') || 4
    
    return res.status(200).json({success: true, server: server, minPossibleAdsCount: minPossibleAdsCount, maxPossibleAdsCount: maxPossibleAdsCount});
})

exports.del = Controller(async(req, res) => {
    const data = req.params.id 
    
    try{        
        const publ = await publishers.findOne({
            where: { id: req.params.id }
        })

        const publisherUpdateInProgress = await cache.getAsync(`downloading-${publ.dataValues.publisherId}`)
    
        if (publisherUpdateInProgress && publisherUpdateInProgress == 'true') {
            return res.status(500).json({success: false, mess: 'Website is reloading products, cannot be deleted for now, please wait'})
        }

        const affiliateEndpointCampaings = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${publ.dataValues.publisherId}`
        
        try{
            console.log(`Calling url: ${affiliateEndpointCampaings}`)
            
            const siteDeletePromises = [];

            siteDeletePromises.push(delSite(data))

            siteDeletePromises.push(db.clothing.destroy({
              where: { Page_ID: publ.dataValues.publisherId }
            }))
            
            siteDeletePromises.push(db.products.destroy({
              where: { Page_ID: publ.dataValues.publisherId }
            }))
            
            Promise.all(siteDeletePromises).then(() => {
                delAds(publ.dataValues.hostname) 
                delImages(publ.dataValues.hostname)
                delImpressions(publ.dataValues.hostname)        
                cache.del(`downloading-${publ.dataValues.publisherId}`)
                cache.del(`saving-productAndClothsData-${publ.dataValues.publisherId}`)
                cache.del(`productAndClothsData-${publ.dataValues.publisherId}`) 
                
                deleteRedisData(publ.dataValues.hostname).then(() => {                 
                    console.log(`All redis cache data deleted for publisher ${publ.dataValues.hostname}`)
                }).catch(error => {
                    console.error(error, `Error deleting redis cachec data for publisher ${publ.dataValues.hostname}`)
                })
            }).then(() => {                 
                console.log(`All product data deleted for publisher ${publ.dataValues.hostname}`)
            }).catch(error => {
                console.error(error, `Error in deleting product for publisher ${publ.dataValues.hostname}`)
            })

            res.status(200).json({success: true});
        } catch(err){
            res.status(500).json({success: false})
        }
    } catch(err){
        res.status(500).json({success: false})
    }
})

const createPublisher = async function(id, site, hostname, nickname, publisherId, adsperimage){
    return publishers.create({
        id: id,
        name: site,
        hostname: hostname,
        nickname: nickname,
        publisherId: publisherId,
        adsperimage: adsperimage,
        enabled: 'true'
    })
}

async function updatePublisher(body) {
    const publ = await publishers.findOne({
        where: { id: body.id }
    })
    
    await publ.update({name: body.name, nickname: body.nickname, name: body.name, adsperimage: body.adsperimage})
    
    return publ
}

const delSite = async function(id){
    return publishers.destroy({
      where: { id: id }
    })
}

const delAds = async function(site){
    return adsPage.destroy({
      where: {
        site: {
            [Sequelize.Op.like]: `%${site}%`
          }
        }
    })
}

const delImages = async function(site){
    return imgsPage.destroy({
      where: {
        site: {
          [Sequelize.Op.like]: `%${site}%`,
        }
      }
    })
}

const delImpressions = async function(site){
    return impressions.destroy({
      where: {
        url: {
          [Sequelize.Op.like]: `%${site}%`,
        }
      }
    })
}