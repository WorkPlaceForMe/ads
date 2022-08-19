const conf = require('../middleware/prop')
const axios = require('axios')
const aff = require('./affiliate')
const jwt = require('jsonwebtoken')
const seq = require('../campaigns-db/database')

exports.getWebsites = async function(){
    const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites`
    
    try{
        const credentials = await aff.getAff()
        const token = jwt.sign(
            { sub: credentials.userUid},
            credentials.secretKey,
            {
            algorithm: "HS256"
            }
        )
           
        console.log(`Calling url: ${affiliateEndpoint}`)

        const affiliateResponse = await axios.get(affiliateEndpoint, 
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Accesstrade-User-Type': 'publisher'
                }
        })

        return affiliateResponse.data
    } catch(err){
        console.error(`Error in getting website from Accesstrade`)
        console.error(err)
    }
}    

exports.createWebsite = async function(site,term){
    const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites`
    const affiliateEndpointCampaings = `${conf.get('accesstrade_endpoint')}/v1/campaigns/affiliate`
    
    try{
        const credentials = await aff.getAff()
        const token = jwt.sign(
            { sub: credentials.userUid},
            credentials.secretKey,
            {
            algorithm: "HS256"
            }
        )
           
        console.log(`Calling url: ${affiliateEndpoint}`)
        const affiliateResponse = await axios.put(affiliateEndpoint, 
            {
                "name": site,
                "url": `${term}//${site}`,
                "type": "PORTAL",
                "categories": [
                    {
                　　　　"value": 1
                    },
                    {
                　　　　"value": 7
                    }
                ],
                "description": "",
                "traffic": "OTHER_ORGANIC_TRAFFIC",
                "leadGeneration": "PROMOTION_BANNER"
            }
            ,{
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Accesstrade-User-Type': 'publisher'
                }
        })

        await axios.post(affiliateEndpointCampaings, 
            {
                "siteId": affiliateResponse.data.id,
                "campaignIds": [
                    conf.get('bigc.campaign_id'),
                    conf.get('lazada.campaign_id'),
                    conf.get('topsOnline.campaign_id'),
                    conf.get('jdCentral.campaign_id'),
                    conf.get('centralOnline.campaign_id')
                ]
            }
            ,{
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Accesstrade-User-Type': 'publisher'
                }
        })

        return affiliateResponse.data.id
    } catch(err){
        console.error(`Error in creating website ${site}`)
        console.error(err)
    }
}
