const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')

exports.report = async function(init,fin,siteId,){
    return new Promise(function(resolve, reject){
        
        aff.getAff.then(async function(credentials){
            const token = jwt.sign(
                { sub: credentials.userUid},
                credentials.secretKey,
                {
                algorithm: "HS256"
                }
            )

            const dateInit = init
            const dateFin = fin
            const periodBase = `CONFIRMATION_DATE`
            const conversion = `APPROVED`
            const ids = {
                lazada : 520,
                trueShopping : 594,
                shopee : 677,
            }
            let rewards = {};
            for(const id in ids){
                const endpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/reports/conversion?fromDate=${encodeURIComponent(dateInit)}&toDate=${encodeURIComponent(dateFin)}&siteId=${siteId}&campaignId=${ids[id]}&periodBase=${periodBase}&conversionStatuses=${conversion}`

                try{
                    const affiliateResponse = await axios.get(endpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Accesstrade-User-Type': 'publisher'
                        }
                    })
                    rewards['totalReward'] = (rewards['totalReward']  || 0) + (affiliateResponse.data.totalReward || 0)
                    rewards['totalConversionsCount'] = (rewards['totalConversionsCount']  || 0) + (affiliateResponse.data.totalConversionsCount || 0)

                } catch(err) {
                    console.error(err)
                    rewards['totalReward'] = 0
                    rewards['totalConversionsCount'] = 0
                }
            }

            resolve(rewards)
        }).catch((err)=>{console.error(err)})
    });
}

