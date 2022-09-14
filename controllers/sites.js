const Controller = require('../helper/controller')
const db1 = require('../campaigns-db/database')
const publishers = db1.publishers
const { v4: uuidv4 } = require('uuid')
const conf = require('../middleware/prop')
const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const cache = require('../helper/cacheManager')
const { deleteRedisData } = require('../helper/util')
const website = require('../helper/website')

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
            console.log(`${data.name}} does not exist at Accesstrade, creating a new site there`) 
            publisherId = await website.createWebsite(data.name, null)
        }

        console.log(`Adding site ${data.name}} to system`)
        if(publisherId){
            await createPublisher(locId, data.name, data.nickname, publisherId, data.adsperimage)
            return res.status(200).json({success: true});
        } else {
            console.log(`Cannot add site ${data.name}} to system`)
            return res.status(500).json({success: false, mess: `Cannot add site ${data.name}} to system`})
        }
       
    } catch(err){
        console.log(`Cannot add site ${site} to system`)
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

        if(newPublisher && oldAdsPerImage > 0 & newPublisher.dataValues.adsperimage != oldAdsPerImage){
            deleteRedisData(newPublisher.dataValues.name).then(() => {                 
                console.log(`All redis cache data deleted for publisher ${newPublisher.dataValues.name}`)
                cache.setAsync(`${data.name}-publisher`, JSON.stringify(newPublisher)).then()
              }).catch(error => {
                console.error(error, `Error deleting redis cachec data for publisher ${newPublisher.dataValues.name}`)
              })
        }

        return res.status(200).json({success: true});
    }catch(err){
        return res.status(500).json({success: false, mess: 'Unknow error occurred, please contact site Administrator'})
    }
})

exports.get = Controller(async(req, res) => {
    const publ = await publishers.findOne({
        where: { id: req.params.id },
    })


    const minPossibleAdsCount = conf.get('min_possible_ads_count') || 1
    const maxPossibleAdsCount = conf.get('max_possible_ads_count') || 4

    return res.status(200).json({success: true, publ: publ, minPossibleAdsCount: minPossibleAdsCount, maxPossibleAdsCount: maxPossibleAdsCount});
})

exports.getAll = Controller(async(req, res) => {
    const publ = await publishers.findAll()
    res.status(200).json({success: true, publ: publ});
})

exports.getServer = Controller(async(req, res) => {
    const server = conf.get('server')
    const minPossibleAdsCount = conf.get('min_possible_ads_count') || 1
    const maxPossibleAdsCount = conf.get('max_possible_ads_count') || 4
    
    return res.status(200).json({success: true, server: server, minPossibleAdsCount: minPossibleAdsCount, maxPossibleAdsCount: maxPossibleAdsCount});
})

exports.del = Controller(async(req, res) => {
    const data = req.params.id
    const credentials = await aff.getAff()

    const token = jwt.sign(
        { sub: credentials.userUid},
        credentials.secretKey,
        {
        algorithm: "HS256"
        }
    )
    try{
        const publ = await publishers.findOne({
            where: { id: req.params.id },
        })
        const affiliateEndpointCampaings = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${publ.dataValues.publisherId}`
        
        try{
            console.log(`Calling url: ${affiliateEndpointCampaings}`)
            await axios.delete(affiliateEndpointCampaings
                ,{
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Accesstrade-User-Type': 'publisher'
                    }
            })
            
            await delSite(data)
            
            cache.del(`downloading-${publ.dataValues.publisherId}`)
            cache.del(`saving-productAndClothsData-${publ.dataValues.publisherId}`)
            cache.del(`productAndClothsData-${publ.dataValues.publisherId}`) 
            deleteRedisData(publ.dataValues.name).then(() => {                 
                console.log(`All redis cache data deleted for publisher ${publ.dataValues.name}`)
              }).catch(error => {
                console.error(error, `Error deleting redis cachec data for publisher ${publ.dataValues.name}`)
              })
            res.status(200).json({success: true});
        }catch(err){
            res.status(500).json({success: false, mess: err})
        }
    }catch(err){
        res.status(500).json({success: false, mess: err})
    }
})

const createPublisher = async function(id, site, nickname, publisherId, adsperimage){
    return publishers.create({
        id: id,
        name: site,
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

