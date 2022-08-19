const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const website = require('../helper/website')
const { v4: uuidv4 } = require('uuid')
const seq = require('../campaigns-db/database')

exports.auth = Controller(async(req, res) => {

    check(req.params.id, function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            if(rows.length == 0){
                return res.status(401).json({success: false, type: 'notFound', message: 'Secret Code not valid'});
            }else{
                const site = rows[0].name
                res.status(200).json({success: true, site: site});
            }
        }
    })
})

exports.iframe = Controller(async(req, res) => {    
    let userId = req.query.userId;
    let sessionId = uuidv4();
    
    if (userId) {
        const clientIdFromDB = await getClientId(userId);
        
        if(!clientIdFromDB){
            userId = '';
        }
    } 
    
    if (!userId) {
        userId = uuidv4();
        createClientId(userId);
    } 

    return res.status(200).json({userId: userId, sessionId: sessionId});
})

exports.check = Controller(async(req, res) => {   
    let userId = req.query.userId;
    let sessionId = req.query.sessionId;
    let site = req.query.site.split('/')[2];
    
    if(site.includes('www.')){
        site = site.split('w.')[1]
    }
    
    
    checkSite(site, async function(err,rows){
        try {
            let data = null
        
            if(err){
                res.status(500).json(err)
            } else{
                if(rows.length == 0){
                    const locId = uuidv4();
                    let publisherId = ''
                    console.log(`Trying to register a new site ${site}`) 
                    const websiteResponse = await website.getWebsites()                                   

                    if(websiteResponse){
                        const currentSite = websiteResponse.filter( item => item.name == site)
                        publisherId = currentSite[0] ? currentSite[0].id : ''
                    }

                    if(!publisherId){
                        console.log(`${site} does not exist at Accesstrade, creating a new site there`) 
                        publisherId = await website.createWebsite(site,req.query.site.split('/')[0])
                    }

                    console.log(`Adding site ${site} to system`) 
                    const publisherData = await addPublisher(locId,site, publisherId)
                    createClientSession(sessionId, userId, publisherData.id);
                    return res.status(200).json({success: true, message: 'Site registered'})
                } else {
                    createClientSession(sessionId, userId, rows[0].id)
                    const site = rows[0].name
                    let extension = req.query.site.split(site)
                    let imgs
                    if(rows[0].pages != null){
                        if(JSON.parse(rows[0].pages)[1][extension[1]] != null){
                            imgs = JSON.parse(rows[0].pages)[1][extension[1]]
                        } else{
                            imgs = -1 
                        }
                    } else{
                        imgs = -1
                    }
                    
                    res.status(200).json({success: true, site: site, message: 'Site already registered', imgs: imgs})
                }
            }
        } catch(err){
            console.log(`Error in registering site ${site}`)
            console.log(err)
        }
    })    
})

function check(id,callback){
    return db.query(`SELECT * from publishers where id ='${id}'`,callback)
}

function checkSite(site,callback){
    return db.query(`SELECT * from publishers where name ='${site}'`,callback)
}

function createClientId(clientId) {
    return seq.client.create({
        id: clientId
    })
  }

function createClientSession(sessionId, clientId, publisherId) {
  return seq.clientSession.create({
        id: sessionId,
        clientId: clientId,
        publId: publisherId
  })
}

function getClientId(clientId) {
    return seq.client.findOne({
      where: { id: clientId }
    })
}

function addPublisher(id,site,idAffiliate){
    return seq.publishers.create({
        id: id,
        name: site,
        enabled: 'true',
        publisherId: idAffiliate
        })
}