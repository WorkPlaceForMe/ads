const conf = require('../middleware/prop')
const axios = require('axios')
const aff = require('./affiliate')
const jwt = require('jsonwebtoken')
const db = require('./dbconnection')
const seq = require('../campaigns-db/database')
const publishers = seq.publishers

exports.create = async function(id,site,term){
    return new Promise((resolve, reject) =>{

    const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites`
    const affiliateEndpointCampaings = `${conf.get('accesstrade_endpoint')}/v1/campaigns/affiliate`

    aff.getAff.then(async function(credentials){
        const token = jwt.sign(
            { sub: credentials.userUid},
            credentials.secretKey,
            {
            algorithm: "HS256"
            }
        )

        try{
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

            await addPublisher(id,site,affiliateResponse.data.id)

            try{
                const campaingResponse = await axios.post(affiliateEndpointCampaings, 
                    {
                        "siteId": affiliateResponse.data.id,
                        "campaignIds": [
                            520,
                            594,
                            677
                        ]
                    }
                    ,{
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Accesstrade-User-Type': 'publisher'
                        }
                })

                resolve(campaingResponse.data)
            } catch(err) {
                console.error(err)
                reject(err)
            }

        } catch(err) {
            console.error(err)
            reject(err)
        }
    }).catch((err)=>{console.error(err)})
})
}

const addPublisher = async function(id,site,idAffiliate){
    return publishers.create({
        id: id,
        name: site,
        enabled: 'true',
        publisherId: idAffiliate
        })
}