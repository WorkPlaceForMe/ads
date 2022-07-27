const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')

exports.report = async function(init,fin,siteId,){
    try{
        const credentials = await aff.getAff()
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
                bigc : 308,
                lazada : 520,
                topsOnline : 704,
                jdCentral : 722,
                centralOnline : 730
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

            return(rewards)
    }catch(err){
        console.error(err)
    }
}

