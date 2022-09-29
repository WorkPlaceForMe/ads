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
const { deleteRedisData, reloadPublisher, getHostname, updatePublisherWithPages } = require('../helper/util')
const website = require('../helper/website')
const readCsv = require('./readCsv')

exports.register = Controller(async(req, res) => {
    const locId = uuidv4();
    const data = req.body
    const minPossibleAdsCountPerImage = conf.get('min_possible_ads_count_per_image') || 1
    const maxPossibleAdsCountPerImage = conf.get('max_possible_ads_count_per_image') || 4
    
    try{       
        let publisherId = ''
        
        if(data.adsperimage < minPossibleAdsCountPerImage || data.adsperimage > maxPossibleAdsCountPerImage){
            return res.status(500).json({success: false, name: 'adsperimage', mess: `Wrong max ads per image no specified, it should be between ${minPossibleAdsCountPerImage} to ${maxPossibleAdsCountPerImage}`})
        }

        if(data.adsperpage < minPossibleAdsCountPerImage){
            return res.status(500).json({success: false, name: 'adsperpage', mess: `Wrong default max ads per page no specified, it should be greater or equal to ${minPossibleAdsCountPerImage}`})
        }

        if(data.adsperpage < data.adsperimage){
            return res.status(500).json({success: false, name: 'adsperpage', mess: `Wrong default max ads per page no specified, it should be greater or equal to specified publisher max ads per image no ${data.adsperimage}`})
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
            const newPublisher = await createPublisher(locId, data.name, getHostname(data.name), data.nickname, publisherId, data.adsperimage, data.adsperpage)
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
    const minPossibleAdsCountPerImage = conf.get('min_possible_ads_count_per_image') || 1
    const maxPossibleAdsCountPerImage = conf.get('max_possible_ads_count_per_image') || 4
    const data = req.body
    
    try{
        if(data.adsperimage < minPossibleAdsCountPerImage || data.adsperimage > maxPossibleAdsCountPerImage){
            return res.status(500).json({success: false, name: 'adsperimage', mess: `Wrong max ads per image no specified, it should be between ${minPossibleAdsCountPerImage} to ${maxPossibleAdsCountPerImage}`})
        }

        if(data.adsperpage < minPossibleAdsCountPerImage){
            return res.status(500).json({success: false, name: 'adsperpage', mess: `Wrong default max ads per page no specified, it should be greater or equal to ${minPossibleAdsCountPerImage}`})
        }

        if(data.adsperpage < data.adsperimage){
            return res.status(500).json({success: false, name: 'adsperpage', mess: `Wrong default max ads per page no specified, it should be greater or equal to specified publisher max ads per image no ${data.adsperimage}`})
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
                console.error(error, `Error deleting redis cache data for publisher ${newPublisher.dataValues.hostname}`)
            })
        }

        return res.status(200).json({success: true})
    } catch(err){
        return res.status(500).json({success: false, mess: 'Unknow error occurred in website updation, please contact site Administrator'})
    }
})

exports.updatePage = Controller(async(req, res) => {
    const minPossibleAdsCountPerPage = conf.get('min_possible_ads_count_per_image') || 1
    const data = req.body

    if(data.page && data.page.includes('://')){
        data.page = data.page.split('://')[1]
    }

    if(data.page && data.page.includes('www.')){
        data.page = data.page.replace('www.', '')
    }

    if(data.page && data.page.endsWith('/')){
        data.page = data.page.substring(0, data.page.length - 1)
    }
    
    try{
        if(data.adsperpage < minPossibleAdsCountPerPage){
            return res.status(500).json({success: false, mess: `Wrong max ads per page no specified, it should be greater or equal to ${minPossibleAdsCountPerPage}`})
        }        

        const publisher = await publishers.findOne({
            where: { id: data.publisherId }
        })

        let pageInfos = publisher.pages

        if(pageInfos && pageInfos.length >= 1){
            let adsPerPageData = pageInfos.filter(item => item.name == data.page)

            if(adsPerPageData && adsPerPageData.length > 0){
                if(data.adsperpage ==  adsPerPageData[0].adsperpage){
                    return res.status(200).json({success: true, mess: 'Max Ads Per Page no has not changed, doing nothing'})
                }

                let currentPageInfo = {name: data.page, adsperpage: data.adsperpage}
                pageInfos = pageInfos.map(item => item.name !== data.page ? item : currentPageInfo)
                updatePublisherWithPages(publisher.id, pageInfos)
            } else {
                pageInfos.push({name: data.page, adsperpage: data.adsperpage})
                updatePublisherWithPages(publisher.id, pageInfos)
            }
        } else {
            pageInfos = []
            pageInfos.push({name: data.page, adsperpage: data.adsperpage})
            updatePublisherWithPages(publisher.id, pageInfos)
        }

        return res.status(200).json({success: true})
    } catch(err){
        return res.status(500).json({success: false, mess: 'Unknow error occurred in page update, please contact site Administrator'})
    }
})

exports.get = Controller(async(req, res) => {
    const publ = await publishers.findOne({
        where: { id: req.params.id }
    })

    const minPossibleAdsCountPerImage = conf.get('min_possible_ads_count_per_image') || 1
    const maxPossibleAdsCountPerImage = conf.get('max_possible_ads_count_per_image') || 4

    return res.status(200).json({success: true, publ: publ, minPossibleAdsCountPerImage: minPossibleAdsCountPerImage, maxPossibleAdsCountPerImage: maxPossibleAdsCountPerImage});
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
    const minPossibleAdsCountPerImage = conf.get('min_possible_ads_count_per_image') || 1
    const maxPossibleAdsCountPerImage = conf.get('max_possible_ads_count_per_image') || 4
    
    return res.status(200).json({success: true, server: server, minPossibleAdsCountPerImage: minPossibleAdsCountPerImage, maxPossibleAdsCountPerImage: maxPossibleAdsCountPerImage});
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

const createPublisher = async function(id, site, hostname, nickname, publisherId, adsperimage, adsperpage){
    return publishers.create({
        id: id,
        name: site,
        hostname: hostname,
        nickname: nickname,
        publisherId: publisherId,
        adsperimage: adsperimage,
        adsperpage: adsperpage,
        enabled: 'true'
    })
}

async function updatePublisher(body) {
    const publ = await publishers.findOne({
        where: { id: body.id }
    })
    
    await publ.update({name: body.name, nickname: body.nickname, name: body.name, adsperimage: body.adsperimage, adsperpage: body.adsperpage})
    
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