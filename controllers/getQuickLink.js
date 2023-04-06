const Controller = require('../helper/controller')
const conf = require('../middleware/prop')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const aff = require('../helper/affiliate')

exports.getQuickLink = Controller(async(req, res) => {
    const siteId = 48475; //TODO: Change this hardcoded site ID to automatically fetching later on
    const campaignId = 660; //TODO: Change this hardcoded campaign ID to automatically fetching later on
    const dateInit = `2021-07-01T00:00:00+09:00`
    const dateFin = `2021-07-09T00:00:00+09:00`
    const periodBase = `CONFIRMATION_DATE`
    const conversion = `APPROVED`
    const ids = {
        bigc : 308,
        lazada : 520,
        topsOnline : 704,
        jdCentral : 722,
        centralOnline : 730
    }
    
    let results = [];
for(const id in ids){

        aff.getAff.then(async function(credentials){
        const token = jwt.sign(
            { sub: credentials.userUid},
            credentials.secretKey,
            {
            algorithm: "HS256"
            }
        )
        const endpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/reports/conversion?fromDate=${encodeURIComponent(dateInit)}&toDate=${encodeURIComponent(dateFin)}&siteId=${siteId}&campaignId=${ids[id]}&periodBase=${periodBase}&conversionStatuses=${conversion}`

        try{
            console.log(`Calling url: ${endpoint}`)
            const affiliateResponse = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Accesstrade-User-Type': 'publisher'
                }
            })
            console.log(affiliateResponse.data, '=========')

        } catch(err) {
            console.error(err)

        }
    }).catch((err)=>{console.error(err)})

}
res.status(200).json({success:true})
})