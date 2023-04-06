const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const website = require('../helper/website')
const { v4: uuidv4 } = require('uuid')
const seq = require('../campaigns-db/database')
const conf = require('../middleware/prop')
const { getHostname, adsCountPerSession } = require('../helper/util')

exports.auth = Controller(async(req, res) => {

    check(req.params.id, function(err, rows){
        if(err){
            res.status(500).json(err)
            }
        else{
            if(rows.length == 0){
                return res.status(401).json({success: false, type: 'notFound', message: 'Secret Code not valid'})
            } else{
                const site = rows[0].name
                res.status(200).json({success: true, site: site})
            }
        }
    })
})

exports.iframe = Controller(async(req, res) => {    
    const userId = await getClientId(req.query.userId)
    const sessionId = uuidv4()

    return res.status(200).json({userId: userId, sessionId: sessionId})
})

exports.check = Controller(async(req, res) => {   
    const userId = await getClientId(req.query.userId)
    const sessionId = req.query.sessionId
    let hostname = getHostname(req.query.site)
    
    let page = req.query.site

    if(page && page.endsWith('/')){
        page = page.substring(0, page.length -1)
    }
    
    checkSite(hostname, async function(err, rows){
        try {
            let data = null
        
            if(err){
                res.status(500).json(err)
            } else{
                if(rows.length == 0){
                    const locId = uuidv4();
                    let publisherId = ''
                    console.log(`Trying to register a new site ${hostname}`) 
                    const websiteResponse = await website.getWebsites()                                   

                    if(websiteResponse){
                        const currentSite = websiteResponse.filter( item => item.name == hostname)
                        publisherId = currentSite[0] ? currentSite[0].id : ''
                    }

                    if(!publisherId){
                        console.log(`${hostname} does not exist at Accesstrade, creating a new site there`) 
                        publisherId = await website.createWebsite(hostname, req.query.site.split('/')[0])
                    }

                    console.log(`Adding site ${hostname} to system`)
                    const minPossibleAdsCountPerImage = conf.get('min_possible_ads_count_per_image') || 1
                    const publisherData = await addPublisher(locId, hostname, publisherId, minPossibleAdsCountPerImage, minPossibleAdsCountPerImage)
                    
                    cache.setAsync(`${publisherData.hostname}-publisher`, JSON.stringify(publisherData))

                    if(sessionId) {
                        const clientSession = await getClientSessionBySessionId(sessionId)

                        if(!clientSession && userId) {
                            createClientSession(sessionId, userId, publisherData.id, page, 5)
                            delete adsCountPerSession[sessionId]
                            adsCountPerSession[sessionId] = 0
                        }
                    }
                    return res.status(200).json({success: true, message: 'Site registered'})
                } else {

                    if(rows[0].enabled != 'true'){
                        return res.status(200).json({success: false, site: hostname, message: 'Site Disabled'})
                    }

                    if(sessionId) {
                        const clientSession = await getClientSessionBySessionId(sessionId)
    
                        if(!clientSession && userId) {
                            createClientSession(sessionId, userId, rows[0].id, page, 5)
                            delete adsCountPerSession[sessionId]
                            adsCountPerSession[sessionId] = 0
                        }
                    }
                }               
                
                return res.status(200).json({success: true, site: hostname, message: 'Site already registered'})
            }
        } catch(err){
            console.log(`Error in registering site ${hostname}`)
            console.log(err)
            res.status(200).json({success: false, site: hostname, message: 'Error occurred'})
        }
    })    
})

function check(id, callback){
    return db.query(`SELECT * from publishers where id ='${id}'`, callback)
}

function checkSite(hostname, callback){
    return db.query(`SELECT * from publishers where hostname ='${hostname}'`, callback)
}

function createClientId(clientId) {
    return seq.client.create({
        id: clientId
    })
  }

function createClientSession(sessionId, clientId, publisherId, page, timeSlice) {
  return seq.clientSession.create({
        id: sessionId,
        clientId: clientId,
        publId: publisherId,
        site: page,
        duration: timeSlice
  })
}

function addPublisher(id, site, idAffiliate, adsperimage, adsperpage){
    return seq.publishers.create({
        id: id,
        name: site,
        hostname: site,
        nickname: site,
        enabled: 'true',
        publisherId: idAffiliate,
        adsperimage: adsperimage,
        adsperpage: adsperpage
    })
}

async function getClientId(userId){

    if (userId && userId != 'null') {
        const clientIdFromDB = await seq.client.findOne({
            where: { id: userId }
        })
        
        if(!clientIdFromDB){
            userId = ''
        }
    } 
    
    if (!userId || userId == 'null') {
        userId = uuidv4()
        createClientId(userId)
    } 

    return userId
}

async function getClientSessionBySessionId(sessionId) {
    return seq.clientSession.findOne({
      where: { id: sessionId }
    })
}